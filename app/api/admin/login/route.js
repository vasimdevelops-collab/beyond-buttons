import { NextResponse } from "next/server";

import { verifyAdminCredentials } from "@/lib/admin/credentials";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieAttributes,
  createAdminSession,
} from "@/lib/admin/session";

/**
 * POST /api/admin/login
 * Signs in the single Studio administrator using the credential stored in the
 * AdminCredential collection (seeded from .env). Sets a signed HttpOnly cookie.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim();
    const password = String(body.password || "");

    const ok = await verifyAdminCredentials(email, password);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, email });
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      createAdminSession(email),
      adminSessionCookieAttributes({ maxAge: 60 * 60 * 24 * 7 })
    );
    return response;
  } catch (error) {
    console.error("[admin/login] failed:", error?.message || error);
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}