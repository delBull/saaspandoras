import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify, importSPKI } from "jose";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME
export const runtime = "nodejs";

const JWT_PUBLIC_KEY_B64 = process.env.JWT_PUBLIC_KEY;

export async function GET() {
    try {
        // 🚀 DEV_FAST MODE: Instant Mock Session
        if (process.env.NEXT_PUBLIC_DEV_FAST === "true" && process.env.NODE_ENV === "development") {
            const cookieStore = await cookies();
            const walletAddress = cookieStore.get("wallet-address")?.value || "0xDEV_USER";

            return NextResponse.json({
                authenticated: true,
                user: {
                    id: "dev-user-id",
                    address: walletAddress,
                    role: "admin",
                    scope: "web",
                    hasAccess: true,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                }
            }, {
                headers: { "Cache-Control": "no-store" }
            });
        }

        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json({ authenticated: false, error: "No session token found" }, {
                status: 401,
                headers: { "Cache-Control": "no-store" }
            });
        }

        if (!JWT_PUBLIC_KEY_B64) {
            console.error("❌ JWT_PUBLIC_KEY is not defined in environment variables");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        let payload: any;
        try {
            // Decode base64 PEM if necessary
            const publicKeyPem = JWT_PUBLIC_KEY_B64.startsWith("-----")
                ? JWT_PUBLIC_KEY_B64
                : Buffer.from(JWT_PUBLIC_KEY_B64, "base64").toString("utf-8");

            const publicKey = await importSPKI(publicKeyPem, "RS256");
            const result = await jwtVerify(token, publicKey, {
                algorithms: ["RS256"],
            });
            payload = result.payload;
            console.log("✅ [Dashboard /api/auth/me] Verified session for:", payload.address || payload.sub);
        } catch (e) {
            const error = e as Error;
            console.warn("⚠️ [Dashboard /api/auth/me] JWT Verification failed:", error.message);

            let errorType = "Invalid session";
            if (error.message.includes("expired")) errorType = "Session expired";
            else if (error.message.includes("signature")) errorType = "Invalid signature - Check JWT keys";

            return NextResponse.json({ authenticated: false, error: errorType }, {
                status: 401,
                headers: { "Cache-Control": "no-store" }
            });
        }

        const address = payload.address || payload.walletAddress || payload.sub;

        return NextResponse.json({
            authenticated: true,
            user: {
                id: payload.sub || payload.userId,
                address: address,
                role: payload.role || "user",
                scope: payload.scope,
                hasAccess: payload.hasAccess || false,
                expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
            }
        }, {
            headers: { "Cache-Control": "no-store" }
        });

    } catch (error) {
        console.error("❌ Auth Me Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
