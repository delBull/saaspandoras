import { NextResponse } from "next/server";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Note: Edge runtime may not support all Node.js APIs
// This is why we have runtime = "nodejs" at top

export async function GET() {
  try {
    console.log("🛠️ DEBUG: API admin/verify called START");

    const headersObj = await headers();
    console.log("🔍 DEBUG: Headers object received");

    const { session } = await getAuth(headersObj);
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
    return NextResponse.json({ isAdmin: false, isSuperAdmin: false }, { status: 500 });
  }
}
