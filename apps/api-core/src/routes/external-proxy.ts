import { Router, type Request, type Response } from "express";

const router = Router();

// 💡 INTERNAL RAILWAY URL: For service-to-service communication
// Use HTTP to avoid SSL overhead within the internal network
const DASHBOARD_URL = process.env.DASHBOARD_INTERNAL_URL || "http://saaspandoras.railway.internal";

/**
 * PROXY ROUTER: Captures external API requests and forwards them to the Dashboard Next.js app.
 * Supports: 
 *  - /api/v1/external/* (Standard format)
 *  - /external/* (Shortcut format)
 *  - /growth-os/*, /protocols/*, /users/*, /payments/* (Direct format — requested by Bull's Lab)
 */
const EXTERNAL_PATHS = [
    "/api/v1/external/*",
    "/external/*",
    "/growth-os/*",
    "/protocols/*",
    "/users/*",
    "/payments/*",
    "/agora/*",
    "/governance/*",
    "/operations/*"
];

router.all(EXTERNAL_PATHS, async (req: Request, res: Response) => {
    // 🛡️ INFINITE LOOP GUARD
    // Prevent api-core from proxying to itself if DASHBOARD_URL is accidentally set to its own public domain
    if (DASHBOARD_URL.includes(req.get("host") || "")) {
        console.error("🚨 [PROXY] Infinite loop detected! DASHBOARD_INTERNAL_URL matches current host.");
        return res.status(500).json({ error: "Configuration Error: Infinite Loop detected in proxy." });
    }

    // Normalize the path: Ensure it always uses the /api/v1/external prefix for the dashboard
    let targetPath = req.originalUrl;
    
    // Add prefix if missing
    if (!targetPath.startsWith("/api/v1/external")) {
        if (targetPath.startsWith("/external")) {
            targetPath = `/api/v1${targetPath}`;
        } else {
            // e.g., /growth-os/metrics -> /api/v1/external/growth-os/metrics
            targetPath = `/api/v1/external${targetPath}`;
        }
    }

    const targetUrl = `${DASHBOARD_URL}${targetPath}`;
    
    console.log(`📡 [PROXY] ${req.method} ${req.originalUrl} -> ${targetUrl}`);

    try {
        const headers: Record<string, string> = {};
        
        // Forward essential headers for auth and content
        ["x-api-key", "authorization", "content-type", "accept"].forEach(h => {
            if (req.headers[h]) headers[h] = req.headers[h] as string;
        });

        const fetchOptions: RequestInit = {
            method: req.method,
            headers: headers,
            // @ts-ignore - timeout is supported in newer fetch versions or node-fetch
            timeout: 8000, 
        };

        // Forward body for mutating requests
        if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
            fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, fetchOptions);
        
        // Return raw text if not JSON to avoid crashing on HTML 404s from Next.js
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            const data = await response.json();
            return res.status(response.status).json(data);
        } else {
            const text = await response.text();
            return res.status(response.status).send(text);
        }
    } catch (error: any) {
        console.error(`❌ [PROXY] Internal connectivity error to ${targetUrl}:`, error.message);
        return res.status(502).json({
            error: "Bad Gateway",
            message: "La comunicación interna con el servicio Dashboard falló.",
            details: error.message,
            hint: "Verifica que el servicio Dashboard esté arriba y que DASHBOARD_INTERNAL_URL sea correcta."
        });
    }
});

export default router;
