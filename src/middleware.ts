import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { authConfig } from "@/lib/auth.config";

const intlMiddleware = createMiddleware(routing);

const { auth } = NextAuth(authConfig);

const publicPaths = ["/login", "/register", "/api/auth"];

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow API auth routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow external API routes (assets API for VertaX integration)
  if (pathname.startsWith("/api/assets")) {
    return NextResponse.next();
  }

  // Redirect root to dashboard
  if (pathname === "/" || pathname === "/zh-CN" || pathname === "/en") {
    if (isDemoMode || req.auth) {
      return NextResponse.redirect(new URL("/zh-CN/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/zh-CN/login", req.url));
  }

  // In demo mode, skip auth checks entirely
  if (isDemoMode) {
    return intlMiddleware(req);
  }

  // Check if the path (without locale) is public
  const pathnameWithoutLocale = pathname.replace(/^\/(zh-CN|en)/, "") || "/";
  const isPublicPath = publicPaths.some((p) => pathnameWithoutLocale.startsWith(p));

  // If not authenticated and not on public path, redirect to login
  if (!req.auth && !isPublicPath) {
    const loginUrl = new URL("/zh-CN/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and on login/register, redirect to dashboard
  if (req.auth && (pathnameWithoutLocale === "/login" || pathnameWithoutLocale === "/register")) {
    return NextResponse.redirect(new URL("/zh-CN/dashboard", req.url));
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!_next|api/auth|.*\\..*).*)"],
};
