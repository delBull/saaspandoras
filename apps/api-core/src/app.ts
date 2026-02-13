import express, { type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

// 🛡️ Security Headers
app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false,
}));

// ...

// 🌐 CORS Configuration
app.use(
    cors({
        origin: true, // Allow ANY origin (Reflects the request origin)
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
    res.json({
        message: "Pandoras API Core v1",
        version: "1.1.0-CORS-FIX-DEBUG",
        timestamp: new Date().toISOString()
    });
});

export default app;
