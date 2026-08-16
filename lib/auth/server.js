/**
 * Better Auth — server instance.
 *
 * Persists users, sessions, accounts, and verification tokens in the same
 * MongoDB database as the rest of the app (MONGODB_URI / MONGODB_DB_NAME),
 * via the native `mongodb` driver (Better Auth's Mongo adapter requires a
 * raw `Db`, not a Mongoose connection).
 *
 * Lazily constructed so `npm run build` and module import never fail when
 * environment variables are not yet configured — the same defensive
 * pattern used by lib/database/connection.js. Errors only surface when
 * authentication is actually used at runtime.
 */

import { MongoClient } from "mongodb";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";

import { bootstrapDatabase, CustomerModel } from "@/lib/database/register";
import { ROLES } from "@/lib/auth/roles";
import {
  sendTransactionalEmail,
  buildPasswordResetEmail,
  buildEmailVerificationEmail,
} from "@/lib/email/smtp";

const globalForAuth = globalThis;

function getGoogleProvider() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/**
 * Sync a Better Auth user into the existing (locked) Customer collection.
 * Best-effort — never blocks or fails registration.
 * @param {{ id: string, email: string, name?: string }} user
 */
async function syncCustomerProfile(user) {
  try {
    await bootstrapDatabase();
    await CustomerModel.updateOne(
      { email: user.email },
      {
        $setOnInsert: {
          id: user.id,
          email: user.email,
          fullName: user.name || user.email,
          status: "active",
        },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error("[auth] Failed to sync Customer profile:", error?.message || error);
  }
}

function buildAuth() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Authentication requires a MongoDB connection."
    );
  }

  const client = new MongoClient(uri);
  const db = client.db(process.env.MONGODB_DB_NAME || undefined);
  const google = getGoogleProvider();

  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: mongodbAdapter(db, { client }),

    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      /**
       * Password reset email.
       * In dev (or when SMTP is unconfigured) the link is printed to the
       * server console so the flow works without an email provider.
       * In production SMTP must be configured — sendTransactionalEmail
       * will throw clearly if it isn't.
       */
      sendResetPassword: async ({ user, url }) => {
        try {
          const { subject, html, text } = buildPasswordResetEmail({
            name: user.name,
            url,
          });
          await sendTransactionalEmail({ to: user.email, subject, html, text });
        } catch (error) {
          console.error("[auth] Password reset email failed:", error?.message || error);
        }
      },
    },

    /**
     * Email verification (optional — requireEmailVerification is false so
     * accounts work immediately, but the verification link is still sent
     * so users can opt in to verifying their address).
     */
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        try {
          const { subject, html, text } = buildEmailVerificationEmail({
            name: user.name,
            url,
          });
          await sendTransactionalEmail({ to: user.email, subject, html, text });
        } catch (error) {
          console.error("[auth] Verification email failed:", error?.message || error);
        }
      },
    },

    socialProviders: google ? { google } : undefined,

    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: ROLES.CUSTOMER,
          input: false, // never trust a client-supplied role
        },
      },
    },

    session: {
      /**
       * Sessions expire 7 days after the last login.
       * The cookie is refreshed daily as long as the user is active
       * (updateAge) — so active users stay signed in indefinitely.
       */
      expiresIn: 60 * 60 * 24 * 7,  // 7 days
      updateAge: 60 * 60 * 24,       // refresh cookie once per day
    },

    advanced: {
      /**
       * Secure cookies — only sent over HTTPS.
       * Automatically enabled in production, off in dev so localhost works.
       */
      useSecureCookies: process.env.NODE_ENV === "production",

      /**
       * Cookie prefix namespaces all Better Auth cookies so they don't
       * clash with other packages (e.g. NextAuth) if you ever run both.
       */
      cookiePrefix: "bb",

      /**
       * Cross-site cookie policy.
       * "lax" is the secure default: cookies are sent on top-level navigations
       * (e.g. clicking a link) but NOT on third-party subrequests.
       * Change to "none" only if you need cross-origin cookie sharing AND
       * you have useSecureCookies enabled.
       */
      defaultCookieAttributes: {
        sameSite: "lax",
        httpOnly: true,
        path: "/",
      },
    },

    trustedOrigins: process.env.BETTER_AUTH_URL
      ? [process.env.BETTER_AUTH_URL]
      : undefined,

    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await syncCustomerProfile(user);
          },
        },
      },
    },

    plugins: [nextCookies()],
  });
}

/** @returns {Promise<ReturnType<typeof betterAuth>>} */
export function getAuth() {
  if (globalForAuth.__bbAuthInstance) {
    return Promise.resolve(globalForAuth.__bbAuthInstance);
  }
  if (!globalForAuth.__bbAuthPromise) {
    globalForAuth.__bbAuthPromise = Promise.resolve().then(() => {
      const instance = buildAuth();
      globalForAuth.__bbAuthInstance = instance;
      return instance;
    });
  }
  return globalForAuth.__bbAuthPromise;
}
