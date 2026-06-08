import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { jwtVerify, importSPKI, importJWK } from 'jose';

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

  // 1. Rate Limiting Strategy (Only for API routes)
  if (pathname.startsWith("/api")) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous';
    const now = Date.now();

    const rateLimits = {
      '/api/auth/login': { requests: 15, windowMs: 60 * 1000 },
      '/api/auth/link-wallet': { requests: 15, windowMs: 60 * 1000 },
      '/api/auth/telegram': { requests: 15, windowMs: 60 * 1000 },
      '/api/auth': { requests: 60, windowMs: 60 * 1000 },
      '/api/admin/whatsapp/multi-flow': { requests: 30, windowMs: 5 * 60 * 1000 },
      '/api/admin/whatsapp-preapply': { requests: 100, windowMs: 15 * 60 * 1000 },
      '/api/admin': { requests: 150, windowMs: 60 * 1000 },
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

    if (rateLimitMap.size > 2000) {
      let oldestResetTime = Infinity;
      for (const value of rateLimitMap.values()) {
        if (value.resetTime < oldestResetTime) {
          oldestResetTime = value.resetTime;
        }
      }
      if (oldestResetTime !== Infinity && now > oldestResetTime + 60000) {
        rateLimitMap.clear();
      } else if (rateLimitMap.size > 5000) {
        // Hard limit to prevent memory leaks/CPU spikes under severe attack
        rateLimitMap.clear();
      }
    }
  }

  // 2. Admin Route Protection — redirect unauthenticated users
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get('__pbox_sid')?.value ||
      request.cookies.get('auth_token')?.value;

    if (!token && !pathname.startsWith("/api/")) {
      // Only block page routes (not API routes)
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  const response = NextResponse.next();

  // 3. Global CORS headers for API
  const requestOrigin = request.headers.get("origin");
  const isPublicMarketingApi = pathname.startsWith('/api/v1/marketing') || pathname.startsWith('/api/public');

  if (isPublicMarketingApi) {
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
  response.headers.set('Permissions-Policy', 'camera=(), display-capture=(), fullscreen=(self), geolocation=(), microphone=(), payment=(), usb=()');

  // CSP Report-Only: no bloquea nada, solo reporta violaciones
  // para armar la política final sin romper funcionalidad
  response.headers.set(
    'Content-Security-Policy-Report-Only',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.thirdweb.com https://*.thirdwebstorage.com https://*.ipfscdn.io https://telegram.org https://*.telegram.org",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' blob: data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.thirdweb.com wss://*.thirdweb.com https://api.telegram.org https://*.pandoras.finance https://*.pandoras.org https://blob.vercel-storage.com",
      "frame-src 'self' https://telegram.org",
      "base-uri 'self'",
      "form-action 'self'",
      "report-uri /api/csp-report",
    ].join('; ')
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf|ico|json|txt|mp4|webm|pdf)).*)"
  ],
};
