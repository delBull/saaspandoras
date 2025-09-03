import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { match as matchLocale } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";
import type { NextFetchEvent } from "next/server";

import { i18n } from "~/config/i18n-config";

const noNeedProcessRoute = [
  ".*\\.webm",
  ".*\\.mp4",
  ".*\\.png",
  ".*\\.jpg",
  ".*\\.svg",
  ".*\\.pdf",
  ".*\\.opengraph-image.png",
  "/__next_devtools__/client(.*)",
  "/en/__next_devtools__/client(.*)",
];

const noRedirectRoute = ["/api(.*)", "/trpc(.*)", "/admin", "/test-nft-card"];

const publicRoute = [
  "/(\\w{2}/)?signin(.*)",
  "/(\\w{2}/)?login(.*)",
  "/(\\w{2}/)?register(.*)",
  "/(\\w{2}/)?terms(.*)",
  "/(\\w{2}/)?pricing(.*)",
  "/(\\w{2}/)?privacy(.*)",
  "/(\\w{2}/)?assets(.*)",
  "/(\\w{2}/)?activos(.*)",
  "/(\\w{2}/)?invest(.*)",
  "/(\\w{2}/)?about(.*)",
  "/(\\w{2}/)?whitepaper(.*)",
  "^/\\w{2}$",
];

const protectedRoutes = ["/(\\w{2}/)?dashboard(.*)", "/(\\w{2}/)?admin(.*)"];

const authRoutes = [
  "/api/auth(.*)",
  "/api/auth/callback(.*)",
  "/api/auth/signin(.*)",
  "/api/auth/signout(.*)",
  "/(\\w{2}/)?login(.*)",
  "/(\\w{2}/)?register(.*)",
];

function getLocale(req: NextRequest): string | undefined {
  const negotiatorHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => (negotiatorHeaders[key] = value));
  const locales = Array.from(i18n.locales);
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(
    locales,
  );
  return matchLocale(languages, locales, i18n.defaultLocale);
}

function isNoRedirect(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return noRedirectRoute.some((route) => new RegExp(route).test(pathname));
}

function isPublicPage(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return publicRoute.some(
    (route) =>
      new RegExp(route).test(pathname) ||
      new RegExp(`/[a-z]{2}${route}`).test(pathname),
  );
}

function isNoNeedProcess(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return noNeedProcessRoute.some((route) => new RegExp(route).test(pathname));
}

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent,
) {
  // Debug logs
  // console.log('Requested Path:', req.nextUrl.pathname);
  // console.log('Is Public Page:', isPublicPage(req));
  // console.log('Is Auth Route:', authRoutes.some(pattern => new RegExp(`^${pattern}$`).test(req.nextUrl.pathname)));

  // Check if current path requires skipping middleware
  if (
    req.nextUrl.pathname.startsWith("/api/auth") ||
    req.nextUrl.pathname.includes("/api/auth/callback") ||
    isNoNeedProcess(req) ||
    req.nextUrl.pathname.startsWith("/api/webhooks/")
  ) {
    return NextResponse.next();
  }

  // Check if the pathname is missing a locale
  const pathname = req.nextUrl.pathname;
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) =>
      !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
  );

  if (pathnameIsMissingLocale && !isNoRedirect(req)) {
    const locale = getLocale(req);
    return NextResponse.redirect(
      new URL(
        `/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`,
        req.url,
      ),
    );
  }

  if (isPublicPage(req)) {
    return NextResponse.next();
  }

  // Cast request to NextRequestWithAuth for NextAuth middleware
  const authRequest = req as NextRequestWithAuth;
  return authMiddleware(authRequest, event);
}

const authMiddleware = withAuth(
  async function middlewares(req: NextRequestWithAuth, _event: NextFetchEvent) {
    const token = await getToken({ req });
    const isAuth = !!token;
    const locale = getLocale(req) ?? i18n.defaultLocale;
    const pathname = req.nextUrl.pathname;

    // console.log('Auth Middleware - Path:', pathname, 'Auth:', isAuth);

    // Check if current path is login or register
    const isAuthPath =
      pathname.includes("/login") || pathname.includes("/register");

    // If authenticated and trying to access login, redirect appropriately
    if (isAuth && isAuthPath) {
      // console.log('Authenticated user accessing auth path, handling redirection');

      const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
      if (callbackUrl) {
        // Handle relative URLs
        if (callbackUrl.startsWith("/")) {
          // Add locale prefix if missing
          if (!/^\[a-z]{2}\//.test(callbackUrl)) {
            return NextResponse.redirect(
              new URL(`/${locale}${callbackUrl}`, req.url),
            );
          }
          return NextResponse.redirect(new URL(callbackUrl, req.url));
        }
        // Handle absolute URLs that match our origin
        try {
          const redirectUrl = new URL(callbackUrl);
          if (redirectUrl.origin === new URL(req.url).origin) {
            return NextResponse.redirect(redirectUrl);
          }
        } catch {
          // Invalid URL, fall through to default redirect
        }
      }
      // Default redirect to localized dashboard
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
    }

    // If not authenticated and trying to access protected routes
    if (!isAuth && !isAuthPath) {
      const protectedRoute = protectedRoutes.some((route) =>
        new RegExp(route).test(pathname),
      );

      if (protectedRoute) {
        // console.log('Unauthenticated user accessing protected route, redirecting to login');
        const from = pathname;
        return NextResponse.redirect(
          new URL(
            `/${locale}/login?callbackUrl=${encodeURIComponent(from)}`,
            req.url,
          ),
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: [
    "/",
    "/(es|en|zh|ko|ja)/:path*",
    "/api/auth/:path*",
    "/((?!api|_next/static|_next/image|videos|favicon.ico|__next_devtools__).*)",
  ],
};