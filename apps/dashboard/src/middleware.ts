import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { jwtVerify, importSPKI } from 'jose';

// Simple in-memory rate limiting (production should use Redis)
// Note: In serverless/edge, this map is ephemeral per-instance.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log("🛣️ Middleware hit:", pathname);

  // 0. Global OPTIONS Handling (CORS Preflight)
  // MUST stay at the top to avoid auth/rate-limit blocks
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-thirdweb-address, x-wallet-address",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // 1. Admin Route Protection (Strict)
  if (pathname.startsWith("/admin")) {
    const walletCookie = request.cookies.get('wallet-address') ||
      request.cookies.get('thirdweb:wallet-address') ||
      request.cookies.get('x-wallet-address') ||
      request.cookies.get('auth_token'); // Support Unified Identity Token

    if (!walletCookie?.value) {
      console.log(`🛡️ Middleware: Blocking unauthorized access to ${pathname} (No Wallet Cookie or Auth Token)`);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 2. Protected Routes (Dashboard) - RS256 Verification
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    try {

      const publicKeyPem = process.env.JWT_PUBLIC_KEY;
      if (!publicKeyPem) {
        console.error("❌ Middleware: JWT_PUBLIC_KEY not set");
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Import Public Key (SPKI) directly from PEM string
      // PEM strings should NOT be processed with atob()
      const publicKey = await importSPKI(publicKeyPem, 'RS256');

      const { payload } = await jwtVerify(token, publicKey, {
        algorithms: ['RS256'],
      });

      // Enforce JWT Version (Kill Switch)
      const EXPECTED_VERSION = Number(process.env.JWT_VERSION || 1);
      if (Number(payload.v) !== EXPECTED_VERSION) {
        console.warn(`🔒 Middleware: Token version mismatch (Got ${String(payload.v)}, Expected ${EXPECTED_VERSION})`);
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Valid Token
      // Optional: Check expiration explicitly if needed, but jwtVerify does it.

    } catch (error) {
      console.error("❌ Middleware: Invalid Token", error);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 3. Rate Limiting Strategy (Only for API routes)
  if (pathname.startsWith("/api")) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous';
    const now = Date.now();

    const rateLimits = {
      '/api/whatsapp/webhook': { requests: 5000, windowMs: 60 * 60 * 1000 },
      '/api/whatsapp/preapply': { requests: 5000, windowMs: 60 * 60 * 1000 },
      '/api/admin/whatsapp/multi-flow': { requests: 30, windowMs: 5 * 60 * 1000 },
      '/api/admin/whatsapp-preapply': { requests: 100, windowMs: 15 * 60 * 1000 },
      '/api/auth/session': { requests: 300, windowMs: 5 * 60 * 1000 },
      default: { requests: 200, windowMs: 15 * 60 * 1000 },
    };

    const limitConfig = Object.entries(rateLimits).find(([path]) => pathname.startsWith(path))?.[1] || rateLimits.default;
    const key = `${ip}:${pathname}`;

    const current = rateLimitMap.get(key);

    if (current) {
      if (now > current.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + limitConfig.windowMs });
      } else if (current.count >= limitConfig.requests) {
        console.warn(`🔥 [RATE_LIMIT] IP ${ip} exceeded limit on ${pathname}`);
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429, headers: { 'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString() } }
        );
      } else {
        current.count++;
      }
    } else {
      rateLimitMap.set(key, { count: 1, resetTime: now + limitConfig.windowMs });
    }

    if (rateLimitMap.size > 5000) rateLimitMap.clear();

    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    } as Record<string, string>;

    if (pathname.startsWith('/api/whatsapp/')) {
      securityHeaders['Access-Control-Allow-Origin'] = '*';
      securityHeaders['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
      securityHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    }

    return NextResponse.next({
      headers: securityHeaders,
    });
  }

  // 4. Global Security Headers -> MOVED TO next.config.mjs to avoid conflicts
  // const response = NextResponse.next();
  // response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
  // response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
};
