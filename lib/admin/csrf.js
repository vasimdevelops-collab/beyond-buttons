/**
 * CSRF Protection for Admin API routes
 * 
 * Uses a double-submit cookie pattern:
 * - CSRF token is stored in a cookie (httpOnly, sameSite=lax)
 * - Client must send the token in a custom header (x-csrf-token) on state-changing requests
 * - Token is generated per-session and rotated periodically
 */

import crypto from "crypto";
import { NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "bb_csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

function generateCsrfToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function getCsrfTokenFromCookie(request) {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value;
}

export function setCsrfCookie(response, token) {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function validateCsrfToken(request, sessionCsrfToken) {
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken || !sessionCsrfToken) {
    return false;
  }
  // Use timing-safe comparison
  try {
    const a = Buffer.from(headerToken);
    const b = Buffer.from(sessionCsrfToken);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function ensureCsrfToken(request, response) {
  let token = getCsrfTokenFromCookie(request);
  if (!token) {
    token = generateCsrfToken();
    setCsrfCookie(response, token);
  }
  return token;
}

/**
 * Get CSRF token from request cookies (server-side)
 * Returns the token value or null if not present
 */
export function getCsrfTokenFromRequest(request) {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Middleware wrapper for admin API routes that require CSRF protection.
 * Usage:
 *   export async function POST(request) {
 *     const csrfError = await checkCsrf(request);
 *     if (csrfError) return csrfError;
 *     // ... rest of handler
 *   }
 */
export async function checkCsrf(request) {
  const response = new NextResponse();
  const sessionCsrfToken = ensureCsrfToken(request, response);
  
  if (!validateCsrfToken(request, sessionCsrfToken)) {
    return NextResponse.json(
      { error: "Invalid CSRF token" },
      { status: 403, headers: response.headers }
    );
  }
  
  return null;
}

/**
 * Helper to add CSRF token to response headers for client-side reading
 */
export function addCsrfTokenToResponse(response, token) {
  response.headers.set("x-csrf-token", token);
  return response;
}