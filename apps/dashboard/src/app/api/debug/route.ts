import { NextResponse } from "next/server";

export function GET() {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      // Check database connection
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      // Check thirdweb config
      THIRDWEB_CLIENT_ID_EXISTS: !!process.env.THIRDWEB_CLIENT_ID,
      THIRDWEB_SECRET_KEY_EXISTS: !!process.env.THIRDWEB_SECRET_KEY,
      // Check next config
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      // Timestamp to verify this is production
      timestamp: new Date().toISOString(),
      status: 'DEBUG_ENDPOINT_REACHABLE'
    };

    console.log('🔧 DEBUG ENDPOINT CALLED:', envVars);

    return NextResponse.json({
      message: "Debug endpoint working",
      data: envVars,
      status: "success"
    }, { status: 200 });
  } catch (error) {
    console.error('❌ ERROR IN DEBUG ENDPOINT:', error);
    return NextResponse.json({
      error: "Debug endpoint failed",
      details: error instanceof Error ? error.message : 'Unknown error',
      status: "error"
    }, { status: 500 });
  }
}
