import { Router, type Request, type Response } from "express";

const router = Router();

// DEBUG endpoint to test if cookies work
router.get("/test-cookie", (req: Request, res: Response) => {
    const isProd = process.env.NODE_ENV === "production";
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

    console.log("🧪 TEST COOKIE - Environment:", {
        isProd,
        cookieDomain,
        NODE_ENV: process.env.NODE_ENV
    });

    res.cookie("test_cookie", "hello_from_api", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        domain: cookieDomain,
        path: "/",
        maxAge: 1000 * 60 * 5 // 5 minutes
    });

    return res.status(200).json({
        message: "Test cookie set!",
        config: {
            isProd,
            cookieDomain,
            secure: isProd,
            sameSite: isProd ? "none" : "lax"
        }
    });
});

// DEBUG endpoint to check cookies received
router.get("/check-cookies", (req: Request, res: Response) => {
    console.log("🍪 RECEIVED COOKIES:", req.cookies);
    console.log("📋 HEADERS:", req.headers);

    return res.status(200).json({
        cookies: req.cookies,
        cookieHeader: req.headers.cookie,
        allHeaders: Object.keys(req.headers)
    });
});

export default router;
