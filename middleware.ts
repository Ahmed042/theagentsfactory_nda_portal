import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nda-portal-secret-change-in-production"
);
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "nda_admin_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin routes and /api/nda/* admin APIs (not /api/auth/*)
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedApi =
    pathname.startsWith("/api/nda/create") ||
    pathname.startsWith("/api/nda/resend") ||
    pathname.startsWith("/api/nda/pdf");

  if (!isAdminRoute && !isProtectedApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    // Invalid/expired token
    const response = isProtectedApi
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", req.url));

    // Clear invalid cookie
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/nda/create", "/api/nda/resend", "/api/nda/pdf"],
};
