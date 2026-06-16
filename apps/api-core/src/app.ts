import express, { type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import crypto from "crypto";
import { Redis } from "ioredis";
import { RateLimiterRedis, RateLimiterMemory } from "rate-limiter-flexible";

const app = express();

// ⚡ Redis Connection (rate limiting)
const redisUrl = process.env.REDIS_URL;
let redis: InstanceType<typeof Redis> | null = null;
if (redisUrl) {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => Math.min(times * 100, 3000),
    lazyConnect: true,
  });
  redis.on("error", (err: Error) => console.warn("⚠️ Redis connection error:", err.message));
  redis.on("connect", () => console.log("✅ Redis connected for rate limiting"));
}

const rateLimiter = redis
  ? new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "rl:api-core:",
      points: 300,
      duration: 60,
      blockDuration: 60,
    })
  : new RateLimiterMemory({
      keyPrefix: "rl:api-core:",
      points: 300,
      duration: 60,
      blockDuration: 60,
    });

// ☁️ Trust Proxy (Railway / Vercel Load Balancers)
app.set("trust proxy", 1);

// 🔍 DEBUG MIDDLEWARE (Trace only in dev, never log cookies)
app.use((req, res, next) => {
    if (process.env.DEBUG_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
        console.log(`🔍 [DEBUG API] ${req.method} ${req.url} | Origin: ${req.headers.origin}`);
    }
    next();
});

// 🌐 CORS Configuration (MUST BE FIRST)
const ALLOWED_ORIGINS = [
    'https://pandoras.finance',
    'https://dash.pandoras.finance',
    'https://staging.dash.pandoras.finance',
    'https://www.pandoras.finance',
    'http://localhost:3000',
    'http://localhost:3001',
];
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || ALLOWED_ORIGINS.includes(origin)) {
                callback(null, true);
            } else {
                console.warn(`🚫 CORS blocked origin: ${origin}`);
                callback(null, false);
            }
        },
        credentials: true, // Required for cookies
    })
);

// 📦 Body Parsers (MUST BE AFTER CORS)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// 🛡️ Security Headers
app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false,
}));

// 🚨 FORCE Headers for Social Login (Explicitly match Frontend)
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    next();
});

// 🔑 STARTUP KEY CHECK
try {
    const priv = process.env.JWT_PRIVATE_KEY;
    const pub = process.env.JWT_PUBLIC_KEY;
    if (priv && pub) {
        const privateKey = Buffer.from(priv, "base64").toString("utf-8");
        const publicKey = Buffer.from(pub, "base64").toString("utf-8");

        const sign = crypto.createSign('RSA-SHA256');
        sign.update('test');
        const sig = sign.sign(privateKey, 'base64');
        const verify = crypto.createVerify('RSA-SHA256');
        verify.update('test');
        const isValid = verify.verify(publicKey, sig, 'base64');
        if (isValid) {
            console.log("✅ JWT Key Pair Integrity Verified: MATCH");
        } else {
            console.error("❌ JWT Key Pair Integrity Verified: MISMATCH - Public key cannot verify Private key signature!");
        }
    } else {
        console.warn("⚠️ JWT Keys missing, skipping integrity check");
    }
} catch (e) {
    console.error("❌ Key Integrity Check Failed:", e);
}

// ...

// ...

// ... (CORS is now at the top)

// 🏥 Healthcheck (Railway) — no rate limited
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// 🚦 Rate Limiting Middleware (Redis-backed when REDIS_URL is set)
const rateLimitedPaths = ['/auth', '/webhooks', '/external', '/api/v1/external'];
app.use((req, res, next) => {
    const shouldLimit = rateLimitedPaths.some(p => req.path.startsWith(p));
    if (!shouldLimit) return next();

    const key = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    rateLimiter.consume(key)
        .then(() => next())
        .catch((rej: any) => {
            res.status(429).json({
                error: 'Too many requests',
                retryAfter: Math.ceil((rej.msBeforeNext || 60000) / 1000),
            });
        });
});

import authRoutes from "./routes/auth.js";
import webhookRoutes from "./routes/webhooks.js";
import debugRoutes from "./routes/debug.js";
import tenantRoutes from "./routes/tenants.js";
import externalProxy from "./routes/external-proxy.js";

//...

// 🚀 Routes
app.use("/auth", authRoutes);
app.use("/webhooks", webhookRoutes);
if (process.env.NODE_ENV !== 'production') {
    app.use("/debug", debugRoutes); // DEBUG ONLY
}
app.use("/tenants", tenantRoutes);

// 📡 External API Proxy (MUST cover /api/v1/external and /external)
app.use("/", externalProxy);

app.get("/", (req: Request, res: Response) => {
    res.json({
        message: "Pandoras API Core v1",
        version: "1.1.0-CORS-FIX-DEBUG",
        timestamp: new Date().toISOString()
    });
});

export default app;
