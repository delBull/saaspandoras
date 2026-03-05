import { NextResponse } from "next/server";
import { getAuth, isAdmin } from "@/lib/auth";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { session } = await getAuth(request.headers);
    const userIsSuperAdmin = session?.userId === SUPER_ADMIN_WALLET.toLowerCase();

    let userIsAdmin = false;
    if (session?.userId) {
      userIsAdmin = await isAdmin(session.userId);
    }

    return NextResponse.json({ isAdmin: userIsAdmin, isSuperAdmin: userIsSuperAdmin });
  } catch (error) {
    console.error("💥 CRITICAL ERROR in /api/admin/verify:", error);

    if (error instanceof Error && (
      error.message.includes('quota') ||
      error.message.includes('limit') ||
      error.message.includes('exceeded') ||
      error.message.includes('rate limit') ||
      error.message.includes('too many') ||
      error.message.includes('connection pool') ||
      error.message.includes('timeout')
    )) {
      return NextResponse.json({
        message: "Database quota exceeded",
        error: "Your database plan has reached its data transfer limit.",
        quotaExceeded: true
      }, { status: 503 });
    }

    return NextResponse.json({ isAdmin: false, isSuperAdmin: false }, { status: 500 });
  }
}
