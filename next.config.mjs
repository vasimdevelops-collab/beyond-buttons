import { validateEnv } from "./lib/env.js";

// Validate required environment variables at build/startup time.
// The check is skipped during `next lint` and similar analysis-only passes.
// It fails loudly if required vars are missing — no silent mis-configuration.
if (process.env.NEXT_PHASE !== "phase-export" && process.env.SKIP_ENV_VALIDATION !== "1") {
  try {
    validateEnv();
  } catch (error) {
    // Print clearly and exit so the dev sees the problem immediately.
    console.error(error.message);
    process.exit(1);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    qualities: [75, 85],
  },
};

export default nextConfig;
