import { Router, type Request, type Response } from "express";

const router = Router();

// 🧠 DYNAMIC ENVIRONMENT DETECTION
// 1. Check if an explicit URL is provided in env vars
// 2. Fallback to staging/main based on NODE_ENV or RAILWAY_ENVIRONMENT_NAME
const PROD_URL = "https://dash.pandoras.finance";
const STAGING_URL = "https://staging.dash.pandoras.finance";

const getTargetBaseUrl = () => {
    // If user provided an override, use it
    if (process.env.DASHBOARD_INTERNAL_URL) {
        let url = process.env.DASHBOARD_INTERNAL_URL;
        // Ensure protocol exists
        if (!url.startsWith("http")) {
            url = `https://${url}`;
        }
        return url;
    }

    // Default detection logic
    const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT_NAME === "production";
    return isProduction ? PROD_URL : STAGING_URL;
};

const DASHBOARD_URL = getTargetBaseUrl();

/**
 * PROXY ROUTER: Captures external API requests and forwards them to the Dashboard Next.js app.
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
    if (DASHBOARD_URL.includes(req.get("host") || "none_host")) {
        console.error("🚨 [PROXY] Infinite loop detected!");
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
