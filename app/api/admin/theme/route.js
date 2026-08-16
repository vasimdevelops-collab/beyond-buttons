import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase, ThemeModel } from "@/lib/database/register";

const DEFAULT_THEME = {
  id: "default",
  defaultTheme: "light",
  accent: "#B08D57",
  background: "#F5F1EA",
  text: "#171717",
  card: "#FFFFFF",
  highlight: "#D4AF37",
};

export async function GET(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const doc = await ThemeModel.findOne({ id: "default" }).lean().exec();
    return NextResponse.json({
      ...DEFAULT_THEME,
      ...(doc || {}),
    });
  } catch (error) {
    console.error("[admin/theme] GET failed:", error);
    return NextResponse.json(DEFAULT_THEME, { status: 200 });
  }
}

export async function PUT(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const body = await request.json();
    const next = {
      ...DEFAULT_THEME,
      ...body,
      id: "default",
    };

    await ThemeModel.updateOne(
      { id: "default" },
      { $set: next },
      { upsert: true }
    );

    return NextResponse.json(next);
  } catch (error) {
    console.error("[admin/theme] PUT failed:", error);
    return NextResponse.json({ error: "Unable to save theme" }, { status: 500 });
  }
}
