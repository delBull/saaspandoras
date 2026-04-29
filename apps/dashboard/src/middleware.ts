import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { jwtVerify, importSPKI } from 'jose';

// Simple in-memory rate limiting (production should use Redis)
// Note: In serverless/edge, this map is ephemeral per-instance.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. Global OPTIONS Handling (CORS Preflight)
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin") || "*";
    const isPublicMarketingApi = pathname.startsWith('/api/v1/marketing') || pathname.startsWith('/api/public');
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": isPublicMarketingApi ? (origin) : (origin.endsWith(".pandoras.finance") || origin.endsWith(".pandoras.org") || origin.includes("localhost") ? origin : "https://dash.pandoras.finance"),
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": isPublicMarketingApi 
          ? "Content-Type, Authorization, x-api-key, x-stress-test"
          : "Content-Type, Authorization, x-thirdweb-address, x-wallet-address",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // 1. Admin Route Protection (Moved to Client-Side AutoLoginGate for Metamask compatibility)
  /*
  if (pathname.startsWith("/admin")) {
    const walletCookie = request.cookies.get('wallet-address') ||
      request.cookies.get('thirdweb:wallet-address') ||
      request.cookies.get('x-wallet-address') ||
      request.cookies.get('auth_token');

    if (!walletCookie?.value) {
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
        return NextResponse.redirect(new URL("/", request.url));
      }

      const publicKey = await importSPKI(publicKeyPem, 'RS256');
      const { payload } = await jwtVerify(token, publicKey, {
        algorithms: ['RS256'],
      });

      const EXPECTED_VERSION = Number(process.env.JWT_VERSION || 2);
      if (Number(payload.v) !== EXPECTED_VERSION) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  */

  // 3. Rate Limiting Strategy (Only for API routes)
  if (pathname.startsWith("/api")) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous';
    const now = Date.now();

    const rateLimits = {
      // 🛡️ Strict Auth Rate Limiting (Brute-force protection)
      '/api/auth/login': { requests: 15, windowMs: 60 * 1000 },
      '/api/auth/link-wallet': { requests: 15, windowMs: 60 * 1000 },
      '/api/auth/telegram': { requests: 15, windowMs: 60 * 1000 },
      '/api/auth': { requests: 60, windowMs: 60 * 1000 },

      // 🛡️ Admin Rate Limiting
      '/api/admin/whatsapp/multi-flow': { requests: 30, windowMs: 5 * 60 * 1000 },
      '/api/admin/whatsapp-preapply': { requests: 100, windowMs: 15 * 60 * 1000 },
      '/api/admin': { requests: 150, windowMs: 60 * 1000 },

      // 📱 Legacy Webhook Limits
      '/api/whatsapp/webhook': { requests: 5000, windowMs: 60 * 60 * 1000 },
      '/api/whatsapp/preapply': { requests: 5000, windowMs: 60 * 60 * 1000 },
      default: { requests: 200, windowMs: 15 * 60 * 1000 },
    };

    const limitConfig = Object.entries(rateLimits).find(([path]) => pathname.startsWith(path))?.[1] || rateLimits.default;
    const key = `${ip}:${pathname}`;

    const current = rateLimitMap.get(key);

    if (current) {
      if (now > current.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + limitConfig.windowMs });
      } else if (current.count >= limitConfig.requests) {
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

    // Aggressive cleanup if map gets large
    if (rateLimitMap.size > 2000) {
      const oldestResetTime = Array.from(rateLimitMap.values()).sort((a, b) => a.resetTime - b.resetTime)[0]?.resetTime;
      if (oldestResetTime && now > oldestResetTime + 60000) {
        rateLimitMap.clear();
      }
    }

    const response = NextResponse.next();

    // 0. Global CORS headers for API (Matches OPTIONS handling)
    const requestOrigin = request.headers.get("origin");
    
    // Public marketing API: open to any origin — protected by API keys at app level
    const isPublicMarketingApi = pathname.startsWith('/api/v1/marketing') || pathname.startsWith('/api/public');
    
    if (isPublicMarketingApi) {
      // Allow all external origins (Narai, other protocols, widgets)
      response.headers.set('Access-Control-Allow-Origin', requestOrigin || '*');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, x-stress-test');
    } else if (requestOrigin && (requestOrigin.endsWith(".pandoras.finance") || requestOrigin.endsWith(".pandoras.org") || requestOrigin.includes("localhost"))) {
      response.headers.set('Access-Control-Allow-Origin', requestOrigin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-thirdweb-address, x-wallet-address');
    }

    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (static public files)
     * - All images/fonts in /public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf|ico|json|txt|mp4|webm|pdf)).*)"
  ],
};
