import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "siam_session";

const STUDENT_ROUTES = ["/dashboard", "/trade", "/war", "/news", "/city-info", "/missions", "/laws", "/envoy"];
const ADMIN_PROTECTED_PREFIX = "/admin/";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const raw = req.cookies.get(COOKIE_NAME)?.value;

  let session: { city_id?: string; role?: string } | null = null;
  try {
    session = raw ? JSON.parse(raw) : null;
  } catch {
    session = null;
  }

  const isStudentRoute = STUDENT_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminProtectedRoute = pathname.startsWith(ADMIN_PROTECTED_PREFIX);

  if (isStudentRoute && !session?.city_id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAdminProtectedRoute && session?.role !== "admin") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/trade/:path*", "/war/:path*", "/news/:path*", "/city-info/:path*", "/missions/:path*", "/laws/:path*", "/envoy/:path*", "/admin/:path*"],
};
