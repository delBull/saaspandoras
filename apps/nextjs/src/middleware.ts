import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { match as matchLocale } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";
import type { NextFetchEvent } from "next/server";

import { i18n } from "~/config/i18n-config";

const noNeedProcessRoute = [".*\\.png", ".*\\.jpg", ".*\\.opengraph-image.png"];

const noRedirectRoute = ["/api(.*)", "/trpc(.*)", "/admin"];

const publicRoute = [
  "/(\\w{2}/)?signin(.*)",
  "/(\\w{2}/)?terms(.*)",
  "/(\\w{2}/)?privacy(.*)",
  "/(\\w{2}/)?docs(.*)",
  "/(\\w{2}/)?blog(.*)",
  "/(\\w{2}/)?pricing(.*)",
  "/(\\w{2}/)?assets(.*)", 
  "^/\\w{2}$", // root with locale
];

function getLocale(req: NextRequest): string | undefined {
  const negotiatorHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => (negotiatorHeaders[key] = value));
  const locales = Array.from(i18n.locales);
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(locales);
  return matchLocale(languages, locales, i18n.defaultLocale);
}

function isNoRedirect(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return noRedirectRoute.some((route) => new RegExp(route).test(pathname));
}

function isPublicPage(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return publicRoute.some((route) => new RegExp(route).test(pathname));
}

function isNoNeedProcess(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return noNeedProcessRoute.some((route) => new RegExp(route).test(pathname));
}

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  if (isNoNeedProcess(req)) {
    return NextResponse.next();
  }

  const isWebhooksRoute = req.nextUrl.pathname.startsWith('/api/webhooks/');
  if (isWebhooksRoute) {
    return NextResponse.next();
  }

  const pathname = req.nextUrl.pathname;
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (!isNoRedirect(req) && pathnameIsMissingLocale) {
    const locale = getLocale(req);
    return NextResponse.redirect(
      new URL(`/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`, req.url)
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
    const isAdmin = token?.isAdmin;
    const isAuthPage = req.nextUrl.pathname.match(/^\/[a-zA-Z]{2,}\/(login|register)/);
    const isAuthRoute = req.nextUrl.pathname.startsWith("/api/trpc/");
    const locale = getLocale(req);

    if (isAuthRoute && isAuth) {
      return NextResponse.next();
    }

    if (req.nextUrl.pathname.startsWith("/admin/dashboard")) {
      if (!isAuth || !isAdmin) {
        return NextResponse.redirect(new URL(`/admin/login`, req.url));
      }
      return NextResponse.next();
    }

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
      }
      return NextResponse.next();
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }
      return NextResponse.redirect(
        new URL(`/${locale}/login?from=${encodeURIComponent(from)}`, req.url)
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};