/**
 * Central data layer loaders.
 * Keeps the existing JSON-driven storefront working by default, while also
 * supporting database-backed catalog reads when MongoDB is configured.
 */

import productsData from "@/data/products/products.json";
import categoriesData from "@/data/categories/categories.json";
import homepageData from "@/data/homepage/homepage.json";
import themeData from "@/data/theme/theme.json";
import navigationData from "@/data/navigation/navigation.json";
import settingsData from "@/data/settings/settings.json";

const PRODUCT_RECORDS = Array.isArray(productsData)
  ? productsData
  : productsData.products || [];

const FALLBACK_CATEGORIES = Array.isArray(categoriesData?.categories)
  ? categoriesData.categories.filter((category) => category.published !== false)
  : [];

function toSlug(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeProduct(product) {
  const categorySlug = toSlug(product.category);
  const sizeOptions = product.sizes || [];

  return {
    ...product,
    categoryId: categorySlug,
    categorySlug,
    discount: product.comparePrice,
    published: true,
    featured: true,
    sizes: sizeOptions.map((entry) =>
      typeof entry === "string" ? entry : entry.size
    ),
    sizeOptions,
    storyText:
      typeof product.story === "string" ? product.story : product.story?.lead || "",
    story: {
      lead:
        product.brandStatement ||
        (typeof product.story === "string" ? product.story : product.story?.lead) ||
        "",
    },
  };
}

function normalizeMongoCategory(doc) {
  if (!doc) return null;

  return {
    id: doc.id,
    slug: doc.slug,
    name: doc.name,
    title: doc.name,
    description: doc.description || "",
    ctaLabel: "Explore Collection",
    href: `/category/${doc.slug}`,
    media: doc.banner
      ? { type: doc.banner.type || "image", src: doc.banner.src || null, alt: doc.banner.alt || "" }
      : { type: null, src: null, alt: "" },
    published: doc.visibility !== false,
    seo: doc.seo || {},
    order: Number(doc.order) || 0,
    visibility: doc.visibility,
  };
}

function normalizeMongoProduct(doc) {
  if (!doc) return null;

  const general = doc.generalInformation || {};
  const variants = Array.isArray(doc.variants) ? doc.variants : [];
  const firstVariant = variants[0] || {};
  const variantColors = Array.isArray(firstVariant.colors) ? firstVariant.colors : [];
  const directColors = Array.isArray(doc.colors) ? doc.colors : [];
  const colorList = variantColors.length > 0 ? variantColors : directColors;
  const defaultColor = colorList.find((color) => color.isDefault) || colorList[0] || null;

  const flattenedSizes = [];
  colorList.forEach((color) => {
    const inventorySizes = Array.isArray(color.sizes) ? color.sizes : [];
    const inventoryEntries = inventorySizes.length > 0 ? inventorySizes : Array.isArray(color.inventory) ? color.inventory : [];
    const sizeEntries = Array.isArray(color.inventory) ? color.inventory : inventorySizes;

    (Array.isArray(sizeEntries) ? sizeEntries : Object.entries(sizeEntries || {})).forEach((entry) => {
      const sizeEntry = Array.isArray(entry) ? entry[1] : entry;
      const sizeName = Array.isArray(entry) ? entry[0] : sizeEntry?.size || sizeEntry?.label;
      if (!sizeName) return;
      flattenedSizes.push({
        size: String(sizeName),
        stock: Number(sizeEntry?.stock ?? 0) || 0,
        sku: sizeEntry?.sku || sizeEntry?.code || "",
      });
    });

    if (inventorySizes.length === 0 && Array.isArray(color.inventory) === false && typeof color.inventory === "object") {
      Object.entries(color.inventory || {}).forEach(([sizeName, value]) => {
        flattenedSizes.push({
          size: String(sizeName),
          stock: Number(value?.stock ?? 0) || 0,
          sku: value?.sku || "",
        });
      });
    }
  });

  const normalizedSizes = flattenedSizes.length
    ? flattenedSizes
    : (Array.isArray(doc.sizes) ? doc.sizes : []).map((entry) => ({
        size: entry.size || entry.label || "M",
        stock: Number(entry.stock) || 0,
        sku: entry.sku || "",
      }));

  const gallery = [];
  const directGallery = Array.isArray(doc.gallery) ? doc.gallery : [];
  const addGalleryEntry = (entry) => {
    if (!entry || !entry.src) return;
    if (!gallery.some((item) => item?.src === entry.src)) {
      gallery.push({ src: entry.src, alt: entry.alt || general.name || doc.slug, type: entry.type || "image" });
    }
  };

  directGallery.forEach(addGalleryEntry);

  colorList.forEach((color) => {
    const media = color.media || {};
    const entries = [media.front, media.back, media.modelFront, media.modelBack, ...(media.additional || [])];
    entries.filter(Boolean).forEach(addGalleryEntry);
  });

  const uniqueColors = colorList.map((color) => {
    const mappedSizes = (Array.isArray(color.sizes) ? color.sizes : []).map((entry) => ({
      size: entry.size || entry.label || "M",
      stock: Number(entry.stock ?? 0) || 0,
      sku: entry.sku || "",
    }));

    return {
      id: color.id || `${doc.id}-${color.color?.slug || color.name || "default"}`,
      name: color.color?.name || color.name || "Default",
      hex: color.color?.hex || color.hex || "#0A0A0A",
      default: Boolean(color.isDefault || color.default),
      gallery: [
        ...(color.media?.front ? [{ src: color.media.front.src, alt: color.media.front.alt || general.name || doc.slug, type: color.media.front.type || "image" }] : []),
        ...(Array.isArray(color.media?.additional) ? color.media.additional.map((entry) => ({ src: entry.src, alt: entry.alt || general.name || doc.slug, type: entry.type || "image" })) : []),
      ],
      sizes: mappedSizes.length > 0 ? mappedSizes : normalizedSizes,
      price: Number(color.price ?? defaultColor?.price ?? doc.price ?? 0) || null,
      comparePrice: Number(color.comparePrice ?? defaultColor?.comparePrice ?? doc.comparePrice ?? 0) || null,
    };
  });

  const categoryName = doc.categoryName || general.category || doc.category || "Uncategorized";
  const categorySlug = doc.categoryId || toSlug(categoryName);

  return {
    id: doc.id,
    slug: doc.slug,
    name: general.name || doc.slug,
    shortName: general.shortName || general.name || doc.slug,
    category: categoryName,
    categoryId: doc.categoryId || categorySlug,
    categorySlug,
    price: Number(doc.price ?? defaultColor?.price ?? uniqueColors[0]?.price ?? 0) || null,
    comparePrice: Number(doc.comparePrice ?? defaultColor?.comparePrice ?? uniqueColors[0]?.comparePrice ?? 0) || null,
    brandStatement: general.brandStatement || doc.story?.lead || "",
    gallery: gallery.length > 0 ? gallery : directGallery,
    colors: uniqueColors.length > 0 ? uniqueColors : [{ id: `${doc.id}-default`, name: "Default", hex: "#0A0A0A", default: true, gallery: [], price: Number(doc.price) || null, comparePrice: Number(doc.comparePrice) || null }],
    sizes: normalizedSizes,
    sizeOptions: normalizedSizes,
    story: doc.story || { lead: general.description || general.brandStatement || "" },
    storyText: doc.story?.lead || general.description || general.brandStatement || "",
    signatureDetails: [],
    fabric: doc.fabric || { gsm: "", material: "", origin: "", finish: "" },
    care: Array.isArray(doc.care) ? doc.care : [],
    shipping: doc.shipping?.overrides || doc.shipping || {},
    seo: doc.seo || {},
    featured: Boolean(doc.featured),
    published: true,
    status: doc.status,
  };
}

function normalizeMongoSettings(doc) {
  if (!doc) return settingsData;
  return {
    version: 1,
    brandName: doc.brandName || "Beyond Buttons",
    phone: doc.phone || "",
    email: doc.email || "",
    whatsapp: doc.social?.whatsapp || "",
    address: doc.meta?.address || "",
    instagram: doc.social?.instagram || "",
    facebook: doc.social?.facebook || "",
    youtube: doc.social?.youtube || "",
    metaTitle: doc.meta?.metaTitle || "Beyond Buttons",
    metaDescription: doc.meta?.metaDescription || "Luxury Solid Shirt Brand",
    logo: doc.meta?.logo || { full: "/images/logo.png", mark: "/images/B.png" },
    locale: doc.locale || "en-IN",
    currency: doc.currency || "INR",
    defaultTheme: doc.meta?.defaultTheme || "dark",
    ...doc,
  };
}

function normalizeMongoHomepage(doc) {
  if (!doc) return homepageData;

  const hero = doc.hero || homepageData.hero;
  const buttons = hero.buttons || homepageData.hero.buttons;

  return {
    ...homepageData,
    ...doc,
    hero: {
      ...homepageData.hero,
      ...hero,
      media: { ...homepageData.hero.media, ...(hero.media || {}) },
      buttons: {
        ...homepageData.hero.buttons,
        ...(buttons || {}),
        primary: { ...homepageData.hero.buttons.primary, ...(buttons?.primary || {}) },
        secondary: { ...homepageData.hero.buttons.secondary, ...(buttons?.secondary || {}) },
      },
      headlineLines: Array.isArray(hero.headlineLines) ? hero.headlineLines : homepageData.hero.headlineLines,
      subtitleLines: Array.isArray(hero.subtitleLines) ? hero.subtitleLines : homepageData.hero.subtitleLines,
    },
    headings: { ...homepageData.headings, ...(doc.headings || {}) },
    footer: { ...homepageData.footer, ...(doc.footer || {}) },
    socialLinks: { ...homepageData.socialLinks, ...(doc.socialLinks || {}) },
  };
}

async function readMongoCatalog() {
  if (typeof window !== "undefined") return null;

  try {
    const { bootstrapDatabase } = await import("@/lib/database/register");
    const { CategoryModel, HomepageModel, ProductModel, SettingsModel } = await import("@/lib/database/models");

    await bootstrapDatabase();

    const [categoryDocs, homepageDoc, productDocs, settingsDoc] = await Promise.all([
      CategoryModel.find({ visibility: { $ne: false } }).sort({ order: 1 }).lean().exec(),
      HomepageModel.findOne({ id: "default" }).lean().exec(),
      ProductModel.find({ status: { $ne: "archived" } }).sort({ updatedAt: -1 }).lean().exec(),
      SettingsModel.findOne({ id: "default" }).lean().exec(),
    ]);

    return {
      categories: (categoryDocs || []).map(normalizeMongoCategory).filter(Boolean),
      homepage: normalizeMongoHomepage(homepageDoc || homepageData),
      products: (productDocs || []).map(normalizeMongoProduct).filter(Boolean),
      settings: normalizeMongoSettings(settingsDoc),
    };
  } catch {
    return null;
  }
}

export async function getHomepageServer() {
  const mongo = await readMongoCatalog();
  return mongo?.homepage || homepageData;
}


export function getSettings() {
  return settingsData;
}

export async function getSettingsServer() {
  const mongo = await readMongoCatalog();
  return mongo?.settings || settingsData;
}

export function getTheme() {
  return themeData;
}

export function getHomepage() {
  return homepageData;
}

export function getNavigation() {
  return navigationData;
}

export function getCategories() {
  return FALLBACK_CATEGORIES;
}

export async function getCategoriesServer() {
  const mongo = await readMongoCatalog();
  return mongo?.categories?.length ? mongo.categories : FALLBACK_CATEGORIES;
}

export function getCategoryBySlug(slug) {
  return getCategories().find((category) => category.slug === slug) ?? null;
}

export async function getCategoryBySlugServer(slug) {
  const mongo = await readMongoCatalog();
  const source = mongo?.categories?.length ? mongo.categories : FALLBACK_CATEGORIES;
  return source.find((category) => category.slug === slug) ?? null;
}

export function getProducts() {
  return PRODUCT_RECORDS.map(normalizeProduct);
}

export async function getProductsServer() {
  const mongo = await readMongoCatalog();
  return mongo?.products?.length ? mongo.products : PRODUCT_RECORDS.map(normalizeProduct);
}

export function getProductBySlug(slug) {
  return getProducts().find((product) => product.slug === slug) ?? null;
}

export async function getProductBySlugServer(slug) {
  const mongo = await readMongoCatalog();
  const source = mongo?.products?.length ? mongo.products : PRODUCT_RECORDS.map(normalizeProduct);
  return source.find((product) => product.slug === slug) ?? null;
}

export function getFeaturedProducts() {
  const homepage = getHomepage();
  const byId = new Map(getProducts().map((product) => [product.id, product]));
  const featured = (homepage.featuredProductIds || [])
    .map((id) => byId.get(id))
    .filter(Boolean);

  return featured.length > 0 ? featured : getProducts().filter((product) => product.featured);
}

export async function getFeaturedProductsServer() {
  const mongo = await readMongoCatalog();
  const source = mongo?.products?.length ? mongo.products : PRODUCT_RECORDS.map(normalizeProduct);
  const homepage = mongo?.homepage || homepageData;
  const byId = new Map(source.map((product) => [product.id, product]));
  const featured = (homepage.featuredProductIds || [])
    .map((id) => byId.get(id))
    .filter(Boolean);

  return featured.length > 0 ? featured : source.filter((product) => product.featured);
}

/**
 * Homepage product feed — database-backed and fresh on every request so that
 * products added/edited in the admin panel appear on the storefront immediately.
 * Featured products (homepage list + `featured` flag) come first, then the
 * newest products fill the rest, newest first.
 */
export async function getHomeProductsServer() {
  const mongo = await readMongoCatalog();
  const source = mongo?.products?.length
    ? mongo.products
    : PRODUCT_RECORDS.map(normalizeProduct);
  const homepage = mongo?.homepage || homepageData;
  const featuredIds = homepage.featuredProductIds || [];

  const featured = [];
  const rest = [];
  for (const product of source) {
    (featuredIds.includes(product.id) || product.featured ? featured : rest).push(product);
  }

  return [...featured, ...rest];
}

/** Shape expected by the locked Categories UI */
export function getCategoryCards() {
  return getCategories().map((category) => ({
    slug: category.slug,
    title: category.title || category.name,
    ctaLabel: category.ctaLabel || "Explore Collection",
    href: category.href || `/category/${category.slug}`,
    video: category.media?.type === "video" ? category.media.src : null,
    image: category.media?.type === "image" ? category.media.src : null,
  }));
}

/** Shape expected by the locked Products grid / ProductCard */
export function getProductCards(products = getFeaturedProducts()) {
  const categories = new Map(getCategories().map((category) => [category.id, category]));

  return products.map((product) => {
    const category = categories.get(product.categoryId);
    const color = product.colors?.find((entry) => entry.default) || product.colors?.[0];

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      collection: category?.name || product.categorySlug || "",
      price: product.price,
      discount: product.discount,
      sizes: product.sizes || [],
      color: color?.hex || "#0A0A0A",
      colorName: color?.name || "",
      rating: product.rating ?? null,
    };
  });
}

/** Shape expected by ProductDetails / PDP gallery */
export function getProductPageModel(slug) {
  const product = getProductBySlug(slug);
  if (!product) return null;

  const category = getCategoryBySlug(product.categorySlug);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortName: product.shortName,
    category: product.category || category?.name || "",
    categorySlug: product.categorySlug,
    price: product.price,
    comparePrice: product.comparePrice,
    brandStatement: product.brandStatement,
    lead: product.brandStatement || product.storyText,
    gallery: product.gallery || [],
    colors: product.colors || [],
    sizes: product.sizeOptions || [],
    story: product.storyText,
    signatureDetails: product.signatureDetails || [],
    fabric: product.fabric,
    care: product.care || [],
    shipping: product.shipping,
    seo: product.seo,
  };
}

export async function getProductPageModelServer(slug) {
  const product = await getProductBySlugServer(slug);
  if (!product) return null;

  const category = await getCategoryBySlugServer(product.categorySlug);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortName: product.shortName,
    category: product.category || category?.name || "",
    categorySlug: product.categorySlug,
    price: product.price,
    comparePrice: product.comparePrice,
    brandStatement: product.brandStatement,
    lead: product.brandStatement || product.storyText,
    gallery: product.gallery || [],
    colors: product.colors || [],
    sizes: product.sizeOptions || [],
    story: product.storyText,
    signatureDetails: product.signatureDetails || [],
    fabric: product.fabric,
    care: product.care || [],
    shipping: product.shipping,
    seo: product.seo,
  };
}
