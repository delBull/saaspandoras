import { NextResponse } from "next/server";

export function GET() {
  try {
    return NextResponse.json({
      message: "Debug endpoint working",
      timestamp: new Date().toISOString(),
      status: "success"
    });
  } catch (error) {
    return NextResponse.json({
      error: "Debug endpoint failed",
      details: "Runtime error",
      status: "error"
    }, { status: 500 });
  }
}
