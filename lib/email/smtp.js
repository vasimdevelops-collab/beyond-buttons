/**
 * Transactional email via SMTP (Nodemailer).
 *
 * In development (or when SMTP is not configured), emails are NOT sent.
 * Instead the full message is printed to the server console so the flow
 * works end-to-end without an email provider.
 *
 * In production every required SMTP variable must be set — if any are
 * missing, sendTransactionalEmail throws so the problem surfaces clearly
 * instead of silently swallowing messages.
 *
 * Required env vars (production):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 * Optional:
 *   SMTP_FROM  — defaults to SMTP_USER
 */

import nodemailer from "nodemailer";

const IS_DEV = process.env.NODE_ENV !== "production";

/** Returns true when all required SMTP env vars are present and look real. */
export function isSmtpConfigured() {
  const host = process.env.SMTP_HOST || "";
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  
  // Reject obvious dummy/test values
  const isDummy = (value) => 
    !value || 
    value.includes("example.com") || 
    value === "test" || 
    value === "testpassword" ||
    value === "your_smtp_password";

  return Boolean(host && user && pass && !isDummy(host) && !isDummy(user) && !isDummy(pass));
}

export function getSmtpTransport() {
  if (!isSmtpConfigured()) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send a transactional email.
 *
 * - Dev / unconfigured: logs to console instead of sending.
 * - Production + configured: sends via SMTP.
 * - Production + unconfigured: throws so the missing config surfaces.
 *
 * @param {{ to: string, subject: string, html?: string, text?: string }} options
 */
export async function sendTransactionalEmail({ to, subject, html, text }) {
  const transporter = getSmtpTransport();

  if (!transporter) {
    if (!IS_DEV) {
      // In production, missing SMTP is a hard failure — don't silently drop emails.
      throw new Error(
        "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS to send emails."
      );
    }

    // Dev fallback — print to console so reset links / order confirms are accessible.
    console.log("\n╔══════════════════════════════════════════════════════════");
    console.log(`║ [EMAIL DEV FALLBACK] — SMTP not configured`);
    console.log(`║ To:      ${to}`);
    console.log(`║ Subject: ${subject}`);
    if (text) {
      console.log(`║ Body:\n║   ${text.replace(/\n/g, "\n║   ")}`);
    }
    // Extract all href links from the HTML so dev can click them directly.
    if (html) {
      const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      if (links.length > 0) {
        console.log(`║ Links:`);
        links.forEach((link) => console.log(`║   ${link}`));
      }
    }
    console.log("╚══════════════════════════════════════════════════════════\n");
    return { devMode: true, to, subject };
  }

  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
}

/* ── Email template helpers ───────────────────────────────────────────────── */

const BRAND_NAME = "Beyond Buttons";
const SUPPORT_EMAIL = process.env.SMTP_FROM || "support@beyondbuttons.com";
const LOGO_URL = "https://beyondbuttons.com/images/logo.png";

function emailShell(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
    <!-- Header -->
    <tr>
      <td style="padding:32px;text-align:center;border-bottom:1px solid #e5e5e5;">
        <img src="${LOGO_URL}" alt="${BRAND_NAME}" style="height:40px;" />
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:40px 32px;">
        ${bodyHtml}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:24px 32px;text-align:center;border-top:1px solid #e5e5e5;background:#fafafa;">
        <p style="margin:0 0 8px;font-size:13px;color:#666;">
          Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color:#111;text-decoration:underline;">${SUPPORT_EMAIL}</a>
        </p>
        <p style="margin:0;font-size:12px;color:#999;">${BRAND_NAME} · Luxury Solid T-Shirts</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Password reset email template.
 * @param {{ name?: string, url: string }} options
 */
export function buildPasswordResetEmail({ name, url }) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const body = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#111;">Reset your password</h1>
    <p style="margin:0 0 24px;font-size:16px;color:#555;">${greeting}</p>
    <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
      We received a request to reset the password for your ${BRAND_NAME} account.
      Click the button below to choose a new password. This link expires in&nbsp;<strong>1&nbsp;hour</strong>.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${url}"
         style="display:inline-block;padding:14px 32px;background:#111;color:#fff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;letter-spacing:.3px;">
        Reset Password
      </a>
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#999;text-align:center;">
      Or copy this link into your browser:
    </p>
    <p style="margin:0;font-size:12px;color:#888;text-align:center;word-break:break-all;">
      <a href="${url}" style="color:#555;">${url}</a>
    </p>
    <p style="margin:32px 0 0;font-size:13px;color:#aaa;text-align:center;">
      If you didn't request a password reset, you can safely ignore this email.<br/>
      Your password will not change.
    </p>
  `;
  return {
    subject: `Reset your ${BRAND_NAME} password`,
    html: emailShell(`Reset your password — ${BRAND_NAME}`, body),
    text: `Reset your ${BRAND_NAME} password\n\n${greeting}\n\nClick the link below to reset your password (expires in 1 hour):\n${url}\n\nIf you didn't request this, ignore this email.`,
  };
}

/**
 * Email verification template.
 * @param {{ name?: string, url: string }} options
 */
export function buildEmailVerificationEmail({ name, url }) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const body = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#111;">Verify your email</h1>
    <p style="margin:0 0 24px;font-size:16px;color:#555;">${greeting}</p>
    <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
      Welcome to ${BRAND_NAME}! Please verify your email address to activate your account.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${url}"
         style="display:inline-block;padding:14px 32px;background:#111;color:#fff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;letter-spacing:.3px;">
        Verify Email Address
      </a>
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#999;text-align:center;">
      Or copy this link into your browser:
    </p>
    <p style="margin:0;font-size:12px;color:#888;text-align:center;word-break:break-all;">
      <a href="${url}" style="color:#555;">${url}</a>
    </p>
    <p style="margin:32px 0 0;font-size:13px;color:#aaa;text-align:center;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  `;
  return {
    subject: `Verify your email — ${BRAND_NAME}`,
    html: emailShell(`Verify your email — ${BRAND_NAME}`, body),
    text: `Welcome to ${BRAND_NAME}!\n\n${greeting}\n\nVerify your email address:\n${url}\n\nIf you didn't create an account, ignore this email.`,
  };
}
