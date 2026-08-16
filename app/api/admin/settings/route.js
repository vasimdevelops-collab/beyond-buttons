import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase, SettingsModel } from "@/lib/database/register";

const DEFAULT_SETTINGS = {
  id: "default",
  brandName: "Beyond Buttons",
  currency: "INR",
  locale: "en-IN",
  email: "hello@beyondbuttons.in",
  phone: "+91 98765 43210",
  supportHours: "Mon-Sat, 10am-7pm",
};

export async function GET(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const doc = await SettingsModel.findOne({ id: "default" }).lean().exec();
    return NextResponse.json({
      ...DEFAULT_SETTINGS,
      ...(doc || {}),
    });
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
    const next = {
      ...DEFAULT_SETTINGS,
      ...body,
      id: "default",
    };

    await SettingsModel.updateOne(
      { id: "default" },
      { $set: next },
      { upsert: true }
    );

    return NextResponse.json(next);
  } catch (error) {
    console.error("[admin/settings] PUT failed:", error);
    return NextResponse.json({ error: "Unable to save settings" }, { status: 500 });
  }
}
