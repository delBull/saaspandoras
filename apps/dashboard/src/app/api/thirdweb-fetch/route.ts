// Temporarily disable thirdweb fetch endpoint completely
// Return empty data to avoid 500 errors

import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ error: "Feature disabled", code: "DISABLED" }, { status: 404 });
}

export function POST() {
  return NextResponse.json({ error: "Feature disabled", code: "DISABLED" }, { status: 404 });
}
