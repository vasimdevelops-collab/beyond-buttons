import { NextResponse } from "next/server";

import { getHomeProductsServer } from "@/lib/data";

/**
 * GET /api/site/products
 * Fresh, database-backed product feed for the storefront (home page grid).
 * Featured products first, then the newest additions — so anything added or
 * edited in the admin panel shows up on the website without a rebuild.
 */
export async function GET() {
  try {
    const products = await getHomeProductsServer();
    return NextResponse.json({ products });
  } catch (error) {
    console.error("[site/products] GET failed:", error);
    return NextResponse.json({ products: [] }, { status: 200 });
  }
}
