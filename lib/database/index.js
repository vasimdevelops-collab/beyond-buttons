/**
 * Database adapter layer — memory + MongoDB.
 * Repository / service contracts stay unchanged.
 */

import { createMongooseAdapter } from "@/lib/database/mongooseAdapter";

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

/**
 * @param {Object} doc
 * @param {Object.<string, any>} [filter]
 */
function matchesFilter(doc, filter = {}) {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = doc?.[key];
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      if ("$in" in expected) return expected.$in.includes(actual);
      if ("$eq" in expected) return actual === expected.$eq;
      if ("$ne" in expected) return actual !== expected.$ne;
    }
    return actual === expected;
  });
}

/**
 * @param {Object[]} rows
 * @param {import('@/lib/types').ListQuery} [query]
 */
function applyQuery(rows, query = {}) {
  let next = rows.filter((row) => matchesFilter(row, query.filter || {}));

  if (query.sortBy) {
    const dir = query.sortDir === "desc" ? -1 : 1;
    const key = query.sortBy;
    next = [...next].sort((a, b) => {
      if (a[key] === b[key]) return 0;
      if (a[key] == null) return 1;
      if (b[key] == null) return -1;
      return a[key] > b[key] ? dir : -dir;
    });
  }

  const total = next.length;
  const offset = Number(query.offset) || 0;
  const limit = query.limit == null ? next.length : Number(query.limit);
  const items = next.slice(offset, offset + limit);

  return { items, total, limit: query.limit ?? items.length, offset };
}

function createId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * In-memory collection — retained for local/dev without Mongo.
 * @param {Map<string, Object>} store
 * @param {string} name
 * @returns {import('@/lib/types').CollectionPort}
 */
function createMemoryCollection(store, name) {
  return {
    async findMany(query = {}) {
      return applyQuery([...store.values()], query);
    },

    async findById(id) {
      return store.get(String(id)) || null;
    },

    async findOne(filter = {}) {
      return [...store.values()].find((row) => matchesFilter(row, filter)) || null;
    },

    async insert(data) {
      if (!isObject(data)) {
        throw new Error(`[${name}] insert expects an object`);
      }
      const now = new Date().toISOString();
      const id = String(data.id || createId(name));
      const doc = {
        ...data,
        id,
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now,
      };
      store.set(id, doc);
      return { ...doc };
    },

    async update(id, patch) {
      const current = store.get(String(id));
      if (!current) return null;
      if (!isObject(patch)) {
        throw new Error(`[${name}] update expects an object`);
      }
      const doc = {
        ...current,
        ...patch,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      };
      store.set(String(id), doc);
      return { ...doc };
    },

    async remove(id) {
      return store.delete(String(id));
    },
  };
}

/**
 * @param {Object.<string, Object[]>} [seed]
 * @returns {import('@/lib/types').DatabaseAdapter}
 */
export function createMemoryAdapter(seed = {}) {
  /** @type {Map<string, Map<string, Object>>} */
  const collections = new Map();

  const ensure = (name) => {
    if (!collections.has(name)) {
      const map = new Map();
      const rows = Array.isArray(seed[name]) ? seed[name] : [];
      rows.forEach((row) => {
        if (row?.id) map.set(String(row.id), { ...row });
      });
      collections.set(name, map);
    }
    return collections.get(name);
  };

  return {
    provider: "memory",
    async connect() {},
    async disconnect() {},
    collection(name) {
      return createMemoryCollection(ensure(name), name);
    },
  };
}

/**
 * @param {Object} [options]
 * @returns {import('@/lib/types').DatabaseAdapter}
 */
function createMongoAdapter(options = {}) {
  return createMongooseAdapter(options);
}

export const adapterRegistry = {
  memory: createMemoryAdapter,
  mongodb: createMongoAdapter,
  prisma: () => {
    throw new Error("Prisma adapter not implemented yet");
  },
  firebase: () => {
    throw new Error("Firebase adapter not implemented yet");
  },
};

/**
 * @param {'memory'|'mongodb'|'prisma'|'firebase'} [provider]
 * @param {Object} [options]
 * @returns {import('@/lib/types').DatabaseAdapter}
 */
export function createDatabaseAdapter(provider = "memory", options = {}) {
  const resolved =
    provider === "memory" && process.env.DATABASE_PROVIDER === "mongodb"
      ? "mongodb"
      : provider;

  const factory = adapterRegistry[resolved];
  if (!factory) {
    throw new Error(`Unknown database provider: ${resolved}`);
  }

  if (resolved === "mongodb") {
    return factory(options);
  }

  return factory(options.seed || options);
}

export const COLLECTIONS = Object.freeze({
  products: "products",
  categories: "categories",
  orders: "orders",
  customers: "customers",
  coupons: "coupons",
  homepage: "homepage",
  navigation: "navigation",
  theme: "theme",
  settings: "settings",
  media: "media",
  attributeDefinitions: "attributeDefinitions",
  shippingProfiles: "shippingProfiles",
  returnPolicies: "returnPolicies",
  carts: "carts",
});

export { createId };
export {
  connectMongo,
  disconnectMongo,
  isMongoConnected,
  getMongoReadyState,
} from "@/lib/database/connection";
export { createMongooseAdapter } from "@/lib/database/mongooseAdapter";
export {
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
} from "@/lib/database/models";
export { bootstrapDatabase } from "@/lib/database/register";