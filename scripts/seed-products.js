import mongoose from "mongoose";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env manually
import dotenv from "dotenv";
dotenv.config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "beyondbuttons";

function slugify(value = "") {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";
}

// Load JSON data
const productsData = JSON.parse(readFileSync(resolve("data/products/products.json"), "utf-8"));
const categoriesData = JSON.parse(readFileSync(resolve("data/categories/categories.json"), "utf-8"));

// Define schemas inline (simplified versions matching the models)
const MediaRefSchema = new mongoose.Schema({
  id: { type: String, required: true },
  src: { type: String, required: true },
  alt: { type: String, default: "" },
  type: { type: String, enum: ["image", "video", "svg"], default: "image" },
}, { _id: false });

const SizeStockSchema = new mongoose.Schema({
  size: { type: String, required: true },
  sku: { type: String, required: true },
  stock: { type: Number, required: true, default: 0, min: 0 },
  availability: { type: String, required: true, enum: ["in_stock", "low_stock", "out_of_stock"], default: "out_of_stock" },
  allowBackorder: { type: Boolean, default: false },
}, { _id: false });

const ColorVariantSchema = new mongoose.Schema({
  id: { type: String, required: true },
  color: {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    hex: String,
    swatch: MediaRefSchema,
  },
  status: { type: String, enum: ["draft", "active", "archived"], default: "draft", required: true },
  isDefault: { type: Boolean, default: false, required: true },
  price: { type: Number, default: null, min: 0 },
  comparePrice: { type: Number, default: null, min: 0 },
  attributes: { type: [mongoose.Schema.Types.Mixed], default: [] },
  media: { type: mongoose.Schema.Types.Mixed, default: {} },
  sizes: { type: [SizeStockSchema], default: [] },
}, { timestamps: true, _id: false });

const FitEditionVariantSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ["standard", "fit", "edition", "other"], default: "standard", required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  status: { type: String, enum: ["draft", "active", "archived"], default: "draft", required: true },
  isDefault: { type: Boolean, default: false, required: true },
  attributes: { type: [mongoose.Schema.Types.Mixed], default: [] },
  colors: { type: [ColorVariantSchema], default: [] },
}, { timestamps: true, _id: false });

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  categoryId: { type: String, required: true, index: true },
  categoryName: { type: String, default: "" },
  slug: { type: String, required: true, unique: true },
  status: { type: String, enum: ["draft", "active", "archived"], default: "draft", required: true },
  featured: { type: Boolean, default: false },
  price: { type: Number, default: null },
  comparePrice: { type: Number, default: null },
  generalInformation: {
    name: { type: String, required: true },
    shortName: String,
    description: String,
    brandStatement: String,
  },
  story: {
    lead: String,
    body: String,
    sections: { type: [mongoose.Schema.Types.Mixed], default: undefined },
  },
  fabric: {
    material: String,
    gsm: String,
    finish: String,
    origin: String,
    attributes: { type: [mongoose.Schema.Types.Mixed], default: undefined },
  },
  care: { type: [mongoose.Schema.Types.Mixed], default: [] },
  attributes: { type: [mongoose.Schema.Types.Mixed], default: [] },
  seo: { type: mongoose.Schema.Types.Mixed },
  shipping: { profileId: String, overrides: mongoose.Schema.Types.Mixed },
  returnPolicy: { policyId: String, overrides: mongoose.Schema.Types.Mixed },
  variants: { type: [FitEditionVariantSchema], default: [] },
}, { timestamps: true, versionKey: false });

const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  banner: MediaRefSchema,
  description: String,
  visibility: { type: Boolean, required: true, default: true },
  order: { type: Number, required: true, default: 0 },
  attributeDefinitionIds: { type: [String], default: [] },
  seo: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true, versionKey: false });

const ProductModel = mongoose.models.Product || mongoose.model("Product", ProductSchema);
const CategoryModel = mongoose.models.Category || mongoose.model("Category", CategorySchema);

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
  console.log("Connected!");

  // Seed categories
  console.log("Seeding categories...");
  for (const cat of categoriesData.categories || []) {
    await CategoryModel.findOneAndUpdate(
      { id: cat.id || slugify(cat.name) },
      { 
        $set: { 
          id: cat.id || slugify(cat.name), 
          name: cat.name, 
          slug: cat.slug || slugify(cat.name), 
          visibility: cat.published !== false, 
          order: cat.order || 0,
          description: cat.description || "",
          banner: cat.banner || null,
        } 
      },
      { upsert: true }
    );
  }
  console.log("Categories seeded");

  // Seed products
  console.log("Seeding products...");
  for (const product of productsData) {
    const categorySlug = slugify(product.category);
    const variantColors = (product.colors || []).map((color, idx) => {
      const sizes = (color.sizes || []).map((s) => ({
        size: s.size,
        sku: s.sku,
        stock: s.stock,
        availability: s.stock > 0 ? "in_stock" : "out_of_stock",
        allowBackorder: false,
      }));
      return {
        id: `color-${product.id}-${color.name}`.replace(/\s+/g, "-"),
        color: { name: color.name, slug: slugify(color.name), hex: color.hex, swatch: null },
        status: "active",
        isDefault: idx === 0,
        price: null,
        comparePrice: null,
        attributes: [],
        media: {},
        sizes,
      };
    });

    const doc = {
      id: product.id,
      categoryId: categorySlug,
      categoryName: product.category,
      slug: product.slug,
      status: "active",
      featured: true,
      price: product.price,
      comparePrice: product.comparePrice,
      generalInformation: { 
        name: product.name, 
        shortName: product.shortName, 
        description: product.brandStatement, 
        brandStatement: product.brandStatement 
      },
      story: { 
        lead: product.brandStatement, 
        body: product.story?.lead || "" 
      },
      variants: [{
        id: `variant-${product.id}`,
        type: "standard",
        name: "Standard",
        slug: `standard-${product.id}`,
        status: "active",
        isDefault: true,
        attributes: [],
        colors: variantColors,
      }],
    };

    await ProductModel.findOneAndUpdate(
      { id: product.id },
      { $set: doc },
      { upsert: true }
    );
    console.log(`Product seeded: ${product.name}`);
  }
  console.log("Done!");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });