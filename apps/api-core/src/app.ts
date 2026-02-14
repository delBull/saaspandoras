import express, { type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

// 🌐 CORS Configuration (MUST BE FIRST)
app.use(
    cors({
        origin: true, // Allow ANY origin (Reflects the request origin)
        credentials: true, // Required for cookies
    })
);

// 🛡️ Security Headers
app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false,
}));

// 🚨 FORCE Headers for Social Login (Explicitly match Frontend)
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
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
        const crypto = require("crypto"); // dynamic import for check
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

// 🏥 Healthcheck (Railway)
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

import authRoutes from "./routes/auth.js";
import webhookRoutes from "./routes/webhooks.js";

// ...

// 🚀 Routes
app.use("/auth", authRoutes);
app.use("/webhooks", webhookRoutes);

app.get("/", (req: Request, res: Response) => {
    res.json({
        message: "Pandoras API Core v1",
        version: "1.1.0-CORS-FIX-DEBUG",
        timestamp: new Date().toISOString()
    });
});

export default app;
