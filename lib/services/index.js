/**
 * Service + validation layer (Phase 1).
 * Validation lives here under `validation` until a dedicated split is approved.
 * No API routes. No admin UI. No provider SDKs.
 */

import { createDatabaseAdapter } from "@/lib/database";
import { createRepositories } from "@/lib/repositories";

/* ───────────────────────── Validation ───────────────────────── */

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    return `${field} is required`;
  }
  return null;
}

function optionalNumber(value, field) {
  if (value == null || value === "") return null;
  if (typeof value !== "number" || Number.isNaN(value)) {
    return `${field} must be a number`;
  }
  return null;
}

/**
 * @param {Object|null|undefined} input
 * @param {string[]} errors
 */
function push(errors, message) {
  if (message) errors.push(message);
}

export const validation = {
  /**
   * @param {Partial<import('@/lib/types').Product>} input
   * @param {{ partial?: boolean }} [options]
   */
  product(input = {}, options = {}) {
    const errors = [];
    if (!options.partial) {
      push(errors, requiredString(input.slug, "slug"));
      push(errors, requiredString(input.name, "name"));
    } else {
      if ("slug" in input) push(errors, requiredString(input.slug, "slug"));
      if ("name" in input) push(errors, requiredString(input.name, "name"));
    }
    push(errors, optionalNumber(input.price, "price"));
    push(errors, optionalNumber(input.comparePrice, "comparePrice"));
    push(errors, optionalNumber(input.stock, "stock"));
    if (input.status && !["draft", "active", "archived"].includes(input.status)) {
      errors.push("status must be draft, active, or archived");
    }
    return { ok: errors.length === 0, errors };
  },

  /** @param {Partial<import('@/lib/types').Category>} input */
  category(input = {}, options = {}) {
    const errors = [];
    if (!options.partial) {
      push(errors, requiredString(input.name, "name"));
      push(errors, requiredString(input.slug, "slug"));
    }
    if ("visibility" in input && typeof input.visibility !== "boolean") {
      errors.push("visibility must be boolean");
    }
    push(errors, optionalNumber(input.order, "order"));
    return { ok: errors.length === 0, errors };
  },

  /** @param {Partial<import('@/lib/types').Order>} input */
  order(input = {}, options = {}) {
    const errors = [];
    if (!options.partial && !Array.isArray(input.items)) {
      errors.push("items must be an array");
    }
    if (Array.isArray(input.items) && input.items.length === 0) {
      errors.push("items must not be empty");
    }
    return { ok: errors.length === 0, errors };
  },

  /** @param {Partial<import('@/lib/types').Customer>} input */
  customer(input = {}, options = {}) {
    const errors = [];
    if (!options.partial) {
      push(errors, requiredString(input.email, "email"));
    }
    if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      errors.push("email is invalid");
    }
    return { ok: errors.length === 0, errors };
  },

  /** @param {Partial<import('@/lib/types').Coupon>} input */
  coupon(input = {}, options = {}) {
    const errors = [];
    if (!options.partial) {
      push(errors, requiredString(input.code, "code"));
    }
    push(errors, optionalNumber(input.value, "value"));
    return { ok: errors.length === 0, errors };
  },

  /** @param {Partial<import('@/lib/types').MediaAsset>} input */
  media(input = {}, options = {}) {
    const errors = [];
    if (!options.partial) {
      push(errors, requiredString(input.src, "src"));
    }
    return { ok: errors.length === 0, errors };
  },

  /** @param {Object} input */
  homepage(input = {}) {
    const errors = [];
    if (input.featuredProductIds && !Array.isArray(input.featuredProductIds)) {
      errors.push("featuredProductIds must be an array");
    }
    return { ok: errors.length === 0, errors };
  },

  theme() {
    return { ok: true, errors: [] };
  },

  navigation() {
    return { ok: true, errors: [] };
  },

  settings() {
    return { ok: true, errors: [] };
  },
};

function assertValid(result) {
  if (!result.ok) {
    const error = new Error(result.errors.join("; "));
    error.name = "ValidationError";
    error.details = result.errors;
    throw error;
  }
}

/* ───────────────────────── Services ───────────────────────── */

/**
 * @param {ReturnType<typeof createRepositories>} repos
 */
export function createProductService(repos) {
  return {
    list: (query) => repos.products.list(query),
    getById: (id) => repos.products.getById(id),
    getBySlug: (slug) => repos.products.getBySlug(slug),
    async create(input) {
      assertValid(validation.product(input));
      return repos.products.create({
        status: "draft",
        stock: 0,
        colors: [],
        sizes: [],
        gallery: [],
        ...input,
      });
    },
    async update(id, patch) {
      assertValid(validation.product(patch, { partial: true }));
      return repos.products.update(id, patch);
    },
    remove: (id) => repos.products.remove(id),
  };
}

/** @param {ReturnType<typeof createRepositories>} repos */
export function createCategoryService(repos) {
  return {
    list: (query) => repos.categories.list(query),
    getById: (id) => repos.categories.getById(id),
    getBySlug: (slug) => repos.categories.getBySlug(slug),
    async create(input) {
      assertValid(validation.category(input));
      return repos.categories.create({
        visibility: true,
        order: 0,
        ...input,
      });
    },
    async update(id, patch) {
      assertValid(validation.category(patch, { partial: true }));
      return repos.categories.update(id, patch);
    },
    remove: (id) => repos.categories.remove(id),
  };
}

/** @param {ReturnType<typeof createRepositories>} repos */
export function createOrderService(repos) {
  return {
    list: (query) => repos.orders.list(query),
    getById: (id) => repos.orders.getById(id),
    getByNumber: (number) => repos.orders.getByNumber(number),
    async create(input) {
      assertValid(validation.order(input));
      return repos.orders.create({
        paymentStatus: "pending",
        shippingStatus: "pending",
        tracking: "",
        courier: "",
        ...input,
      });
    },
    async update(id, patch) {
      assertValid(validation.order(patch, { partial: true }));
      return repos.orders.update(id, patch);
    },
    updateStatus: (id, patch) => repos.orders.updateStatus(id, patch),
    remove: (id) => repos.orders.remove(id),
  };
}

/** @param {ReturnType<typeof createRepositories>} repos */
export function createCustomerService(repos) {
  return {
    list: (query) => repos.customers.list(query),
    getById: (id) => repos.customers.getById(id),
    getByEmail: (email) => repos.customers.getByEmail(email),
    async create(input) {
      assertValid(validation.customer(input));
      return repos.customers.create({ addresses: [], ...input });
    },
    async update(id, patch) {
      assertValid(validation.customer(patch, { partial: true }));
      return repos.customers.update(id, patch);
    },
    remove: (id) => repos.customers.remove(id),
  };
}

/** @param {ReturnType<typeof createRepositories>} repos */
export function createCouponService(repos) {
  return {
    list: (query) => repos.coupons.list(query),
    getById: (id) => repos.coupons.getById(id),
    getByCode: (code) => repos.coupons.getByCode(code),
    async create(input) {
      assertValid(validation.coupon(input));
      const code = String(input.code).trim().toUpperCase();
      return repos.coupons.create({
        active: true,
        usedCount: 0,
        ...input,
        code,
      });
    },
    async update(id, patch) {
      assertValid(validation.coupon(patch, { partial: true }));
      const next = { ...patch };
      if (next.code) next.code = String(next.code).trim().toUpperCase();
      return repos.coupons.update(id, next);
    },
    remove: (id) => repos.coupons.remove(id),
  };
}

/** @param {ReturnType<typeof createRepositories>} repos */
export function createHomepageService(repos) {
  return {
    list: (query) => repos.homepage.list(query),
    getById: (id) => repos.homepage.getById(id),
    getDefault: () => repos.homepage.getDefault(),
    async create(input) {
      assertValid(validation.homepage(input));
      return repos.homepage.create(input);
    },
    async update(id, patch) {
      assertValid(validation.homepage(patch));
      return repos.homepage.update(id, patch);
    },
    remove: (id) => repos.homepage.remove(id),
  };
}

/** @param {ReturnType<typeof createRepositories>} repos */
export function createNavigationService(repos) {
  return {
    list: (query) => repos.navigation.list(query),
    getById: (id) => repos.navigation.getById(id),
    getDefault: () => repos.navigation.getDefault(),
    async create(input) {
      assertValid(validation.navigation(input));
      return repos.navigation.create(input);
    },
    async update(id, patch) {
      assertValid(validation.navigation(patch));
      return repos.navigation.update(id, patch);
    },
    remove: (id) => repos.navigation.remove(id),
  };
}

/** @param {ReturnType<typeof createRepositories>} repos */
export function createThemeService(repos) {
  return {
    list: (query) => repos.theme.list(query),
    getById: (id) => repos.theme.getById(id),
    getDefault: () => repos.theme.getDefault(),
    async create(input) {
      assertValid(validation.theme(input));
      return repos.theme.create(input);
    },
    async update(id, patch) {
      assertValid(validation.theme(patch));
      return repos.theme.update(id, patch);
    },
    remove: (id) => repos.theme.remove(id),
  };
}

/** @param {ReturnType<typeof createRepositories>} repos */
export function createSettingsService(repos) {
  return {
    list: (query) => repos.settings.list(query),
    getById: (id) => repos.settings.getById(id),
    getDefault: () => repos.settings.getDefault(),
    async create(input) {
      assertValid(validation.settings(input));
      return repos.settings.create(input);
    },
    async update(id, patch) {
      assertValid(validation.settings(patch));
      return repos.settings.update(id, patch);
    },
    remove: (id) => repos.settings.remove(id),
  };
}

/** @param {ReturnType<typeof createRepositories>} repos */
export function createMediaService(repos) {
  return {
    list: (query) => repos.media.list(query),
    getById: (id) => repos.media.getById(id),
    async create(input) {
      assertValid(validation.media(input));
      return repos.media.create(input);
    },
    async update(id, patch) {
      assertValid(validation.media(patch, { partial: true }));
      return repos.media.update(id, patch);
    },
    remove: (id) => repos.media.remove(id),
  };
}

/**
 * Compose the backend foundation for future CMS / API layers.
 * @param {{ provider?: 'memory'|'mongodb'|'prisma'|'firebase', seed?: Object.<string, Object[]> }} [options]
 */
export function createBackend(options = {}) {
  const db = createDatabaseAdapter(options.provider || "memory", {
    seed: options.seed || {},
  });
  const repositories = createRepositories(db);
  const services = {
    products: createProductService(repositories),
    categories: createCategoryService(repositories),
    orders: createOrderService(repositories),
    customers: createCustomerService(repositories),
    coupons: createCouponService(repositories),
    homepage: createHomepageService(repositories),
    navigation: createNavigationService(repositories),
    theme: createThemeService(repositories),
    settings: createSettingsService(repositories),
    media: createMediaService(repositories),
  };

  return {
    db,
    repositories,
    services,
    validation,
  };
}
