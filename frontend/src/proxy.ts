// src/proxy.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicApiRoutes = [
  "/api/v1/org/onboading/personal-details", // current spelling
  "/api/v1/org/onboarding/personal-details", // correct spelling (future-proof)
];

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const pathname = nextUrl.pathname;

  // 1. Allow public onboarding endpoints (no session required)
  const isPublicApi = publicApiRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicApi) {
    return NextResponse.next();
  }

  // 2. Everything else under /org or /api/v1 requires a valid session
  const requiresAuth =
    pathname.startsWith("/org") || pathname.startsWith("/api/v1");

  if (requiresAuth) {
    const isSessionInvalid = !session || !!session.error;

    if (isSessionInvalid) {
      // API routes → return proper 401 (never redirect)
      if (pathname.startsWith("/api/v1")) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "Authentication required",
          },
          { status: 401 }
        );
      }

      // Page routes → redirect to login
      const loginUrl = new URL("/login", nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname + nextUrl.search);

      const response = NextResponse.redirect(loginUrl);

      // Clean up any stale session cookies
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");
      response.cookies.delete("authjs.session-token");
      response.cookies.delete("__Secure-authjs.session-token");

      return response;
    }
  }

  return NextResponse.next();
});

// Required by the new proxy system
export const config = {
  matcher: ["/org/:path*", "/api/v1/:path*"],
};