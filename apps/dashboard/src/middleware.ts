import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { jwtVerify, importSPKI } from 'jose';

// Simple in-memory rate limiting (production should use Redis)
// Note: In serverless/edge, this map is ephemeral per-instance.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Admin Route Protection (Strict)
  if (pathname.startsWith("/admin")) {
    const walletCookie = request.cookies.get('wallet-address') ||
      request.cookies.get('thirdweb:wallet-address') ||
      request.cookies.get('x-wallet-address');

    if (!walletCookie?.value) {
      console.log(`🛡️ Middleware: Blocking unauthorized access to ${pathname} (No Wallet Cookie)`);
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
        // Fail open or closed? Closed for security.
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Import Public Key (SPKI)
      // Use atob for Edge Runtime compatibility (Buffer is not standard)
      const publicKeyString = atob(publicKeyPem);
      const publicKey = await importSPKI(publicKeyString, 'RS256');

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

    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    if (pathname.startsWith('/api/whatsapp/')) {
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    return response;
  }

  // 4. Global Security Headers (Force COOP/COEP for Social Login)
  const response = NextResponse.next();
  response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');

  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/admin/:path*",
    "/dashboard/:path*"
  ],
};
