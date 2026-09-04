import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. Global OPTIONS Handling (CORS Preflight)
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin") || "*";
    const isPublicMarketingApi = pathname.startsWith('/api/v1/marketing') || pathname.startsWith('/api/public') || pathname.startsWith('/api/v1/deal-signing') || pathname.startsWith('/api/nexus');
    const isAllowed = 
      origin === "https://pandoras.finance" || 
      origin === "http://pandoras.finance" || 
      origin.endsWith(".pandoras.finance") || 
      origin === "https://pandoras.org" ||
      origin.endsWith(".pandoras.org") || 
      origin.startsWith("http://localhost:") || 
      origin.startsWith("https://localhost:") ||
      isPublicMarketingApi;

    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": isAllowed ? origin : "https://dash.pandoras.finance",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-thirdweb-address, x-wallet-address, x-user-address, x-stress-test",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // 0.1 Sovereign Sign Subdomain Routing (e.g. sign.pandoras.finance / firmas.pandoras.finance)
  const host = request.headers.get("host") || "";
  const isSignSubdomain = host.startsWith("sign.") || host.startsWith("firmas.");

  if (isSignSubdomain && !pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
    if (pathname === "/" || pathname === "") {
      return NextResponse.rewrite(new URL("/deal/sign", request.url));
    }
    if (pathname.startsWith("/envelopes/")) {
      return NextResponse.rewrite(new URL(`/deal${pathname}`, request.url));
    }
    // Direct envelope lookup: sign.pandoras.finance/<envelopeId> -> /deal/envelopes/<envelopeId>
    if (!pathname.startsWith("/deal/") && pathname.length > 1) {
      const cleanPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
      return NextResponse.rewrite(new URL(`/deal/envelopes/${cleanPath}`, request.url));
    }
  }

  // 0.2 Admin Subdomain Routing (e.g. admin.pandoras.finance or staging.admin.pandoras.finance)
  const isAdminSubdomain = host.startsWith("admin.") || host.startsWith("staging.admin.");

  if (isAdminSubdomain && !pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
    if (pathname === "/" || pathname === "") {
      return NextResponse.rewrite(new URL("/admin", request.url));
    }
    if (!pathname.startsWith("/admin/") && pathname !== "/admin") {
      return NextResponse.rewrite(new URL(`/admin${pathname}`, request.url));
    }
  }

  // 0.2.1 Nexus Subdomain Routing (e.g. nexus.pandoras.finance)
  const isNexusSubdomain = host.startsWith("nexus.") || host.startsWith("staging.nexus.");
  if (isNexusSubdomain && !pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
    if (pathname === "/" || pathname === "") {
      return NextResponse.rewrite(new URL("/nexus", request.url));
    }
    if (!pathname.startsWith("/nexus/") && pathname !== "/nexus") {
      return NextResponse.rewrite(new URL(`/nexus${pathname}`, request.url));
    }
  }

  // 0.3 Admin Decoupling Protection (Redirect dash to admin)
  // TODO: Uncomment this once DNS propagates and admin.pandoras.finance is fully verified.
  /*
  if (pathname.startsWith("/admin") && !isAdminSubdomain && !pathname.startsWith("/api/admin")) {
    const adminUrl = new URL(request.url);
    adminUrl.hostname = "admin.pandoras.finance";
    return NextResponse.redirect(adminUrl, 301);
  }
  */

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

  // 2. Admin Route Protection — redirect unauthenticated users or block unauthenticated API calls
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = request.cookies.get('__pbox_sid')?.value ||
      request.cookies.get('auth_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  const response = NextResponse.next();

  // 3. Rate limit headers for API routes (X-RateLimit-* on success)
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

    if (current && now <= current.resetTime) {
      const remaining = Math.max(0, limitConfig.requests - current.count);
      const resetSeconds = Math.ceil((current.resetTime - now) / 1000);
      response.headers.set('X-RateLimit-Limit', limitConfig.requests.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', resetSeconds.toString());
    } else {
      response.headers.set('X-RateLimit-Limit', limitConfig.requests.toString());
      response.headers.set('X-RateLimit-Remaining', (limitConfig.requests - 1).toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(limitConfig.windowMs / 1000).toString());
    }
  }

  // 4. Global CORS headers for API
  const requestOrigin = request.headers.get("origin");
  const isPublicMarketingApi = pathname.startsWith('/api/v1/marketing') || pathname.startsWith('/api/public');

  if (isPublicMarketingApi) {
    response.headers.set('Access-Control-Allow-Origin', requestOrigin || '*');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, x-stress-test');
  } else if (requestOrigin && (requestOrigin.endsWith(".pandoras.finance") || requestOrigin.endsWith(".pandoras.org") || requestOrigin.startsWith("http://localhost:"))) {
    response.headers.set('Access-Control-Allow-Origin', requestOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-thirdweb-address, x-wallet-address');
  }

  // 🛡️ CORS Response Headers for Cross-Origin Subdomains
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    if (origin) {
      const isAllowed =
        origin === 'https://pandoras.finance' ||
        origin === 'http://pandoras.finance' ||
        origin.endsWith('.pandoras.finance') ||
        origin === 'https://pandoras.org' ||
        origin.endsWith('.pandoras.org') ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('https://localhost:');
      if (isAllowed) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, x-thirdweb-address, x-wallet-address, x-user-address');
      }
    }
  }

  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Allow iframing for checkout and schedule widgets
  if (!pathname.startsWith('/pay') && !pathname.startsWith('/schedule')) {
    response.headers.set('X-Frame-Options', 'DENY');
  }

  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), display-capture=(), fullscreen=(self), geolocation=(), microphone=(), payment=(), usb=()');

  // 🛡️ Anti-cache for HTML pages: Prevent stale JS causing login redirect loops
  if (!pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  // CSP Report-Only: no bloquea nada, solo reporta violaciones
  // para armar la política final sin romper funcionalidad
  const isProduction = process.env.VERCEL_ENV === 'production'
    || (process.env.VERCEL_ENV === undefined && process.env.NODE_ENV === 'production');

  const connectSrc = isProduction
    ? "'self' https://*.thirdweb.com wss://*.thirdweb.com https://api.telegram.org https://dash.pandoras.finance https://app.pandoras.org https://blob.vercel-storage.com"
    : "'self' https://*.thirdweb.com wss://*.thirdweb.com https://api.telegram.org https://*.pandoras.finance https://*.pandoras.org https://blob.vercel-storage.com";

  response.headers.set(
    'Content-Security-Policy-Report-Only',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.thirdweb.com https://*.thirdwebstorage.com https://*.ipfscdn.io https://telegram.org https://*.telegram.org",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' blob: data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src ${connectSrc} https://vercel.live`,
      "frame-src 'self' https://telegram.org https://vercel.live https://*.thirdweb.com",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf|ico|json|txt|mp4|webm|pdf)).*)"
  ],
};
