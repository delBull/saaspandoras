import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME
export const runtime = "nodejs";
export async function GET(request: Request) {
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

        let publicKey = process.env.JWT_PUBLIC_KEY;
        
        // Handle Base64 encoded keys (Starts with LS0tLS1 which is '-----')
        if (publicKey?.startsWith('LS0tLS1')) {
            console.log("✅ [Dashboard /api/auth/me] Detected Base64 encoded JWT_PUBLIC_KEY. Decoding...");
            publicKey = Buffer.from(publicKey, 'base64').toString('utf-8');
        }

        // Clean up PEM formatting and replace literal \n
        publicKey = publicKey?.replace(/\\n/g, '\n');
        
        const secret = publicKey || process.env.JWT_SECRET || process.env.JWT_PRIVATE_KEY;
        
        if (!secret) {
            console.error("❌ JWT Configuration Error: Missing Secret/Public Key");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        let payload: any;
        try {
            // Unify with login: use jsonwebtoken syntax
            payload = jwt.verify(token, secret, {
                algorithms: publicKey ? ['RS256'] : ['HS256']
            });
            console.log("✅ [Dashboard /api/auth/me] Verified session for:", payload.address || payload.sub);
        } catch (e) {
            const error = e as Error;
            console.warn("⚠️ [Dashboard /api/auth/me] JWT Verification failed:", error.message);
            console.warn("   - Error Code:", (error as any).code);
            console.warn("   - Token present:", !!token);

            let errorType = "Invalid session";
            if (error.message.includes("expired")) {
                errorType = "Session expired";
                console.log("⏰ Token is expired.");
            } else if (error.message.includes("signature") || (error as any).code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") {
                errorType = "Invalid signature - Check JWT keys";
                console.error("🔑 SIGNATURE MISMATCH: The token signature does not match the public key.");
            } else if ((error as any).code === "ERR_JOSE_INVALID_KEY_INPUT") {
                errorType = "Invalid Public Key Configuration";
            }

            return NextResponse.json({ authenticated: false, error: errorType }, {
                status: 401,
                headers: { "Cache-Control": "no-store" }
            });
        }

        const address = payload.address || payload.walletAddress || payload.sub;

        // Verify if requested address matches JWT session (prevents session cross-pollination locally & prod)
        const reqAddress = request.headers.get("x-thirdweb-address") || request.headers.get("x-wallet-address");
        if (reqAddress && address && reqAddress.toLowerCase() !== address.toLowerCase()) {
            console.warn(`❌ [Dashboard /api/auth/me] Session Mismatch: Token(${address.toLowerCase()}) !== Requested(${reqAddress.toLowerCase()})`);

            // Clear the stale cookie
            const cookieDomain = process.env.NODE_ENV === "production" ? (process.env.COOKIE_DOMAIN || ".pandoras.finance") : undefined;

            const cookieOptions = {
                name: "auth_token",
                path: "/",
                ...(cookieDomain && { domain: cookieDomain })
            };

            (await cookies()).delete(cookieOptions as any);

            return NextResponse.json({ authenticated: false, error: "Session mismatch" }, {
                status: 401,
                headers: { "Cache-Control": "no-store" }
            });
        }

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
