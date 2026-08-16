/**
 * Environment variable validation — run at app startup.
 *
 * Call `validateEnv()` from any server entrypoint (e.g. next.config.mjs,
 * or lazily on first request) to fail clearly when required vars are missing.
 *
 * Variables are split into three tiers:
 *   REQUIRED   — app cannot function at all without these.
 *   PRODUCTION — only required in production (NODE_ENV === "production").
 *   OPTIONAL   — warn if missing so the dev knows to set them before launch.
 */

/** Always required, regardless of environment. */
const REQUIRED_VARS = [
  { key: "MONGODB_URI", description: "MongoDB connection string" },
  { key: "BETTER_AUTH_SECRET", description: "Better Auth signing secret (generate with: openssl rand -base64 32)" },
  { key: "BETTER_AUTH_URL", description: "Full public URL of this app (e.g. https://yourdomain.com)" },
];

/** Required only when NODE_ENV=production. */
const PRODUCTION_VARS = [
  { key: "SMTP_HOST", description: "SMTP hostname for transactional email" },
  { key: "SMTP_USER", description: "SMTP username / sender address" },
  { key: "SMTP_PASS", description: "SMTP password" },
  { key: "RAZORPAY_WEBHOOK_SECRET", description: "Razorpay webhook signing secret" },
];

/** Optional — warn in development but do not block startup. */
const OPTIONAL_VARS = [
  { key: "MONGODB_DB_NAME", description: "MongoDB database name (defaults to URI default)" },
  { key: "NEXT_PUBLIC_RAZORPAY_KEY_ID", description: "Razorpay public key (enables online payments in the UI)" },
  { key: "RAZORPAY_KEY_ID", description: "Razorpay key ID (server-side)" },
  { key: "RAZORPAY_KEY_SECRET", description: "Razorpay key secret" },
  { key: "GOOGLE_CLIENT_ID", description: "Google OAuth client ID (enables Google sign-in)" },
  { key: "GOOGLE_CLIENT_SECRET", description: "Google OAuth client secret" },
  { key: "SMTP_FROM", description: "From address for outbound emails (defaults to SMTP_USER)" },
  { key: "SMTP_PORT", description: "SMTP port (defaults to 587)" },
];

/**
 * Validate environment variables.
 *
 * @param {{ strict?: boolean }} options
 *   strict — if true, treat PRODUCTION_VARS as required in all environments
 *            (useful for CI smoke tests). Defaults to false.
 *
 * @throws {Error} when any REQUIRED var (or PRODUCTION var in production) is missing.
 */
export function validateEnv({ strict = false } = {}) {
  const isProduction = process.env.NODE_ENV === "production";
  const missing = [];
  const warnings = [];

  // Always-required vars.
  for (const { key, description } of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(`  ${key.padEnd(30)} — ${description}`);
    }
  }

  // Production-only (or strict-mode) vars.
  if (isProduction || strict) {
    for (const { key, description } of PRODUCTION_VARS) {
      if (!process.env[key]) {
        missing.push(`  ${key.padEnd(30)} — ${description}`);
      }
    }
  }

  if (missing.length > 0) {
    const env = isProduction ? "production" : "development";
    throw new Error(
      `\n\n❌  Beyond Buttons — Missing required environment variables (${env}):\n\n` +
        missing.join("\n") +
        `\n\nCopy .env.example to .env and fill in the values above.\n`
    );
  }

  // Optional var warnings (development only, non-fatal).
  if (!isProduction) {
    for (const { key, description } of OPTIONAL_VARS) {
      if (!process.env[key]) {
        warnings.push(`  ${key.padEnd(30)} — ${description}`);
      }
    }
    // Also warn about production vars not being set in dev (so devs know what to prepare).
    for (const { key, description } of PRODUCTION_VARS) {
      if (!process.env[key]) {
        warnings.push(`  ${key.padEnd(30)} — ${description} [required in production]`);
      }
    }

    if (warnings.length > 0) {
      console.warn(
        `\n⚠️   Beyond Buttons — Optional/production env vars not set:\n\n` +
          warnings.join("\n") +
          `\n\nThese are not required for local development but must be set before deploying.\n`
      );
    }
  }

  return true;
}

/**
 * Lazily-validated singleton — safe to call many times.
 * Validation only runs once per process lifetime.
 */
let _validated = false;
export function ensureEnv() {
  if (_validated) return;
  validateEnv();
  _validated = true;
}
