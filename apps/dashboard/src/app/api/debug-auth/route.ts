import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { verifyJWT } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const headerList = await headers();
  const cookieHeader = headerList.get('cookie') || "";
  
  const sidMatch = cookieHeader.match(/__pbox_sid=([^;]+)/);
  const token = sidMatch?.[1];

  let decoded = null;
  let error = null;
  let keyStats = {
      hasPublic: !!process.env.JWT_PUBLIC_KEY,
      hasPrivate: !!process.env.JWT_PRIVATE_KEY,
      hasSecret: !!process.env.JWT_SECRET,
      publicLength: process.env.JWT_PUBLIC_KEY?.length || 0,
      privateLength: process.env.JWT_PRIVATE_KEY?.length || 0,
  };

  try {
    if (token) {
      decoded = await verifyJWT(token);
      if (!decoded) {
          error = "verifyJWT returned null (Logic failure or all stages failed)";
      }
    } else {
      error = "No __pbox_sid found in cookie header";
    }
  } catch (err: any) {
    error = err.message || "Unknown verification error";
    console.error("❌ [DebugAuth] Forensic Failure:", err);
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    cookieHeaderPresent: !!cookieHeader,
    tokenFound: !!token,
    tokenLength: token?.length || 0,
    decoded,
    error,
    keyStats,
    host: headerList.get('host')
  });
}
