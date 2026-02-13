import express, { type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

// 🛡️ Security Headers
app.use(helmet());

// 📝 Logging
app.use(morgan("dev"));

// 🍪 Parsers
app.use(express.json());
app.use(cookieParser());

// 🔍 Change: Debug Headers & Cookies
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    console.log("🍪 Cookies:", req.cookies);
    console.log("🧩 Origin:", req.headers.origin);
    next();
});

// 🌐 CORS Configuration
// Critical for HttpOnly cookies to work cross-origin
const allowedOrigins = [
    "https://app.pandoras.org",
    "https://staging.pandoras.org",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            if (allowedOrigins.indexOf(origin) === -1) {
                // Debug logging for development
                console.warn(`⚠️ CORS Blocked Origin: ${origin}`);

                // Strict in production, permissive in dev?
                if (process.env.NODE_ENV !== "production") {
                    return callback(null, true);
                }

                const msg = "The CORS policy for this site does not allow access from the specified Origin.";
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
        credentials: true, // Required for cookies
    })
);

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
    res.json({ message: "Pandoras API Core v1" });
});

export default app;
