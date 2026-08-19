import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase, ProductModel } from "@/lib/database/register";

function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
}

/**
 * Convert the editor's inventory map ({ XS: { stock, sku, enabled }, … })
 * into the DB sizes array ([{ size, sku, stock, availability, allowBackorder }]).
 */
function inventoryToSizes(inventory, colorSlug) {
  if (!inventory || typeof inventory !== "object") return [];
  return Object.entries(inventory)
    .filter(([, value]) => value && value.enabled !== false)
    .map(([sizeKey, value]) => {
      const stock = Math.max(0, Number(value?.stock) || 0);
      const sku =
        String(value?.sku || `${colorSlug}-${sizeKey}`).trim() ||
        `${colorSlug}-${sizeKey}`;
      const availability =
        stock > 0 ? "in_stock" : "out_of_stock";
      return {
        size: String(sizeKey),
        sku,
        stock,
        availability,
        allowBackorder: Boolean(value?.allowBackorder ?? false),
      };
    });
}

/**
 * Convert the DB sizes array back to the editor's inventory map so the
 * variants panel is populated when an existing product is loaded.
 */
function sizesToInventory(sizes) {
  if (!Array.isArray(sizes)) return {};
  return Object.fromEntries(
    sizes.map((entry) => [
      entry.size,
      {
        stock: String(entry.stock ?? 0),
        sku: entry.sku || "",
        enabled: entry.stock >= 0, // enabled as long as the size is tracked
        allowBackorder: Boolean(entry.allowBackorder),
      },
    ])
  );
}

/**
 * Keep only real MediaRef entries (objects with an src). The studio editor
 * initializes media slots to empty strings, which Mongoose cannot cast into a
 * MediaRef subdocument — that made product creation fail with a CastError.
 */
function sanitizeMedia(media) {
  if (!media || typeof media !== "object") return {};
  const cleaned = {};
  for (const [key, value] of Object.entries(media)) {
    if (key === "additional") {
      if (Array.isArray(value)) {
        cleaned.additional = value.filter(
          (entry) => entry && typeof entry === "object" && entry.src
        );
      }
      continue;
    }
    if (value && typeof value === "object" && value.src) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function normalizeColorEntry(color, productSlug) {
  const candidate = color || {};
  const name = String(candidate.name || "Default").trim() || "Default";
  const slug = String(candidate.slug || slugify(name)).trim() || slugify(name);

  // Fallback SKUs must be unique across the whole catalog. Two products (or two
  // colors in one product) that share a color slug used to generate the same
  // `${slug}-${size}` SKU, tripping the unique_sellable_sku index (E11000).
  // Prefixing with the product slug keeps auto-generated SKUs collision-free.
  const fallbackBase = [productSlug, slug].filter(Boolean).join("-") || slug;

  // Accept sizes either from the DB `sizes[]` field or the editor's `inventory{}` map.
  const hasSizes = Array.isArray(candidate.sizes) && candidate.sizes.length > 0;
  const sizes = hasSizes
    ? candidate.sizes
    : inventoryToSizes(candidate.inventory, fallbackBase);

  return {
    id: candidate.id || `${slug}-${Date.now()}`,
    color: {
      name,
      slug,
      hex: candidate.hex || "#0A0A0A",
      swatch: candidate.swatch || null,
    },
    status: candidate.status || "active",
    isDefault: Boolean(candidate.isDefault),
    price: candidate.price != null ? Number(candidate.price) : null,
    comparePrice: candidate.comparePrice != null ? Number(candidate.comparePrice) : null,
    attributes: Array.isArray(candidate.attributes) ? candidate.attributes : [],
    media: sanitizeMedia(candidate.media),
    sizes,
  };
}

function normalizeProductDoc(doc) {
  if (!doc) return null;

  const general = doc.generalInformation || {};
  const status = doc.status || "draft";
  const variantColors = Array.isArray(doc.variants) && doc.variants[0]?.colors ? doc.variants[0].colors : [];

  return {
    id: doc.id || doc._id?.toString(),
    slug: doc.slug || slugify(general.name || "product"),
    name: general.name || doc.slug || "Untitled product",
    category: doc.categoryName || "Uncategorized",
    categoryId: doc.categoryId || slugify(doc.categoryName || "uncategorized"),
    featured: Boolean(doc.featured),
    status,
    price: Number(doc.price) || null,
    comparePrice: Number(doc.comparePrice) || null,
    generalInformation: {
      name: general.name || doc.slug || "Untitled product",
      shortName: general.shortName || general.name || doc.slug || "Untitled product",
      description: general.description || "",
      brandStatement: general.brandStatement || doc.story?.lead || "",
    },
    story: {
      lead: doc.story?.lead || general.brandStatement || "",
      body: doc.story?.body || general.description || "",
    },
    colors: variantColors.map((color) => ({
      id: color.id,
      name: color.color?.name || "Default",
      slug: color.color?.slug || slugify(color.color?.name || "default"),
      hex: color.color?.hex || "#0A0A0A",
      swatch: color.color?.swatch || null,
      status: color.status || "active",
      isDefault: Boolean(color.isDefault),
      price: color.price != null ? Number(color.price) : null,
      comparePrice: color.comparePrice != null ? Number(color.comparePrice) : null,
      media: color.media || {},
      sizes: Array.isArray(color.sizes) ? color.sizes : [],
      // Expose inventory map so the variants-panel editor is pre-populated on load.
      inventory: sizesToInventory(color.sizes),
    })),
    variants: Array.isArray(doc.variants) ? doc.variants : [],
    pricing: {
      basePrice: Number(doc.price) || null,
      comparePrice: Number(doc.comparePrice) || null,
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function GET(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("id");

    if (productId) {
      const doc = await ProductModel.findOne({ id: productId }).lean().exec();
      return NextResponse.json(normalizeProductDoc(doc));
    }

    // Pagination with limits to prevent unbounded result sets
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const [docs, total] = await Promise.all([
      ProductModel.find({})
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      ProductModel.countDocuments({}),
    ]);

    return NextResponse.json({
      products: docs.map(normalizeProductDoc).filter(Boolean),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[admin/products] GET failed:", error);
    return NextResponse.json({ products: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } }, { status: 200 });
  }
}

export async function POST(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const body = await request.json();
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const slug = slugify(body.slug || name);
    const categoryName = String(body.category || "Uncategorized").trim() || "Uncategorized";
    const categoryId = slugify(body.categoryId || slugify(categoryName)) || slugify(categoryName);
    const status = ["draft", "active", "archived"].includes(body.status) ? body.status : "draft";
    const variantColors = Array.isArray(body.colors) && body.colors.length > 0
      ? body.colors.map((color) => normalizeColorEntry(color, slug))
      : [{
          id: `color-${slug}`,
          color: {
            name: "Default",
            slug: `default-${slug}`,
            hex: "#0A0A0A",
            swatch: null,
          },
          status: "active",
          isDefault: true,
          price: Number(body.price) || null,
          comparePrice: Number(body.comparePrice) || null,
          attributes: [],
          media: {},
          sizes: [],
        }];

    const doc = {
      id: body.id || `product-${Date.now()}-${slug}`,
      categoryId,
      categoryName,
      slug,
      status,
      featured: Boolean(body.featured),
      price: Number(body.price) || null,
      comparePrice: Number(body.comparePrice) || null,
      generalInformation: {
        name,
        shortName: String(body.shortName || name).trim(),
        description: String(body.generalInformation?.description || body.description || "").trim(),
        brandStatement: String(body.generalInformation?.brandStatement || body.story?.lead || body.story || "").trim(),
      },
      story: {
        lead: String(body.generalInformation?.brandStatement || body.story?.lead || body.story || "").trim(),
        body: String(body.generalInformation?.description || body.description || "").trim(),
      },
      variants: [{
        id: `variant-${slug}`,
        type: "standard",
        name: "Standard",
        slug: `standard-${slug}`,
        status,
        isDefault: true,
        attributes: [],
        colors: variantColors,
      }],
    };

    const created = await ProductModel.findOneAndUpdate(
      { id: doc.id },
      { $set: doc },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    ).lean().exec();

    return NextResponse.json(normalizeProductDoc(created || doc));
  } catch (error) {
    console.error("[admin/products] POST failed:", error);
    return NextResponse.json({ error: "Unable to create product" }, { status: 500 });
  }
}

export async function PUT(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const body = await request.json();
    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "Product id is required" }, { status: 400 });
    }

    const name = String(body.name || "").trim();
    const slug = slugify(body.slug || name || "product");
    const categoryName = String(body.category || "Uncategorized").trim() || "Uncategorized";
    const categoryId = slugify(body.categoryId || slugify(categoryName)) || slugify(categoryName);
    const status = ["draft", "active", "archived"].includes(body.status) ? body.status : "draft";
    const variantColors = Array.isArray(body.colors) && body.colors.length > 0
      ? body.colors.map((color) => normalizeColorEntry(color, slug))
      : [{
          id: `color-${slug}`,
          color: {
            name: "Default",
            slug: `default-${slug}`,
            hex: "#0A0A0A",
            swatch: null,
          },
          status: "active",
          isDefault: true,
          price: Number(body.price) || null,
          comparePrice: Number(body.comparePrice) || null,
          attributes: [],
          media: {},
          sizes: [],
        }];

    const update = {
      categoryId,
      categoryName,
      slug,
      status,
      featured: Boolean(body.featured),
      price: Number(body.price) || null,
      comparePrice: Number(body.comparePrice) || null,
      generalInformation: {
        name,
        shortName: String(body.shortName || name || slug).trim(),
        description: String(body.generalInformation?.description || body.description || "").trim(),
        brandStatement: String(body.generalInformation?.brandStatement || body.story?.lead || body.story || "").trim(),
      },
      story: {
        lead: String(body.generalInformation?.brandStatement || body.story?.lead || body.story || "").trim(),
        body: String(body.generalInformation?.description || body.description || "").trim(),
      },
      variants: [{
        id: `variant-${slug}`,
        type: "standard",
        name: "Standard",
        slug: `standard-${slug}`,
        status,
        isDefault: true,
        attributes: [],
        colors: variantColors,
      }],
    };

    const doc = await ProductModel.findOneAndUpdate(
      { id },
      { $set: update },
      { returnDocument: "after", upsert: true }
    ).lean().exec();

    return NextResponse.json(normalizeProductDoc(doc || { id, ...update }));
  } catch (error) {
    console.error("[admin/products] PUT failed:", error);
    return NextResponse.json({ error: "Unable to update product" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });
  try {
    await bootstrapDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });
    }

    await ProductModel.deleteOne({ id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/products] DELETE failed:", error);
    return NextResponse.json({ error: "Unable to delete product" }, { status: 500 });
  }
}
