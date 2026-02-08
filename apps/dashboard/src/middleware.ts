import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

// Simple in-memory rate limiting (production should use Redis)
// Note: In serverless/edge, this map is ephemeral per-instance.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Admin Route Protection (Strict)
  if (pathname.startsWith("/admin")) {
    // Check for wallet address in cookies
    const walletCookie = request.cookies.get('wallet-address') ||
      request.cookies.get('thirdweb:wallet-address') ||
      request.cookies.get('x-wallet-address');

    // If no wallet cookie exists, redirect immediately
    if (!walletCookie?.value) {
      console.log(`🛡️ Middleware: Blocking unauthorized access to ${pathname} (No Wallet Cookie)`);
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Note: We cannot easily verify if the wallet is an admin in middleware 
    // without a database call (which is limited in Edge middleware).
    // We rely on layout.tsx for the granular "Is Admin?" check, 
    // but this middleware layer prevents "no-wallet" access entirely.
  }

  // 2. Rate Limiting Strategy (Only for API routes)
  if (pathname.startsWith("/api")) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous';
    const now = Date.now();

    // Rate limiting configuration
    const rateLimits = {
      // High volume endpoints
      '/api/whatsapp/webhook': { requests: 5000, windowMs: 60 * 60 * 1000 },
      '/api/whatsapp/preapply': { requests: 5000, windowMs: 60 * 60 * 1000 },

      // Admin API strict limits
      '/api/admin/whatsapp/multi-flow': { requests: 30, windowMs: 5 * 60 * 1000 },
      '/api/admin/whatsapp-preapply': { requests: 100, windowMs: 15 * 60 * 1000 },

      // Session/Auth endpoints (Prevent spam but allow frequent checks)
      '/api/auth/session': { requests: 300, windowMs: 5 * 60 * 1000 }, // ~1/sec

      // Default
      default: { requests: 200, windowMs: 15 * 60 * 1000 },
    };

    // Determine limit
    const limitConfig = Object.entries(rateLimits).find(([path]) => pathname.startsWith(path))?.[1] || rateLimits.default;
    const key = `${ip}:${pathname}`;

    // Check limit
    const current = rateLimitMap.get(key);

    if (current) {
      if (now > current.resetTime) {
        // Reset
        rateLimitMap.set(key, { count: 1, resetTime: now + limitConfig.windowMs });
      } else if (current.count >= limitConfig.requests) {
        // Exceeded
        console.warn(`🔥 [RATE_LIMIT] IP ${ip} exceeded limit on ${pathname}`);
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429, headers: { 'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString() } }
        );
      } else {
        // Increment
        current.count++;
      }
    } else {
      // Initialize
      rateLimitMap.set(key, { count: 1, resetTime: now + limitConfig.windowMs });
    }

    // Cleanup (simple)
    if (rateLimitMap.size > 5000) rateLimitMap.clear();

    // 3. Security Headers (Only for API)
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

  // Fallback
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply ONLY to /api and /admin
    // EXPLICITLY EXCLUDE root (/) and static files by omission
    "/api/:path*",
    "/admin/:path*"
  ],
};
