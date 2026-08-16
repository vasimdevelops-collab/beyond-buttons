/**
 * Model registration entry — Final Database Freeze.
 * Connects Mongo and ensures all locked models are registered.
 */

import {
  connectMongo,
  disconnectMongo,
  getMongoReadyState,
  isMongoConnected,
} from "@/lib/database/connection";
import {
  AttributeDefinitionModel,
  AdminCredentialModel,
  CategoryModel,
  CartModel,
  CouponModel,
  CustomerModel,
  HomepageModel,
  MediaModel,
  MODEL_BY_COLLECTION,
  NavigationModel,
  OrderModel,
  ProductModel,
  registerModels,
  ReturnPolicyModel,
  SettingsModel,
  ShippingProfileModel,
  ThemeModel,
} from "@/lib/database/models";

/**
 * Ensure connection + model registration.
 * @returns {Promise<{ readyState: string, models: ReturnType<typeof registerModels> }>}
 */
export async function bootstrapDatabase() {
  await connectMongo();
  const registered = registerModels();
  return {
    readyState: getMongoReadyState(),
    models: registered,
  };
}

export {
  connectMongo,
  disconnectMongo,
  getMongoReadyState,
  isMongoConnected,
  registerModels,
  MODEL_BY_COLLECTION,
  CategoryModel,
  ProductModel,
  AttributeDefinitionModel,
  ShippingProfileModel,
  ReturnPolicyModel,
  HomepageModel,
  ThemeModel,
  NavigationModel,
  OrderModel,
  CartModel,
  CustomerModel,
  CouponModel,
  MediaModel,
  SettingsModel,
  AdminCredentialModel,
};
