
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-dev-key";

export async function GET() {
    const token = (await cookies()).get("auth_token")?.value;
    if (!token) {
        return NextResponse.json({ user: null });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET) as any;
        return NextResponse.json({
            user: {
                address: verified.sub,
                hasAccess: verified.hasAccess
            }
        });
    } catch (e) {
        return NextResponse.json({ user: null });
    }
}
