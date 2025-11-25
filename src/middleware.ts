import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("[MIDDLEWARE] Request to:", pathname);

  // Get session token from cookies - check both possible cookie names
  const sessionToken = request.cookies.get("better-auth.session_token")?.value ||
                      request.cookies.get("better-auth.session-token")?.value;

  console.log("[MIDDLEWARE] Session token found:", !!sessionToken);
  console.log("[MIDDLEWARE] All cookies:", request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })));

  // Debug logging for production issues
  if (pathname.startsWith("/dashboard") && !sessionToken) {
    console.log("[MIDDLEWARE] No session token found for dashboard - will redirect to login");
    console.log("[MIDDLEWARE] Available cookies:", request.cookies.getAll().map(c => c.name));
  }

  // Define protected routes - booking removed (users can book without login)
  const protectedRoutes = ["/dashboard", "/profile", "/settings"];
  const authRoutes = ["/login", "/register"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !sessionToken) {
    console.log("[MIDDLEWARE] Redirecting to login", { pathname, hasSession: !!sessionToken });
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth routes to dashboard or callbackUrl
  if (isAuthRoute && sessionToken) {
    console.log("[MIDDLEWARE] Auth route with session - redirecting to dashboard");
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    const redirectUrl = callbackUrl || "/dashboard/customer";
    console.log("[MIDDLEWARE] Redirecting to:", redirectUrl);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  console.log("[MIDDLEWARE] Allowing request to:", pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
