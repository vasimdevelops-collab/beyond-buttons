import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieAttributes,
} from "@/lib/admin/session";

/**
 * POST /api/admin/logout
 * Clears the admin session cookie.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    "",
    adminSessionCookieAttributes({ maxAge: 0 })
  );
  return response;
}