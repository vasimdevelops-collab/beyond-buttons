import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import homepageData from "@/data/homepage/homepage.json";
import { bootstrapDatabase, HomepageModel } from "@/lib/database/register";

const DEFAULT_HOME = homepageData;

function normalizeHomeRecord(doc) {
  const source = doc || DEFAULT_HOME;
  const hero = source.hero || DEFAULT_HOME.hero;
  const buttons = hero.buttons || DEFAULT_HOME.hero.buttons;

  return {
    ...DEFAULT_HOME,
    ...source,
    hero: {
      ...DEFAULT_HOME.hero,
      ...hero,
      media: {
        ...DEFAULT_HOME.hero.media,
        ...(hero.media || {}),
      },
      buttons: {
        ...DEFAULT_HOME.hero.buttons,
        ...(buttons || {}),
        primary: {
          ...DEFAULT_HOME.hero.buttons.primary,
          ...(buttons?.primary || {}),
        },
        secondary: {
          ...DEFAULT_HOME.hero.buttons.secondary,
          ...(buttons?.secondary || {}),
        },
      },
      headlineLines: Array.isArray(hero.headlineLines) && hero.headlineLines.length > 0 ? hero.headlineLines : DEFAULT_HOME.hero.headlineLines,
      subtitleLines: Array.isArray(hero.subtitleLines) && hero.subtitleLines.length > 0 ? hero.subtitleLines : DEFAULT_HOME.hero.subtitleLines,
    },
    headings: { ...DEFAULT_HOME.headings, ...(source.headings || {}) },
    footer: { ...DEFAULT_HOME.footer, ...(source.footer || {}) },
    socialLinks: { ...DEFAULT_HOME.socialLinks, ...(source.socialLinks || {}) },
  };
}

export async function GET() {
  try {
    await bootstrapDatabase();
    const existing = await HomepageModel.findOne({ id: "default" }).lean().exec();
    return NextResponse.json(normalizeHomeRecord(existing || DEFAULT_HOME));
  } catch (error) {
    console.error("[site/homepage] GET failed:", error);
    return NextResponse.json(normalizeHomeRecord(DEFAULT_HOME));
  }
}

export async function PUT(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });

  try {
    await bootstrapDatabase();
    const incoming = await request.json();
    const current = (await HomepageModel.findOne({ id: "default" }).lean().exec()) || DEFAULT_HOME;
    const nextHero = {
      ...DEFAULT_HOME.hero,
      ...(current.hero || {}),
      ...(incoming.hero || {}),
      media: {
        ...DEFAULT_HOME.hero.media,
        ...((current.hero && current.hero.media) || {}),
        ...((incoming.hero && incoming.hero.media) || {}),
      },
      buttons: {
        ...DEFAULT_HOME.hero.buttons,
        ...((current.hero && current.hero.buttons) || {}),
        ...((incoming.hero && incoming.hero.buttons) || {}),
        primary: {
          ...DEFAULT_HOME.hero.buttons.primary,
          ...((current.hero && current.hero.buttons && current.hero.buttons.primary) || {}),
          ...((incoming.hero && incoming.hero.buttons && incoming.hero.buttons.primary) || {}),
        },
        secondary: {
          ...DEFAULT_HOME.hero.buttons.secondary,
          ...((current.hero && current.hero.buttons && current.hero.buttons.secondary) || {}),
          ...((incoming.hero && incoming.hero.buttons && incoming.hero.buttons.secondary) || {}),
        },
      },
    };

    const nextHome = normalizeHomeRecord({
      ...DEFAULT_HOME,
      ...current,
      ...incoming,
      id: "default",
      status: "published",
      hero: nextHero,
    });

    await HomepageModel.updateOne(
      { id: "default" },
      { $set: nextHome },
      { upsert: true }
    );

    return NextResponse.json(nextHome);
  } catch (error) {
    console.error("[site/homepage] PUT failed:", error);
    return NextResponse.json({ error: "Unable to update homepage" }, { status: 500 });
  }
}
