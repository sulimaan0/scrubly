import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session token from cookies - check both possible cookie names
  const sessionToken = request.cookies.get("better-auth.session_token")?.value ||
                      request.cookies.get("better-auth.session-token")?.value;

  // Debug logging for production issues
  if (pathname.startsWith("/dashboard") && !sessionToken) {
    console.log("Middleware: No session token found for dashboard");
    console.log("Available cookies:", request.cookies.getAll().map(c => c.name));
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
    console.log("Middleware: Redirecting to login", { pathname, hasSession: !!sessionToken });
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth routes to dashboard or callbackUrl
  if (isAuthRoute && sessionToken) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    const redirectUrl = callbackUrl || "/dashboard/customer";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

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
