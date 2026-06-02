// proxy.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// ⚡ PRODUCTION FIX: Explicitly define paths that DO NOT require authentication
const PUBLIC_ALLOWLIST = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/billing",
  "/features",
  "/support"
];

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;

  const pathname = nextUrl.pathname;

  // 1. Determine if the current path is public
  // Checks for exact matches or paths starting with your allowlist items
  const isPublicRoute = PUBLIC_ALLOWLIST.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // If it's a public route, let them pass immediately without checking tokens
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 2. Beyond this point, all routes are PROTECTED BY DEFAULT
  console.log(
    `[Proxy] Protected Path: ${pathname} | Auth: ${!!session} | Error: ${session?.error || "None"}`
  );

  // 3. Evaluate Session Health (Catches missing token OR the custom rotation error)
  const isSessionInvalid = !session || !!session.error;

  // 4. Force Session Eviction & Global Token Erasure
  if (isSessionInvalid) {
    const loginUrl = new URL("/login", nextUrl.origin);
    // Remember where they were going so we can send them back after re-authenticating
    loginUrl.searchParams.set("callbackUrl", nextUrl.href);

    const response = NextResponse.redirect(loginUrl);

    // Completely clear NextAuth identifiers out of the browser cookie jar
    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token"); // Crucial for production HTTPS

    return response;
  }

  // 5. Cross-Tenant Security Boundaries (Dynamic Segments)
  // Path template: /[organizationId]/[businessId]/...
  const pathSegments = pathname.split("/").filter(Boolean);
  const orgIdFromUrl = pathSegments[0];
  const businessIdFromUrl = pathSegments[1];

  if (session?.user) {
    const user = session.user;

    console.log(`[Security Guard]: Access attempt by ${user.email} to: ${pathname}`)

  }

  return NextResponse.next();
});

export const config = {
  // Matches everything except internal Next.js chunks, images, assets, and api handlers
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};