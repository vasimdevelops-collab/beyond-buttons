/**
 * Admin credentials — the single Studio administrator account.
 *
 * Stored in the `admincredentials` collection. On first access the record is
 * seeded from ADMIN_EMAIL / ADMIN_PASSWORD (.env). Afterwards the Studio →
 * Admin module updates it (the .env values are only the initial seed).
 *
 * Passwords are stored as scrypt hashes with a per-record salt.
 */

import crypto from "crypto";

import { bootstrapDatabase, AdminCredentialModel } from "@/lib/database/register";

const DEFAULT_ID = "main";

function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString("hex");
}

function timingSafeEqualHex(a, b) {
  const left = Buffer.from(a || "", "hex");
  const right = Buffer.from(b || "", "hex");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

async function ensureCredential() {
  await bootstrapDatabase();

  const existing = await AdminCredentialModel.findOne({ id: DEFAULT_ID }).lean().exec();
  if (existing) return existing;

  const email = String(process.env.ADMIN_EMAIL || "").trim();
  const password = String(process.env.ADMIN_PASSWORD || "");
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const doc = await AdminCredentialModel.findOneAndUpdate(
    { id: DEFAULT_ID },
    {
      $set: {
        id: DEFAULT_ID,
        email,
        passwordHash: hashPassword(password, salt),
        salt,
        updatedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  ).lean().exec();
  return doc;
}

/** Current admin email (seeding the record from .env when it does not exist). */
export async function getAdminEmail() {
  const doc = await ensureCredential();
  return String(doc?.email || "");
}

/** Verify an email/password pair against the single admin credential. */
export async function verifyAdminCredentials(email, password) {
  const doc = await ensureCredential();
  const emailMatches =
    String(email || "").trim().toLowerCase() ===
    String(doc?.email || "").trim().toLowerCase();
  if (!emailMatches || !doc?.salt || !doc?.passwordHash) return false;
  return timingSafeEqualHex(hashPassword(password, doc.salt), doc.passwordHash);
}

/**
 * Update the admin email / password. Requires the current password.
 * If `newPassword` is omitted, the existing password is kept.
 * @returns {{ success: true, email: string } | { error: string }}
 */
export async function updateAdminCredentials({ email, currentPassword, newPassword }) {
  const doc = await ensureCredential();

  if (!doc?.salt || !doc?.passwordHash) {
    return { error: "Admin credentials are not configured." };
  }
  if (!timingSafeEqualHex(hashPassword(String(currentPassword || ""), doc.salt), doc.passwordHash)) {
    return { error: "Current password is incorrect." };
  }

  const nextEmail = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
    return { error: "Enter a valid admin email address." };
  }

  const update = { email: nextEmail, updatedAt: new Date() };

  if (newPassword) {
    if (String(newPassword).length < 8) {
      return { error: "New password must be at least 8 characters long." };
    }
    const salt = crypto.randomBytes(16).toString("hex");
    update.salt = salt;
    update.passwordHash = hashPassword(String(newPassword), salt);
  }

  await AdminCredentialModel.updateOne({ id: DEFAULT_ID }, { $set: update }).exec();
  return { success: true, email: nextEmail };
}