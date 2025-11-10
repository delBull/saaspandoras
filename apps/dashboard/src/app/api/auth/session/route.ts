import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { sql } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request) {
  try {
    const requestHeaders = await headers();

    // Try multiple header names in case Vercel filters some
    const headerWallet = requestHeaders.get('x-thirdweb-address') ??
                        requestHeaders.get('x-wallet-address') ??
                        requestHeaders.get('x-user-address') ??
                        requestHeaders.get('x-wallet-address'); // fallback to same header

    if (!headerWallet) {
      return NextResponse.json({
        message: "No wallet address provided",
        hasSession: false,
        address: null
      }, { status: 400 });
    }

    const walletAddress = headerWallet.toLowerCase().trim();

    // Validate wallet format
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return NextResponse.json({
        message: "Invalid wallet address format",
        hasSession: false,
        address: null
      }, { status: 400 });
    }

    // Check if user exists in database
    const users = await sql`
      SELECT "id", "name", "email", "image", "walletAddress",
             "connectionCount", "lastConnectionAt", "createdAt",
             "kycLevel", "kycCompleted", "kycData"
      FROM "users"
      WHERE LOWER("walletAddress") = LOWER(${walletAddress})
    `;

    const user = users[0];

    if (!user) {
      return NextResponse.json({
        message: "User not found",
        hasSession: false,
        address: null
      }, { status: 404 });
    }

    // Check if user is admin
    const adminResults = await sql`
      SELECT COUNT(*) as count FROM "administrators"
      WHERE LOWER("wallet_address") = LOWER(${walletAddress})
    `;
    const isAdmin = Number(adminResults[0]?.count || 0) > 0;
    const isSuperAdmin = walletAddress.toLowerCase() === '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9';

    let role: "admin" | "applicant" | "pandorian" = "pandorian";
    if (isAdmin || isSuperAdmin) {
      role = "admin";
    } else {
      // Check if user has projects
      const projects = await sql`
        SELECT COUNT(*) as count FROM "projects"
        WHERE LOWER("applicant_wallet_address") = LOWER(${walletAddress})
      `;
      if (Number(projects[0]?.count || 0) > 0) {
        role = "applicant";
      }
    }

    return NextResponse.json({
      ...user,
      role,
      hasSession: true,
      address: walletAddress
    });

  } catch (error) {
    console.error("💥 [Auth Session API] Error:", error);

    // Check if it's a quota issue
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
        hasSession: false,
        address: null,
        quotaExceeded: true
      }, { status: 503 });
    }

    return NextResponse.json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
      hasSession: false,
      address: null
    }, { status: 500 });
  }
}
