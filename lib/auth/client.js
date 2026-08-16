"use client";

/**
 * Better Auth — browser client.
 * Same-origin: baseURL resolves automatically when not set.
 */

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || undefined,
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: "string" },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession, forgetPassword, resetPassword } =
  authClient;
