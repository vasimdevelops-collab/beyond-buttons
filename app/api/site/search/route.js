import { NextResponse } from "next/server";

import { getProductsServer } from "@/lib/data";

function matchesQuery(product, query) {
  if (!query || !query.trim()) return false;
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 0);

  const haystack = [
    product.name,
    product.shortName,
    product.category,
    product.brandStatement,
    product.storyText,
    ...(Array.isArray(product.colors) ? product.colors.map((color) => color.name) : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return terms.every((term) => haystack.includes(term));
}

/**
 * GET /api/site/search?q=<query>
 * Returns products matching the search query.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = Math.min(Number(searchParams.get("limit")) || 24, 48);

    const allProducts = await getProductsServer();
    const filtered = allProducts
      .filter((product) => matchesQuery(product, query))
      .slice(0, limit);

    return NextResponse.json({ products: filtered, query });
  } catch (error) {
    console.error("[site/search] GET failed:", error);
    return NextResponse.json({ products: [], query: "" }, { status: 200 });
  }
}