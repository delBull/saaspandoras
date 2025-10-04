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

    // 🚫 DEBUG OVERRIDE - Force admin for testing
    const debugOverride = session?.userId?.toLowerCase() === SUPER_ADMIN_WALLET.toLowerCase();
    console.log("🛠️ DEBUG OVERRIDE LOGIC:");
    console.log("- session?.userId exists:", !!session?.userId);
    console.log("- session?.userId.toLowerCase():", session?.userId?.toLowerCase());
    console.log("- SUPER_ADMIN_WALLET.toLowerCase():", SUPER_ADMIN_WALLET.toLowerCase());
    console.log("- override should be:", debugOverride);

    console.log("📋 FINAL RESULT:", { isAdmin: userIsAdmin, isSuperAdmin: userIsSuperAdmin });
    console.log("🛠️ DEBUG OVERRIDE:", debugOverride ? "FORCE ACTIVATED" : "FORCE NOT ACTIVATED");

    // Remove this debug override once production deploy works correctly
    const finalIsAdmin = debugOverride ? true : userIsAdmin;
    const finalIsSuperAdmin = debugOverride ? true : userIsSuperAdmin;

    console.log("🎯 FINAL DEBUG RETURN:", { isAdmin: finalIsAdmin, isSuperAdmin: finalIsSuperAdmin });

    return NextResponse.json({ isAdmin: finalIsAdmin, isSuperAdmin: finalIsSuperAdmin });
  } catch (error) {
    console.error("💥 CRITICAL ERROR in /api/admin/verify:", error);
    return NextResponse.json({ isAdmin: false, isSuperAdmin: false }, { status: 500 });
  }
}
