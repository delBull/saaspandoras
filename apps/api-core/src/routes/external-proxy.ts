import { Router, type Request, type Response } from "express";

const router = Router();

// Configure the target URL for the dashboard
// Since the user says the internal URL is the same, we'll try hitting the root domain without port 8080.
// We'll use an environment variable for flexibility.
const DASHBOARD_URL = process.env.DASHBOARD_INTERNAL_URL || "https://saaspandoras-production.up.railway.app";

/**
 * PROXY ROUTE: /api/v1/external/* and /external/*
 * Redirects all external API calls to the dashboard app.
 */
router.all(["/api/v1/external/*", "/external/*"], async (req: Request, res: Response) => {
    // Normalize the path: Ensure it always uses the /api/v1/external prefix for the dashboard
    let targetPath = req.originalUrl;
    if (targetPath.startsWith("/external")) {
        targetPath = `/api/v1${targetPath}`;
    }

    const targetUrl = `${DASHBOARD_URL}${targetPath}`;
    
    console.log(`📡 [PROXY] Forwarding ${req.method} ${req.originalUrl} -> ${targetUrl}`);

    try {
        const headers: Record<string, string> = {};
        
        // Forward essential headers
        if (req.headers["x-api-key"]) headers["x-api-key"] = req.headers["x-api-key"] as string;
        if (req.headers["authorization"]) headers["authorization"] = req.headers["authorization"] as string;
        if (req.headers["content-type"]) headers["content-type"] = req.headers["content-type"] as string;

        const fetchOptions: RequestInit = {
            method: req.method,
            headers: headers,
        };

        // Forward body for POST/PUT/PATCH
        if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, fetchOptions);
        const data = await response.json();

        // Return the response from the dashboard
        return res.status(response.status).json(data);
    } catch (error: any) {
        console.error(`❌ [PROXY] Error forwarding to ${targetUrl}:`, error.message);
        return res.status(502).json({
            error: "Bad Gateway",
            message: "Failed to forward request to the dashboard service.",
            details: error.message
        });
    }
});

export default router;
