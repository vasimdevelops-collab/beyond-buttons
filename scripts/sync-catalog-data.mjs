/**
 * One-time catalog sync: aligns the MongoDB product/category/homepage records
 * with the client-approved storefront copy changes:
 *   1. "Black Solid T-Shirt" -> "Beyond One" (display name, slug unchanged)
 *   2. "White Solid T-Shirt" -> "White Solid Shirt"
 *   3. Add fabric + story to products that lack them
 *   4. Expand Beyond One to a 12-colour edit (merging with existing colours)
 *   5. Category "Solid T-Shirts" -> "Solid Shirts"
 *   6. Homepage hero headline: drop "We don't sell shirts."
 *   7. Set real pricing on products seeded without it (navy-blue-t-shirt)
 *   8. Archive the incomplete duplicate "beyond-one" product
 *   9. Reattach products to the Solid Shirts category (by id)
 *   10. Seed the Studio Media Library with the shipped brand/product assets
 *   11. Harden: fix stale hero button hrefs + hide the orphaned "blue t shirt" category
 *
 * Run: node scripts/sync-catalog-data.mjs
 * Uses the MONGODB_URI / MONGODB_DB_NAME from .env.
 */

import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const root = process.cwd();
const envPath = path.join(root, ".env");
const env = fs.existsSync(envPath)
  ? fs
      .readFileSync(envPath, "utf8")
      .split("\n")
      .reduce((acc, line) => {
        const match = line.match(/^\s*([A-Z0-9_]+)=(.*)$/i);
        if (match) acc[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
        return acc;
      }, {})
  : {};

const URI = process.env.MONGODB_URI || env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || env.MONGODB_DB_NAME;

if (!URI) {
  console.error("MONGODB_URI not found in .env — nothing to sync.");
  process.exit(0);
}

const FABRIC = {
  material: "Premium 100% Combed Cotton",
  gsm: "240 GSM",
  finish: "Brushed, pre-shrunk, soft-touch",
  origin: "Ethically sourced, garment-dyed",
};

const STORY_BEYOND_ONE =
  "Beyond One is where it all begins. A single shirt, cut clean and made properly — the answer to every wardrobe that has too much and still feels like nothing fits.";

const STORY_WHITE =
  "A precise white shirt — bright without harshness, structured for quiet confidence.";

const PALETTE = [
  { name: "Jet Black", hex: "#0A0A0A", slug: "jet-black" },
  { name: "Pure White", hex: "#F7F7F5", slug: "pure-white" },
  { name: "Oat", hex: "#EDE6DA", slug: "oat" },
  { name: "Stone Grey", hex: "#9A9A94", slug: "stone-grey" },
  { name: "Charcoal", hex: "#2B2B2B", slug: "charcoal" },
  { name: "Navy", hex: "#1C2B4A", slug: "navy" },
  { name: "Oxford Blue", hex: "#34558B", slug: "oxford-blue" },
  { name: "Sage", hex: "#A3B18A", slug: "sage" },
  { name: "Olive", hex: "#6B705C", slug: "olive" },
  { name: "Terracotta", hex: "#B4613A", slug: "terracotta" },
  { name: "Maroon", hex: "#7D2E36", slug: "maroon" },
  { name: "Sand", hex: "#D2B48C", slug: "sand" },
];

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  await mongoose.connect(URI, { dbName: DB_NAME });
  const db = mongoose.connection.db;

  const products = db.collection("products");
  const categories = db.collection("categories");
  const homepages = db.collection("homepages");

  // ── 1 & 2 & 3. Product renames + fabric + story ──────────────────────
const renames = {
  "black-solid-t-shirt": { name: "Beyond One", shortName: "Beyond One", story: STORY_BEYOND_ONE },
  "white-solid-t-shirt": { name: "White Solid Shirt", shortName: "White Solid Shirt", story: STORY_WHITE },
  "navy-blue-t-shirt": { name: "Navy Blue Shirt", shortName: "Navy Blue Shirt", story: STORY_BEYOND_ONE },
};

// Products that were seeded without a price — without one the storefront would
// render "₹0" on the listing/PDP. Set top-level + every colour so both the
// category grid and the product page resolve a real price.
const pricing = {
  "navy-blue-t-shirt": { price: 1399, comparePrice: 1899 },
};

  for (const [slug, meta] of Object.entries(renames)) {
    const doc = await products.findOne({ slug });
    if (!doc) {
      console.log(`[products] skip (not found): ${slug}`);
      continue;
    }

    const set = {
      "generalInformation.name": meta.name,
      "generalInformation.shortName": meta.shortName || meta.name,
    };

    if (!doc.fabric || !Object.values(doc.fabric || {}).some(Boolean)) {
      set.fabric = FABRIC;
    }
    if (!doc.story?.lead) {
      set["story.lead"] = meta.story;
    }

    await products.updateOne({ slug }, { $set: set });
    console.log(`[products] updated: ${slug} -> "${meta.name}"`);
  }

  // ── 4. Expand Beyond One to 12 colours ───────────────────────────────
  const beyondOne = await products.findOne({ slug: "black-solid-t-shirt" });
  if (beyondOne) {
    const variant = Array.isArray(beyondOne.variants) ? beyondOne.variants[0] : null;
    const colors = Array.isArray(variant?.colors) ? variant.colors : [];
    const defaultColor =
      colors.find((color) => color.isDefault) || colors[0] || null;

    const existingSlugs = new Set(colors.map((color) => color.color?.slug || slugify(color.color?.name || color.name || "")));
    const missing = PALETTE.filter((entry) => !existingSlugs.has(entry.slug));

    if (missing.length) {
      const baseSizes = Array.isArray(defaultColor?.sizes) && defaultColor.sizes.length
        ? defaultColor.sizes
        : ["S", "M", "L", "XL", "XXL"].map((size) => ({ size, stock: 10, sku: "" }));

      const additions = missing.map((entry, index) => ({
        id: `beyond-one-${entry.slug}`,
        color: {
          name: entry.name,
          slug: entry.slug,
          hex: entry.hex,
        },
        status: "active",
        isDefault: !defaultColor && index === 0,
        price: defaultColor?.price ?? beyondOne.price ?? null,
        comparePrice: defaultColor?.comparePrice ?? beyondOne.comparePrice ?? null,
        attributes: [],
        media: {},
        sizes: baseSizes.map((sizeEntry) => ({
          size: sizeEntry.size,
          stock: Number(sizeEntry.stock) || 10,
          sku: sizeEntry.sku || `BEYOND-ONE-${entry.slug.toUpperCase()}-${String(sizeEntry.size).toUpperCase()}`,
        })),
      }));

      await products.updateOne(
        { slug: "black-solid-t-shirt" },
        { $push: { "variants.0.colors": { $each: additions } } }
      );
      console.log(`[products] Beyond One: added ${additions.length} colours (total ${colors.length + additions.length}/12)`);
    } else {
      console.log(`[products] Beyond One: already has ${colors.length} colours — no changes.`);
    }
  }

  // ── 5. Category rename ───────────────────────────────────────────────
  const cat = await categories.findOne({ slug: "solid-t-shirts" });
  if (cat && cat.name && String(cat.name).includes("T-Shirt")) {
    await categories.updateOne(
      { slug: "solid-t-shirts" },
      { $set: { name: "Solid Shirts" } }
    );
    console.log("[categories] solid-t-shirts -> Solid Shirts");
  } else {
    console.log("[categories] already 'Solid Shirts' or not found.");
  }

  await products.updateMany(
    { categoryId: "solid-t-shirts" },
    { $set: { categoryName: "Solid Shirts" } }
  );

  // ── 6. Homepage hero headline ────────────────────────────────────────
  const homepage = await homepages.findOne({ id: "default" });
  if (homepage?.hero?.headlineLines) {
    const cleaned = homepage.hero.headlineLines.filter(
      (line) => !/we don'?t sell shirts/i.test(String(line))
    );
    if (cleaned.length !== homepage.hero.headlineLines.length) {
      await homepages.updateOne(
        { id: "default" },
        { $set: { "hero.headlineLines": cleaned } }
      );
      console.log("[homepage] removed 'We don't sell shirts.' headline");
    } else {
      console.log("[homepage] headline already clean.");
    }
  } else {
    console.log("[homepage] no DB homepage doc — JSON fallback is already updated.");
  }

  // ── 7. Ensure pricing on products seeded without one ──────────────────
  for (const [slug, priceMeta] of Object.entries(pricing)) {
    const doc = await products.findOne({ slug });
    if (!doc) {
      console.log(`[pricing] skip (not found): ${slug}`);
      continue;
    }
    if (Number(doc.price) > 0) {
      console.log(`[pricing] ${slug} already priced (₹${doc.price}) — no changes.`);
      continue;
    }
    await products.updateOne(
      { slug },
      {
        $set: {
          price: priceMeta.price,
          comparePrice: priceMeta.comparePrice,
          "variants.0.colors.$[].price": priceMeta.price,
          "variants.0.colors.$[].comparePrice": priceMeta.comparePrice,
        },
      }
    );
    console.log(`[pricing] ${slug} -> ₹${priceMeta.price} (MRP ₹${priceMeta.comparePrice})`);
  }

  // ── 8. Archive the incomplete duplicate "BEYOND ONE" product ──────────
  // `beyond-one` was an early seed with no media, no price and a single colour.
  // It duplicates the real "Beyond One" (slug `black-solid-t-shirt`) and was the
  // source of the oversized-logo placeholder + "₹0" on the Solid Shirts grid.
  const dup = await products.findOne({ slug: "beyond-one" });
  if (dup && dup.status !== "archived") {
    await products.updateOne({ slug: "beyond-one" }, { $set: { status: "archived" } });
    console.log("[products] archived duplicate: beyond-one");
  } else {
    console.log("[products] beyond-one already archived or not found.");
  }

  // ── 9. Reattach products to the Solid Shirts category ────────────────
  // A re-seed left these products pointing at stale/missing category refs
  // ("uncategorized", "blue t shirt"). Reattach them to the canonical
  // category *by id* so /category/solid-t-shirts keeps matching — the slug
  // is intentionally untouched, only the display text changed.
  const CATEGORY_SLUG = "solid-t-shirts";
  const reattach = await products.updateMany(
    { slug: { $in: Object.keys(renames) } },
    { $set: { categoryId: CATEGORY_SLUG, categoryName: "Solid Shirts" } }
  );
  console.log(`[products] reattached ${reattach.modifiedCount} products to category "${CATEGORY_SLUG}"`);

  // ── 10. Seed the Studio Media Library ────────────────────────────────
  // The Media Library reads from the `media` collection, which ships empty —
  // so Brand / Homepage / Products / Lifestyle folders all show
  // "No media yet" until an upload happens. Populate them with the existing
  // /public/images assets (idempotent: existing assets are left untouched).
  const media = db.collection("media");
  const MEDIA_SEED = [
    { id: "media-logo", src: "/images/logo.png", alt: "Beyond Buttons logo", filename: "logo.png", mimeType: "image/png", folderId: "brand", folderLabel: "Brand" },
    { id: "media-b", src: "/images/B.png", alt: "Beyond Buttons mark", filename: "B.png", mimeType: "image/png", folderId: "brand", folderLabel: "Brand" },
    { id: "media-homeback", src: "/images/homeback.jpeg", alt: "Homepage background", filename: "homeback.jpeg", mimeType: "image/jpeg", folderId: "homepage", folderLabel: "Homepage" },
    { id: "media-images", src: "/images/images.jfif", alt: "Product image", filename: "images.jfif", mimeType: "image/jpeg", folderId: "products", folderLabel: "Products" },
    { id: "media-images-1", src: "/images/images%20(1).jfif", alt: "Product image", filename: "images (1).jfif", mimeType: "image/jpeg", folderId: "products", folderLabel: "Products" },
    { id: "media-images-2", src: "/images/images%20(2).jfif", alt: "Product image", filename: "images (2).jfif", mimeType: "image/jpeg", folderId: "products", folderLabel: "Products" },
    { id: "media-images-3", src: "/images/images%20(3).jfif", alt: "Product image", filename: "images (3).jfif", mimeType: "image/jpeg", folderId: "products", folderLabel: "Products" },
    { id: "media-images-4", src: "/images/images%20(4).jfif", alt: "Product image", filename: "images (4).jfif", mimeType: "image/jpeg", folderId: "products", folderLabel: "Products" },
    { id: "media-images-5", src: "/images/images%20(5).jfif", alt: "Product image", filename: "images (5).jfif", mimeType: "image/jpeg", folderId: "products", folderLabel: "Products" },
  ];

  for (const asset of MEDIA_SEED) {
    const exists = await media.findOne({ id: asset.id });
    if (exists) {
      console.log(`[media] skip (exists): ${asset.id}`);
      continue;
    }
    const size = fs.existsSync(path.join(root, "public", asset.src))
      ? fs.statSync(path.join(root, "public", asset.src)).size
      : null;
    await media.updateOne(
      { id: asset.id },
      {
        $setOnInsert: {
          id: asset.id,
          src: asset.src,
          alt: asset.alt,
          filename: asset.filename,
          mimeType: asset.mimeType,
          width: null,
          height: null,
          size,
          type: "image",
          folderId: asset.folderId,
          folderLabel: asset.folderLabel,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    console.log(`[media] seeded: ${asset.id} -> ${asset.folderLabel}`);
  }

  // ── 11. Harden: hero button hrefs + orphaned categories ─────────────
  // A stale seed once pointed the hero "Shop Collection" button at
  // "/category/solid-shirts" (no such slug -> 404). The real category slug is
  // "solid-t-shirts". Also hide the orphaned "blue t shirt" (slug "men")
  // category that shows up as junk in the shop page category chips.
  const heroHome = await homepages.findOne({ id: "default" });
  const primaryHref = heroHome?.hero?.buttons?.primary?.href;
  if (primaryHref === "/category/solid-shirts") {
    await homepages.updateOne(
      { id: "default" },
      { $set: { "hero.buttons.primary.href": "/category/solid-t-shirts" } }
    );
    console.log(`[homepage] fixed hero primary href -> /category/solid-t-shirts`);
  }

  const junkCats = await categories
    .find({ $or: [{ id: /^men-/, name: /blue t shirt/i }] })
    .toArray();
  for (const junk of junkCats) {
    if (junk.visibility === false) continue;
    await categories.updateOne(
      { _id: junk._id },
      { $set: { visibility: false } }
    );
    console.log(`[categories] hidden orphaned category: ${junk.name} (slug "${junk.slug}")`);
  }

  await mongoose.disconnect();
  console.log("Done. Catalog sync complete.");
}

main().catch((error) => {
  console.error("Sync failed:", error);
  process.exit(1);
});
