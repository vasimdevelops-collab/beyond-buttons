/**
 * Mongoose models — FINAL DATABASE FREEZE (locked).
 * Media refs store Media IDs from the shared asset library.
 * No repositories / services / APIs in this phase.
 */

import mongoose from "mongoose";

const { Schema, models, model } = mongoose;

function getModel(name, schema) {
  return models[name] || model(name, schema);
}

/* ── Shared subdocuments ── */

/** Reference into the Media collection (shared asset library). */
export const MediaRefSchema = new Schema(
  {
    id: { type: String, required: true },
    src: { type: String, required: true },
    alt: { type: String, default: "" },
    type: {
      type: String,
      enum: ["image", "video", "svg"],
      default: "image",
    },
  },
  { _id: false }
);

export const SeoBlockSchema = new Schema(
  {
    title: String,
    description: String,
    canonical: String,
    image: MediaRefSchema,
    noIndex: { type: Boolean, default: false },
    structuredData: Schema.Types.Mixed,
  },
  { _id: false }
);

export const ContentBlockSchema = new Schema(
  {
    id: String,
    type: { type: String, default: "text" },
    title: String,
    body: String,
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

export const AttributeValueSchema = new Schema(
  {
    attributeId: { type: String, required: true },
    key: { type: String, required: true },
    value: Schema.Types.Mixed,
  },
  { _id: false }
);

export const AddressSchema = new Schema(
  {
    fullName: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false }
);

export const SizeStockSchema = new Schema(
  {
    size: {
      type: String,
      required: true,
    },
    sku: { type: String, required: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    availability: {
      type: String,
      required: true,
      enum: ["in_stock", "low_stock", "out_of_stock"],
      default: "out_of_stock",
    },
    allowBackorder: { type: Boolean, default: false },
  },
  { _id: false }
);

export const VariantMediaSchema = new Schema(
  {
    front: MediaRefSchema,
    back: MediaRefSchema,
    modelFront: MediaRefSchema,
    modelBack: MediaRefSchema,
    additional: { type: [MediaRefSchema], default: [] },
    video: MediaRefSchema,
    spin360: {
      type: new Schema(
        {
          frames: { type: [MediaRefSchema], default: undefined },
          src: String,
        },
        { _id: false }
      ),
      default: undefined,
    },
  },
  { _id: false }
);

export const ColorVariantSchema = new Schema(
  {
    id: { type: String, required: true },
    color: {
      name: { type: String, required: true },
      slug: { type: String, required: true },
      hex: String,
      swatch: MediaRefSchema,
    },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
      required: true,
    },
    isDefault: { type: Boolean, default: false, required: true },
    price: { type: Number, default: null, min: 0 },
    comparePrice: { type: Number, default: null, min: 0 },
    attributes: { type: [AttributeValueSchema], default: [] },
    media: { type: VariantMediaSchema, default: () => ({}) },
    sizes: { type: [SizeStockSchema], default: [] },
  },
  { timestamps: true, _id: false }
);

export const FitEditionVariantSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["standard", "fit", "edition", "other"],
      default: "standard",
      required: true,
    },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
      required: true,
    },
    isDefault: { type: Boolean, default: false, required: true },
    attributes: { type: [AttributeValueSchema], default: [] },
    colors: { type: [ColorVariantSchema], default: [] },
  },
  { timestamps: true, _id: false }
);

export const OrderItemSnapshotSchema = new Schema(
  {
    category: {
      id: String,
      name: String,
      slug: String,
    },
    product: {
      id: String,
      name: String,
      slug: String,
    },
    // Product variants were historically stored as a string in some running
    // dev instances. Keep the snapshot permissive so existing order data and
    // the current structured variant snapshot can both be saved safely.
    variant: { type: Schema.Types.Mixed, default: {} },
    color: {
      id: String,
      name: String,
      slug: String,
      hex: String,
    },
    size: { type: String, required: true },
    sku: { type: String, required: true },
    image: MediaRefSchema,
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

/* ── Collections ── */

const CategorySchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    banner: MediaRefSchema,
    description: String,
    visibility: { type: Boolean, required: true, default: true },
    order: { type: Number, required: true, default: 0 },
    attributeDefinitionIds: { type: [String], default: [] },
    seo: SeoBlockSchema,
  },
  { timestamps: true, versionKey: false }
);

CategorySchema.index({ visibility: 1, order: 1 });

const ProductSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    categoryId: { type: String, required: true, index: true },
    categoryName: { type: String, default: "" },
    slug: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
      required: true,
    },
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
      sections: { type: [ContentBlockSchema], default: undefined },
    },
    fabric: {
      material: String,
      gsm: String,
      finish: String,
      origin: String,
      attributes: { type: [AttributeValueSchema], default: undefined },
    },
    care: { type: [ContentBlockSchema], default: [] },
    attributes: { type: [AttributeValueSchema], default: [] },
    seo: SeoBlockSchema,
    shipping: {
      profileId: String,
      overrides: Schema.Types.Mixed,
    },
    returnPolicy: {
      policyId: String,
      overrides: Schema.Types.Mixed,
    },
    variants: { type: [FitEditionVariantSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

ProductSchema.index({ categoryId: 1, status: 1 });
ProductSchema.index({ status: 1, updatedAt: -1 });
ProductSchema.index(
  { "variants.colors.sizes.sku": 1 },
  {
    unique: true,
    name: "unique_sellable_sku",
    partialFilterExpression: {
      "variants.colors.sizes.sku": { $type: "string", $gt: "" },
    },
  }
);
ProductSchema.index({ "variants.slug": 1 });
ProductSchema.index({ "variants.colors.color.slug": 1 });

const AttributeDefinitionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "number", "boolean", "select", "multi_select"],
      required: true,
    },
    scope: {
      type: String,
      enum: ["product", "variant", "color"],
      required: true,
    },
    options: { type: [String], default: [] },
    unit: String,
    required: { type: Boolean, default: false },
    filterable: { type: Boolean, default: false },
    visible: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  { timestamps: true, versionKey: false }
);

AttributeDefinitionSchema.index({ scope: 1, status: 1 });

const ShippingProfileSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
    },
    methods: { type: [Schema.Types.Mixed], default: [] },
    zones: { type: [Schema.Types.Mixed], default: [] },
    handlingTime: Schema.Types.Mixed,
    freeShippingRules: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true, versionKey: false }
);

ShippingProfileSchema.index({ status: 1 });

const ReturnPolicySchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
    },
    returnDays: Number,
    body: String,
    rules: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true, versionKey: false }
);

ReturnPolicySchema.index({ status: 1 });

const HomepageSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    hero: { type: Schema.Types.Mixed, required: true },
    collections: { type: [Schema.Types.Mixed], default: [] },
    featuredProductIds: { type: [String], default: [] },
    whyBeyond: Schema.Types.Mixed,
    footer: Schema.Types.Mixed,
    announcement: Schema.Types.Mixed,
    headings: Schema.Types.Mixed,
    seo: SeoBlockSchema,
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

HomepageSchema.index({ status: 1, updatedAt: -1 });

/** Admin-managed homepage hero slide — image + optional overlay copy + CTA. */
const HeroSlideSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    order: { type: Number, default: 0, index: true },
    active: { type: Boolean, default: true, index: true },
    media: MediaRefSchema,
    headline: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    ctaLabel: { type: String, default: "" },
    ctaHref: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

HeroSlideSchema.index({ active: 1, order: 1 });

const ThemeSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    dark: { type: Schema.Types.Mixed, required: true },
    light: { type: Schema.Types.Mixed, required: true },
    typography: Schema.Types.Mixed,
    buttons: Schema.Types.Mixed,
    spacing: Schema.Types.Mixed,
    animation: Schema.Types.Mixed,
    logo: Schema.Types.Mixed,
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

ThemeSchema.index({ status: 1, updatedAt: -1 });

const NavigationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    desktopMenu: { type: Schema.Types.Mixed, required: true },
    mobileMenu: Schema.Types.Mixed,
    footerMenu: { type: [Schema.Types.Mixed], default: [] },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

NavigationSchema.index({ status: 1, updatedAt: -1 });

const OrderSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: String, index: true },
    items: {
      type: [OrderItemSnapshotSchema],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "Order must include at least one item",
      },
    },
    shippingAddress: { type: AddressSchema, required: true },
    billingAddress: AddressSchema,
    subtotal: { type: Number, default: 0 },
    discounts: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, required: true },
    couponCode: { type: String, index: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet", "cod", "online", "emandate", "bank_transfer"],
      default: "cod",
      index: true,
    },
    paymentGatewayMethod: { type: String, default: "" },
    shippingStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      required: true,
      index: true,
    },
    tracking: { type: String, default: "" },
    courier: { type: String, default: "" },
    notes: String,
    statusHistory: { type: [Schema.Types.Mixed], default: [] },
    stockDecremented: { type: Boolean, default: false },
    stockRestored: { type: Boolean, default: false },
    shiprocketOrderId: { type: String, default: "", index: true },
    shiprocketShipmentId: { type: String, default: "", index: true },
    awbCode: { type: String, default: "", index: true },
    courierName: { type: String, default: "" },
    shiprocketStatus: { type: String, default: "" },
    labelUrl: { type: String, default: "" },
    manifestUrl: { type: String, default: "" },
    pickupScheduledAt: { type: Date },
    pickupToken: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

OrderSchema.index({ customerId: 1, createdAt: -1 });

const CartItemSchema = new Schema(
  {
    lineKey: { type: String, required: true },
    productId: { type: String, required: true },
    slug: String,
    color: { type: String, default: "" },
    size: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const CartSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    customerId: { type: String },
    guestId: { type: String },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

CartSchema.index({ customerId: 1 }, { unique: true, partialFilterExpression: { customerId: { $type: "string" } } });
CartSchema.index({ guestId: 1 }, { unique: true, partialFilterExpression: { guestId: { $type: "string" } } });

const CustomerSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, index: true },
    fullName: String,
    addresses: { type: [AddressSchema], default: [] },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

const CouponSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["percent", "fixed"],
      required: true,
    },
    value: { type: Number, required: true, min: 0 },
    active: { type: Boolean, required: true, default: true, index: true },
    startsAt: { type: Date, index: true },
    endsAt: { type: Date, index: true },
    minSubtotal: Number,
    usageLimit: Number,
    usedCount: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

const MediaSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    src: { type: String, required: true, index: true },
    alt: { type: String, default: "" },
    filename: String,
    mimeType: String,
    width: Number,
    height: Number,
    size: Number,
    type: {
      type: String,
      enum: ["image", "video", "svg"],
      default: "image",
      required: true,
      index: true,
    },
    cloudinaryId: String,
    cloudinaryVersion: Number,
    folderId: { type: String, default: "uncategorized", index: true },
    folderLabel: { type: String, default: "Uncategorized" },
  },
  { timestamps: true, versionKey: false }
);

MediaSchema.index({ createdAt: -1 });

const SettingsSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    brandName: { type: String, required: true },
    currency: { type: String, required: true },
    locale: { type: String, required: true },
    email: String,
    phone: String,
    social: Schema.Types.Mixed,
    meta: Schema.Types.Mixed,
  },
  { timestamps: true, versionKey: false }
);

const ContactSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: String,
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["unread", "read", "replied", "archived"],
      default: "unread",
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

/**
 * Single admin credential for Studio access.
 * Seeded once from ADMIN_EMAIL / ADMIN_PASSWORD (.env) and updated via the
 * Studio → Admin module. No role system — this one account is the ONLY way in.
 */
const AdminCredentialSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

/* ── Model registration ── */

export const CategoryModel = getModel("Category", CategorySchema);
export const ProductModel = getModel("Product", ProductSchema);
export const AttributeDefinitionModel = getModel(
  "AttributeDefinition",
  AttributeDefinitionSchema
);
export const ShippingProfileModel = getModel(
  "ShippingProfile",
  ShippingProfileSchema
);
export const ReturnPolicyModel = getModel("ReturnPolicy", ReturnPolicySchema);
export const HomepageModel = getModel("Homepage", HomepageSchema);
export const HeroSlideModel = getModel("HeroSlide", HeroSlideSchema);
export const ThemeModel = getModel("Theme", ThemeSchema);
export const NavigationModel = getModel("Navigation", NavigationSchema);
export const OrderModel = getModel("Order", OrderSchema);
export const CartModel = getModel("Cart", CartSchema);
export const CustomerModel = getModel("Customer", CustomerSchema);
export const CouponModel = getModel("Coupon", CouponSchema);
export const MediaModel = getModel("Media", MediaSchema);
export const SettingsModel = getModel("Settings", SettingsSchema);
export const ContactModel = getModel("Contact", ContactSchema);
export const AdminCredentialModel = getModel(
  "AdminCredential",
  AdminCredentialSchema
);

/** @type {Record<string, import('mongoose').Model>} */
export const MODEL_BY_COLLECTION = Object.freeze({
  categories: CategoryModel,
  products: ProductModel,
  attributeDefinitions: AttributeDefinitionModel,
  shippingProfiles: ShippingProfileModel,
  returnPolicies: ReturnPolicyModel,
  homepage: HomepageModel,
  heroSlides: HeroSlideModel,
  theme: ThemeModel,
  navigation: NavigationModel,
  orders: OrderModel,
  carts: CartModel,
  customers: CustomerModel,
  coupons: CouponModel,
  media: MediaModel,
  settings: SettingsModel,
  contacts: ContactModel,
  adminCredentials: AdminCredentialModel,
});

/**
 * Register / return all freeze models.
 * Safe to call multiple times (mongoose model cache).
 */
export function registerModels() {
  return {
    Category: CategoryModel,
    Product: ProductModel,
    AttributeDefinition: AttributeDefinitionModel,
    ShippingProfile: ShippingProfileModel,
    ReturnPolicy: ReturnPolicyModel,
    Homepage: HomepageModel,
    HeroSlide: HeroSlideModel,
    Theme: ThemeModel,
    Navigation: NavigationModel,
    Order: OrderModel,
    Cart: CartModel,
    Customer: CustomerModel,
    Coupon: CouponModel,
    Media: MediaModel,
    Settings: SettingsModel,
    Contact: ContactModel,
    AdminCredential: AdminCredentialModel,
    byCollection: MODEL_BY_COLLECTION,
  };
}
