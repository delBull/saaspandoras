import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para evitar errores con jsonwebtoken
export const runtime = "nodejs";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-dev-key";

interface JWTPayload {
    userId?: string;
    sub?: string;
    address?: string;
    walletAddress?: string; // Legacy fallback
    role?: string;
    scope?: string;
    hasAccess?: boolean;
    iat?: number;
    exp?: number;
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json({ authenticated: false, error: "No session token found" }, {
                status: 401,
                headers: { "Cache-Control": "no-store" }
            });
        }

        let verified: JWTPayload;
        try {
            verified = jwt.verify(token, JWT_SECRET) as JWTPayload;
        } catch (e) {
            return NextResponse.json({ authenticated: false, error: "Invalid or expired session" }, {
                status: 401,
                headers: { "Cache-Control": "no-store" }
            });
        }

        const address = verified.address || verified.walletAddress || verified.sub;

        return NextResponse.json({
            authenticated: true,
            user: {
                id: verified.sub || verified.userId,
                address: address,
                role: verified.role || "user",
                scope: verified.scope,
                hasAccess: verified.hasAccess || false,
                expiresAt: verified.exp ? new Date(verified.exp * 1000).toISOString() : null,
            }
        }, {
            headers: { "Cache-Control": "no-store" }
        });

    } catch (error) {
        console.error("❌ Auth Me Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
