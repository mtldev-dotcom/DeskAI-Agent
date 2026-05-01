import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { localizePathname, routing, stripLocalePrefix } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const publicPrefixes = [
  "/sign-in",
  "/sign-up",
  "/manifest.json",
  "/api/auth",
  "/api/health",
  "/api/telegram/webhook",
  "/share",
];

function isPublicPath(pathname: string) {
  return publicPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function getLocaleFromPathname(pathname: string) {
  return pathname === "/fr" || pathname.startsWith("/fr/") ? "fr" : "en";
}

async function enforceAuth(req: NextRequest, pathname: string) {
  if (isPublicPath(pathname)) {
    return null;
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.userId) {
    const locale = getLocaleFromPathname(req.nextUrl.pathname);
    const signInUrl = new URL(localizePathname(locale, "/sign-in"), req.url);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  if (pathname.startsWith("/admin") && token.isGlobalAdmin !== true) {
    return NextResponse.redirect(new URL(localizePathname(getLocaleFromPathname(req.nextUrl.pathname), "/desks"), req.url));
  }

  return null;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const strippedPathname = stripLocalePrefix(pathname);

  if (pathname.startsWith("/api")) {
    return (await enforceAuth(req, pathname)) ?? NextResponse.next();
  }

  const intlResponse = intlMiddleware(req);
  const authResponse = await enforceAuth(req, strippedPathname);

  return authResponse ?? intlResponse;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
