/**
 * Repository layer — CRUD for every CMS entity.
 * Depends on DatabaseAdapter only. No UI / API / network I/O.
 */

import { COLLECTIONS, createId } from "@/lib/database";

/**
 * @param {import('@/lib/types').DatabaseAdapter} db
 * @param {string} collectionName
 * @param {{ idPrefix?: string, softUnique?: string[] }} [options]
 */
function createCrudRepository(db, collectionName, options = {}) {
  const col = () => db.collection(collectionName);
  const idPrefix = options.idPrefix || collectionName.replace(/s$/, "");

  return {
    /**
     * @param {import('@/lib/types').ListQuery} [query]
     */
    async list(query = {}) {
      return col().findMany(query);
    },

    /** @param {string} id */
    async getById(id) {
      return col().findById(id);
    },

    /** @param {Object} filter */
    async getOne(filter) {
      return col().findOne(filter);
    },

    /** @param {Object} data */
    async create(data) {
      const payload = {
        ...data,
        id: data.id || createId(idPrefix),
      };
      return col().insert(payload);
    },

    /**
     * @param {string} id
     * @param {Object} patch
     */
    async update(id, patch) {
      return col().update(id, patch);
    },

    /** @param {string} id */
    async remove(id) {
      return col().remove(id);
    },
  };
}

/** @param {import('@/lib/types').DatabaseAdapter} db */
export function createProductRepository(db) {
  const base = createCrudRepository(db, COLLECTIONS.products, { idPrefix: "product" });
  return {
    ...base,
    /** @param {string} slug */
    async getBySlug(slug) {
      return base.getOne({ slug });
    },
    /** @param {import('@/lib/types').ListQuery} [query] */
    async listActive(query = {}) {
      return base.list({
        ...query,
        filter: { ...(query.filter || {}), status: "active" },
      });
    },
  };
}

/** @param {import('@/lib/types').DatabaseAdapter} db */
export function createCategoryRepository(db) {
  const base = createCrudRepository(db, COLLECTIONS.categories, { idPrefix: "category" });
  return {
    ...base,
    /** @param {string} slug */
    async getBySlug(slug) {
      return base.getOne({ slug });
    },
    async listVisible(query = {}) {
      return base.list({
        ...query,
        filter: { ...(query.filter || {}), visibility: true },
        sortBy: query.sortBy || "order",
        sortDir: query.sortDir || "asc",
      });
    },
  };
}

/** @param {import('@/lib/types').DatabaseAdapter} db */
export function createOrderRepository(db) {
  const base = createCrudRepository(db, COLLECTIONS.orders, { idPrefix: "order" });
  return {
    ...base,
    /** @param {string} number */
    async getByNumber(number) {
      return base.getOne({ number });
    },
    /**
     * @param {string} id
     * @param {Object} patch
     */
    async updateStatus(id, patch) {
      return base.update(id, {
        paymentStatus: patch.paymentStatus,
        shippingStatus: patch.shippingStatus,
        tracking: patch.tracking,
        courier: patch.courier,
      });
    },
  };
}

/** @param {import('@/lib/types').DatabaseAdapter} db */
export function createCustomerRepository(db) {
  const base = createCrudRepository(db, COLLECTIONS.customers, { idPrefix: "customer" });
  return {
    ...base,
    /** @param {string} email */
    async getByEmail(email) {
      return base.getOne({ email });
    },
  };
}

/** @param {import('@/lib/types').DatabaseAdapter} db */
export function createCouponRepository(db) {
  const base = createCrudRepository(db, COLLECTIONS.coupons, { idPrefix: "coupon" });
  return {
    ...base,
    /** @param {string} code */
    async getByCode(code) {
      return base.getOne({ code: String(code || "").trim().toUpperCase() });
    },
  };
}

/** @param {import('@/lib/types').DatabaseAdapter} db */
export function createHomepageRepository(db) {
  const base = createCrudRepository(db, COLLECTIONS.homepage, { idPrefix: "homepage" });
  return {
    ...base,
    async getDefault() {
      const listed = await base.list({ limit: 1, sortBy: "updatedAt", sortDir: "desc" });
      return listed.items[0] || null;
    },
  };
}

/** @param {import('@/lib/types').DatabaseAdapter} db */
export function createNavigationRepository(db) {
  const base = createCrudRepository(db, COLLECTIONS.navigation, { idPrefix: "navigation" });
  return {
    ...base,
    async getDefault() {
      const listed = await base.list({ limit: 1, sortBy: "updatedAt", sortDir: "desc" });
      return listed.items[0] || null;
    },
  };
}

/** @param {import('@/lib/types').DatabaseAdapter} db */
export function createThemeRepository(db) {
  const base = createCrudRepository(db, COLLECTIONS.theme, { idPrefix: "theme" });
  return {
    ...base,
    async getDefault() {
      const listed = await base.list({ limit: 1, sortBy: "updatedAt", sortDir: "desc" });
      return listed.items[0] || null;
    },
  };
}

/** @param {import('@/lib/types').DatabaseAdapter} db */
export function createSettingsRepository(db) {
  const base = createCrudRepository(db, COLLECTIONS.settings, { idPrefix: "settings" });
  return {
    ...base,
    async getDefault() {
      const listed = await base.list({ limit: 1, sortBy: "updatedAt", sortDir: "desc" });
      return listed.items[0] || null;
    },
  };
}

/** @param {import('@/lib/types').DatabaseAdapter} db */
export function createMediaRepository(db) {
  return createCrudRepository(db, COLLECTIONS.media, { idPrefix: "media" });
}

/**
 * Wire every repository to one adapter instance.
 * @param {import('@/lib/types').DatabaseAdapter} db
 */
export function createRepositories(db) {
  return {
    products: createProductRepository(db),
    categories: createCategoryRepository(db),
    orders: createOrderRepository(db),
    customers: createCustomerRepository(db),
    coupons: createCouponRepository(db),
    homepage: createHomepageRepository(db),
    navigation: createNavigationRepository(db),
    theme: createThemeRepository(db),
    settings: createSettingsRepository(db),
    media: createMediaRepository(db),
  };
}
