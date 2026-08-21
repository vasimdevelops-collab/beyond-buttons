#!/usr/bin/env node
/**
 * Clean Database Script - Simple version
 * Removes all orders, carts, customers, contacts, coupons
 * Keeps: categories, products, hero slides, theme, navigation, settings, admin credentials, media
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "beyondbuttons";

// Define minimal schemas for the collections we want to clean
const OrderSchema = new mongoose.Schema({}, { strict: false });
const CartSchema = new mongoose.Schema({}, { strict: false });
const CustomerSchema = new mongoose.Schema({}, { strict: false });
const CouponSchema = new mongoose.Schema({}, { strict: false });
const ContactSchema = new mongoose.Schema({}, { strict: false });

const OrderModel = mongoose.models.Order || mongoose.model("Order", OrderSchema);
const CartModel = mongoose.models.Cart || mongoose.model("Cart", CartSchema);
const CustomerModel = mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
const CouponModel = mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
const ContactModel = mongoose.models.Contact || mongoose.model("Contact", ContactSchema);

async function main() {
  console.log("🔌 Connecting to database...");
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
  console.log("✅ Connected!");

  const collectionsToClean = [
    { name: "orders", model: OrderModel },
    { name: "carts", model: CartModel },
    { name: "customers", model: CustomerModel },
    { name: "coupons", model: CouponModel },
    { name: "contacts", model: ContactModel },
  ];

  console.log("\n📊 Current document counts:");
  for (const { name, model } of collectionsToClean) {
    const count = await model.countDocuments();
    console.log(`  ${name}: ${count} documents`);
  }

  console.log("\n⚠️  This will permanently delete all orders, carts, customers, coupons, and contacts!");
  console.log("Press Ctrl+C within 5 seconds to cancel...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log("\n🧹 Cleaning collections...");
  for (const { name, model } of collectionsToClean) {
    const result = await model.deleteMany({});
    console.log(`  ✓ ${name}: deleted ${result.deletedCount} documents`);
  }

  console.log("\n✅ Database cleaned successfully!");
  console.log("Dashboard will now show empty states for Orders, Analytics, Customers, Coupons, and Contacts.");
  
  console.log("\n📊 Final state:");
  for (const { name, model } of collectionsToClean) {
    const count = await model.countDocuments();
    console.log(`  ${name}: ${count} documents`);
  }

  await mongoose.disconnect();
  console.log("\n👋 Disconnected from database.");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});