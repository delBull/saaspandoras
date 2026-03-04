import { NextResponse } from "next/server";
import { getAuth, isAdmin } from "@/lib/auth";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Note: Edge runtime may not support all Node.js APIs
// This is why we have runtime = "nodejs" at top

export async function GET(request: Request) {
  console.log("🩺 Route hit: /api/admin/verify");
  try {
    console.log("🛠️ DEBUG: API admin/verify called START");

    const { session } = await getAuth(request.headers);
    console.log("😎 VERIFY: session found:", session);
    console.log("🔍 Raw session userId:", session?.userId);

    // All addresses are already lowercase from session
    const userIsSuperAdmin = session?.userId === SUPER_ADMIN_WALLET.toLowerCase();
    console.log("👑 Super Admin check:", userIsSuperAdmin);
    console.log("🔍 Session userId (lowercase):", session?.userId);
    console.log("🔍 SUPER_ADMIN_WALLET (lowercase):", SUPER_ADMIN_WALLET.toLowerCase());
    console.log("🔍 Comparison:", session?.userId, "===", SUPER_ADMIN_WALLET.toLowerCase(), "→", userIsSuperAdmin);

    let userIsAdmin = false;
    if (session?.userId) {
      console.log("🔍 Checking admin status for:", session.userId);
      userIsAdmin = await isAdmin(session.userId);
      console.log("✅ Admin check result:", userIsAdmin);
    } else {
      console.log("❌ NO SESSION USERID FOUND");
    }

    console.log("� FINAL RESULT:", { isAdmin: userIsAdmin, isSuperAdmin: userIsSuperAdmin });

    console.log("🎯 FINAL DEBUG RETURN:", { isAdmin: userIsAdmin, isSuperAdmin: userIsSuperAdmin });

    return NextResponse.json({ isAdmin: userIsAdmin, isSuperAdmin: userIsSuperAdmin });
  } catch (error) {
    console.error("💥 CRITICAL ERROR in /api/admin/verify:", error);

    // Check if it's a quota issue - More comprehensive check
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
        error: "Your database plan has reached its data transfer limit. Please upgrade your plan or contact support.",
        quotaExceeded: true
      }, { status: 503 }); // Service Unavailable
    }

    return NextResponse.json({ isAdmin: false, isSuperAdmin: false }, { status: 500 });
  }
}
