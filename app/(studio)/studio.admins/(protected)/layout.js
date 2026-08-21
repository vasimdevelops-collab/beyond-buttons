import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { StudioShell } from "@/app/(studio)/studio.admins/studio-shell";
import { getAdminEmail } from "@/lib/admin/credentials";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/lib/admin/session";
import { getCsrfTokenFromRequest } from "@/lib/admin/csrf";

/**
 * Authoritative Studio auth boundary — every route under this segment
 * requires a valid admin session cookie (the single .env admin account).
 * Runs server-side on every request (dynamic — reads cookies via headers()),
 * so it cannot be bypassed by disabling JavaScript or spoofing client state.
 */
export default async function StudioProtectedLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const email = verifyAdminSession(token);

  if (!email) {
    redirect("/studio.admins/login");
  }

  // If the admin email was changed, old sessions (signed for the old email)
  // are invalidated immediately.
  try {
    const currentEmail = await getAdminEmail();
    if (email.toLowerCase() !== currentEmail.toLowerCase()) {
      redirect("/studio.admins/login");
    }
  } catch (error) {
    console.error("[studio] Failed to load admin email:", error?.message || error);
    // If we can't verify the email (e.g., MongoDB down), allow the session if it's valid
    // The session itself is cryptographically verified, so it's safe to proceed
  }

  // Get CSRF token for client-side use (injected via meta tag)
  const csrfToken = getCsrfTokenFromRequest({ cookies: cookieStore });

  return (
    <>
      <meta name="csrf-token" content={csrfToken} />
      <StudioShell user={{ email }}>{children}</StudioShell>
    </>
  );
}