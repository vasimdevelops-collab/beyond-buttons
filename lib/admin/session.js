/**
 * Admin session — signed cookie for the single Studio administrator.
 *
 * Completely separate from the storefront customer auth (better-auth). The
 * admin signs in with the one credential stored in the AdminCredential
 * collection (seeded from ADMIN_EMAIL / ADMIN_PASSWORD in .env). There is no
 * role system and no way for a customer account to gain Studio access.
 */

import crypto from "crypto";

export const ADMIN_SESSION_COOKIE = "bb_admin_session";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    "bb-admin-insecure-dev-secret"
  );
}

function sign(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/** Build a signed, expiring session token containing the admin email. */
export function createAdminSession(email) {
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Date.now() + SESSION_TTL_MS })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Verify a session token. Returns the admin email or null. */
export function verifyAdminSession(token) {
  if (!token) return null;
  const [payload, signature] = String(token).split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const provided = Buffer.from(signature);
  if (provided.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(provided, expected)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data || typeof data.exp !== "number" || Date.now() > data.exp) return null;
    return typeof data.email === "string" ? data.email : null;
  } catch {
    return null;
  }
}

/** Read + verify the admin session from a request. Returns email or null. */
export function getAdminSessionFromRequest(request) {
  const token = request?.cookies?.get?.(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSession(token);
}

/**
 * Guard for API routes. Returns an error response shape when the request is
 * not an authenticated admin, or `{ email }` when it is.
 */
export function requireAdmin(request) {
  const email = getAdminSessionFromRequest(request);
  if (!email) {
    return { error: { error: "Authentication required." }, status: 401 };
  }
  return { email };
}

/** Cookie attributes shared by login/logout responses. */
export function adminSessionCookieAttributes(overrides = {}) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...overrides,
  };
}