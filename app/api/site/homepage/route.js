import { NextResponse } from "next/server";

import homepageData from "@/data/homepage/homepage.json";
import { bootstrapDatabase, HomepageModel } from "@/lib/database/register";

function normalizeHomepage(doc) {
  if (!doc) return homepageData;
  return {
    ...homepageData,
    ...doc,
    hero: {
      ...homepageData.hero,
      ...(doc.hero || {}),
    },
    intro: {
      ...homepageData.intro,
      ...(doc.intro || {}),
    },
    announcementBar: {
      ...homepageData.announcementBar,
      ...(doc.announcementBar || {}),
    },
    collections: doc.collections || homepageData.collections,
    featuredProductIds: doc.featuredProductIds || homepageData.featuredProductIds,
    descriptions: {
      ...homepageData.descriptions,
      ...(doc.descriptions || {}),
      whyFeatures: doc.descriptions?.whyFeatures || homepageData.descriptions.whyFeatures,
    },
  };
}

export async function GET() {
  try {
    await bootstrapDatabase();
    const existing = await HomepageModel.findOne({ id: "default" }).lean().exec();
    return NextResponse.json(normalizeHomepage(existing));
  } catch (error) {
    console.error("[site/homepage] GET failed:", error);
    return NextResponse.json(homepageData);
  }
}