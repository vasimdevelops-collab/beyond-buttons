import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const ADMIN_SESSION_COOKIE = "bb_admin_session";

/**
 * Optimistic route protection (cookie presence only — no DB call).
 * Authoritative checks (session validity) happen server-side in the
 * Studio protected layout and in the storefront account/checkout pages.
 */

const CUSTOMER_PROTECTED_EXACT = new Set(["/account", "/checkout"]);
const STUDIO_LOGIN_PATH = "/studio.admins/login";

function isCustomerProtected(pathname) {
  if (CUSTOMER_PROTECTED_EXACT.has(pathname)) return true;
  return ["/account/", "/checkout/"].some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const customerCookie = getSessionCookie(request);
  const adminCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  // Legacy /admin panel — redirect to the new Studio.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const url = new URL("/studio.admins", request.url);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/studio.admins") && pathname !== STUDIO_LOGIN_PATH) {
    if (!adminCookie) {
      const url = new URL(STUDIO_LOGIN_PATH, request.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isCustomerProtected(pathname)) {
    if (!customerCookie) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/account",
    "/account/:path*",
    "/checkout",
    "/checkout/:path*",
    "/studio.admins",
    "/studio.admins/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
