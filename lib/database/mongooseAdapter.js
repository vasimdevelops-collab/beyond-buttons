/**
 * MongoDB adapter — same CollectionPort / DatabaseAdapter contract
 * as the memory adapter. Repositories and services stay unchanged.
 */

import { connectMongo, disconnectMongo } from "@/lib/database/connection";
import { MODEL_BY_COLLECTION } from "@/lib/database/models";

function createId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

/**
 * @param {import('mongoose').Document|Object|null} doc
 */
function toPlain(doc) {
  if (!doc) return null;
  const raw = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  const createdAt =
    raw.createdAt instanceof Date ? raw.createdAt.toISOString() : raw.createdAt;
  const updatedAt =
    raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : raw.updatedAt;

  const { _id, __v, ...rest } = raw;
  return {
    ...rest,
    id: rest.id || String(_id),
    createdAt,
    updatedAt,
  };
}

/**
 * @param {Object.<string, any>} [filter]
 */
function toMongoFilter(filter = {}) {
  const query = {};
  Object.entries(filter).forEach(([key, expected]) => {
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      if ("$in" in expected) query[key] = { $in: expected.$in };
      else if ("$eq" in expected) query[key] = expected.$eq;
      else if ("$ne" in expected) query[key] = { $ne: expected.$ne };
      else query[key] = expected;
      return;
    }
    query[key] = expected;
  });
  return query;
}

/**
 * @param {import('mongoose').Model} Model
 * @param {string} name
 * @returns {import('@/lib/types').CollectionPort}
 */
function createMongoCollection(Model, name) {
  return {
    async findMany(query = {}) {
      const filter = toMongoFilter(query.filter || {});
      const total = await Model.countDocuments(filter);
      let cursor = Model.find(filter);

      if (query.sortBy) {
        cursor = cursor.sort({
          [query.sortBy]: query.sortDir === "desc" ? -1 : 1,
        });
      }

      const offset = Number(query.offset) || 0;
      if (offset) cursor = cursor.skip(offset);
      if (query.limit != null) cursor = cursor.limit(Number(query.limit));

      const rows = await cursor.lean().exec();
      const items = rows.map((row) => toPlain(row));

      return {
        items,
        total,
        limit: query.limit ?? items.length,
        offset,
      };
    },

    async findById(id) {
      const row = await Model.findOne({ id: String(id) }).lean().exec();
      return toPlain(row);
    },

    async findOne(filter = {}) {
      const row = await Model.findOne(toMongoFilter(filter)).lean().exec();
      return toPlain(row);
    },

    async insert(data) {
      if (!isObject(data)) {
        throw new Error(`[${name}] insert expects an object`);
      }

      const id = String(data.id || createId(name.replace(/s$/, "") || name));
      const payload = { ...data, id };

      if (name === "coupons" && payload.code) {
        payload.code = String(payload.code).trim().toUpperCase();
      }

      if (name === "orders" && !payload.number) {
        payload.number = id;
      }

      const created = await Model.create(payload);
      return toPlain(created);
    },

    async update(id, patch) {
      if (!isObject(patch)) {
        throw new Error(`[${name}] update expects an object`);
      }

      const next = { ...patch };
      delete next.id;
      delete next.createdAt;

      if (name === "coupons" && next.code) {
        next.code = String(next.code).trim().toUpperCase();
      }

      const updated = await Model.findOneAndUpdate(
        { id: String(id) },
        { $set: next },
        { returnDocument: "after" }
      )
        .lean()
        .exec();

      return toPlain(updated);
    },

    async remove(id) {
      const result = await Model.deleteOne({ id: String(id) }).exec();
      return result.deletedCount > 0;
    },
  };
}

/**
 * @param {Object} [options]
 * @returns {import('@/lib/types').DatabaseAdapter}
 */
export function createMongooseAdapter(options = {}) {
  void options;

  return {
    provider: "mongodb",

    async connect() {
      await connectMongo();
    },

    async disconnect() {
      await disconnectMongo();
    },

    collection(name) {
      const Model = MODEL_BY_COLLECTION[name];
      if (!Model) {
        throw new Error(`[mongodb] Unknown collection: ${name}`);
      }
      return createMongoCollection(Model, name);
    },
  };
}
