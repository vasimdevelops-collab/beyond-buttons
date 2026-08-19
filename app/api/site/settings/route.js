import { NextResponse } from "next/server";

import settingsData from "@/data/settings/settings.json";
import { bootstrapDatabase, SettingsModel } from "@/lib/database/register";

function normalizeSettings(doc) {
  if (!doc) return settingsData;
  const social = doc.social || {};
  const meta = doc.meta || {};
  return {
    version: 1,
    brandName: doc.brandName || settingsData.brandName || "Beyond Buttons",
    phone: doc.phone || "",
    email: doc.email || "",
    whatsapp: social.whatsapp || "",
    address: meta.address || "",
    instagram: social.instagram || "",
    facebook: social.facebook || "",
    youtube: social.youtube || "",
    metaTitle: meta.metaTitle || settingsData.metaTitle || "Beyond Buttons",
    metaDescription: meta.metaDescription || settingsData.metaDescription || "",
    logo: meta.logo || settingsData.logo || { full: "/images/logo.png", mark: "/images/B.png" },
    locale: doc.locale || settingsData.locale || "en-IN",
    currency: doc.currency || settingsData.currency || "INR",
    defaultTheme: meta.defaultTheme || settingsData.defaultTheme || "dark",
  };
}

export async function GET() {
  try {
    await bootstrapDatabase();
    const existing = await SettingsModel.findOne({ id: "default" }).lean().exec();
    return NextResponse.json(normalizeSettings(existing));
  } catch (error) {
    console.error("[site/settings] GET failed:", error);
    return NextResponse.json(settingsData);
  }
}