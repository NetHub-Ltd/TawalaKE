// proxy.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const pathname = nextUrl.pathname;

  // 1. Target Only Protected Routes Explicitly
  const requiresAuth = pathname.startsWith("/org") || pathname.startsWith("/api/v1");

  if (requiresAuth) {
    // 2. Evaluate Session Health
    const isSessionInvalid = !session || !!session.error;

    if (isSessionInvalid) {
      const loginUrl = new URL("/login", nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", nextUrl.href);

      const response = NextResponse.redirect(loginUrl);

      // Clean out stale/corrupted token states
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");

      return response;
    }

    console.log(`[Security Guard] Clear: ${session.user?.email} accessing ${pathname}`);
  }

  // Allow all public routes, static assets, and auth callbacks to slide through untouched
  return NextResponse.next();
});

export const config = {
  // Only invoke the middleware for paths starting with /org or /api/v1
  matcher: ["/org/:path*", "/api/v1/:path*"],
};