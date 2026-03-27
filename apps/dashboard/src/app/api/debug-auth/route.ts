import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const headerList = await headers();
  const cookieHeader = headerList.get('cookie');
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    cookieHeaderPresent: !!cookieHeader,
    cookiesFound: allCookies.length,
    cookieNames: allCookies.map(c => c.name),
    userAgent: headerList.get('user-agent'),
    host: headerList.get('host')
  });
}
