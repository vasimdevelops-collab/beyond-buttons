import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase, SettingsModel } from "@/lib/database/register";

const DEFAULT_SETTINGS = {
  id: "default",
  brandName: "Beyond Buttons",
  currency: "INR",
  locale: "en-IN",
  email: "hello@beyondbuttons.in",
  phone: "",
  whatsapp: "",
  address: "",
  instagram: "",
  facebook: "",
  youtube: "",
  supportHours: "Mon-Sat, 10am-7pm",
  metaTitle: "Beyond Buttons",
  metaDescription: "Luxury Solid Shirt Brand",
  defaultTheme: "dark",
};

/** Flatten the DB shape (social.* / meta.*) into the flat UI shape. */
function flattenSettings(doc) {
  if (!doc) return DEFAULT_SETTINGS;
  const social = doc.social || {};
  const meta = doc.meta || {};
  return {
    ...DEFAULT_SETTINGS,
    id: "default",
    brandName: doc.brandName || DEFAULT_SETTINGS.brandName,
    currency: doc.currency || DEFAULT_SETTINGS.currency,
    locale: doc.locale || DEFAULT_SETTINGS.locale,
    email: doc.email || DEFAULT_SETTINGS.email,
    phone: doc.phone || "",
    whatsapp: social.whatsapp || "",
    address: meta.address || "",
    instagram: social.instagram || "",
    facebook: social.facebook || "",
    youtube: social.youtube || "",
    supportHours: meta.supportHours || DEFAULT_SETTINGS.supportHours,
    metaTitle: meta.metaTitle || DEFAULT_SETTINGS.metaTitle,
    metaDescription: meta.metaDescription || DEFAULT_SETTINGS.metaDescription,
    defaultTheme: meta.defaultTheme || DEFAULT_SETTINGS.defaultTheme,
  };
}

/** Expand the flat UI shape into the DB shape (social.* / meta.*). */
function expandSettings(body = {}) {
  const base = { ...DEFAULT_SETTINGS, ...body };
  return {
    id: "default",
    brandName: String(base.brandName || "").trim() || DEFAULT_SETTINGS.brandName,
    currency: String(base.currency || "INR").trim() || "INR",
    locale: String(base.locale || "en-IN").trim() || "en-IN",
    email: String(base.email || "").trim(),
    phone: String(base.phone || "").trim(),
    social: {
      whatsapp: String(base.whatsapp || "").trim(),
      instagram: String(base.instagram || "").trim(),
      facebook: String(base.facebook || "").trim(),
      youtube: String(base.youtube || "").trim(),
    },
    meta: {
      address: String(base.address || "").trim(),
      supportHours: String(base.supportHours || "").trim(),
      metaTitle: String(base.metaTitle || "").trim(),
      metaDescription: String(base.metaDescription || "").trim(),
      defaultTheme: String(base.defaultTheme || "dark").trim(),
    },
  };
}

export async function GET(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const doc = await SettingsModel.findOne({ id: "default" }).lean().exec();
    return NextResponse.json(flattenSettings(doc));
  } catch (error) {
    console.error("[admin/settings] GET failed:", error);
    return NextResponse.json(DEFAULT_SETTINGS, { status: 200 });
  }
}

export async function PUT(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const body = await request.json();
    const next = expandSettings(body);

    await SettingsModel.updateOne(
      { id: "default" },
      { $set: next },
      { upsert: true }
    );

    return NextResponse.json(flattenSettings(next));
  } catch (error) {
    console.error("[admin/settings] PUT failed:", error);
    return NextResponse.json({ error: "Unable to save settings" }, { status: 500 });
  }
}