/**
 * Shared inventory helpers — single source of truth for order-driven
 * stock mutations. Every decrement/restore is an atomic, guarded update on
 * the exact product + color + size entry (no read-then-write), so concurrent
 * orders cannot oversell. Availability is kept in sync with the new stock.
 */

import { OrderModel, ProductModel } from "@/lib/database/models";

const LOW_STOCK_THRESHOLD = 5;

function buildDecrements(order) {
  const quantities = new Map();
  for (const item of order?.items || []) {
    const productId = item?.product?.id;
    const colorId = item?.color?.id;
    const size = item?.size;
    const qty = Math.max(1, Number(item?.quantity) || 1);
    if (!productId || !colorId || !size) continue;
    const key = `${productId}::${colorId}::${size}`;
    quantities.set(key, (quantities.get(key) || 0) + qty);
  }
  return [...quantities.entries()].map(([key, qty]) => {
    const [productId, colorId, size] = key.split("::");
    return { productId, colorId, size, qty };
  });
}

function computeAvailability(stock) {
  if (stock <= 0) return "out_of_stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

/** Targeted availability refresh for one size entry (kept in sync with stock). */
async function syncAvailability(productId, colorId, size, { session } = {}) {
  const product = await ProductModel.findOne({ id: productId }).session(session).exec();
  if (!product) return;

  const variant = product.variants?.find((v) =>
    Array.isArray(v?.colors) && v.colors.some((c) => c.id === colorId)
  );
  const color = variant?.colors?.find((c) => c.id === colorId);
  const entry = color?.sizes?.find((s) => s.size === size);
  if (!entry) return;

  const availability = computeAvailability(Number(entry.stock) || 0);
  if (entry.availability === availability) return;

  await ProductModel.updateOne(
    { id: productId },
    {
      $set: {
        "variants.$[v].colors.$[c].sizes.$[s].availability": availability,
      },
    },
    {
      arrayFilters: [
        { "v.colors.id": colorId },
        { "c.sizes.size": size },
        { "s.size": size },
      ],
      session,
    }
  ).exec();
}

/**
 * Atomically decrement stock for every line item of an order.
 * Fails (throws) if any size entry no longer has enough stock — callers should
 * run this inside a transaction so the failure rolls back cleanly.
 */
export async function decrementOrderStock(order, { session } = {}) {
  for (const dec of buildDecrements(order)) {
    const result = await ProductModel.findOneAndUpdate(
      {
        id: dec.productId,
        variants: {
          $elemMatch: {
            colors: {
              $elemMatch: {
                id: dec.colorId,
                sizes: { $elemMatch: { size: dec.size, stock: { $gte: dec.qty } } },
              },
            },
          },
        },
      },
      {
        $inc: {
          "variants.$[v].colors.$[c].sizes.$[s].stock": -dec.qty,
        },
      },
      {
        arrayFilters: [
          { "v.colors.id": dec.colorId },
          { "c.sizes.size": dec.size },
          { "s.size": dec.size },
        ],
        session,
      }
    ).exec();

    if (!result) {
      const product = await ProductModel.findOne({ id: dec.productId })
        .session(session)
        .exec();
      const variant = product?.variants?.find((v) =>
        Array.isArray(v?.colors) && v.colors.some((c) => c.id === dec.colorId)
      );
      const color = variant?.colors?.find((c) => c.id === dec.colorId);
      const entry = color?.sizes?.find((s) => s.size === dec.size);
      const available = Number(entry?.stock) || 0;
      throw new Error(
        `Insufficient stock for ${dec.productId} (size ${dec.size}): available ${available}, requested ${dec.qty}`
      );
    }

    await syncAvailability(dec.productId, dec.colorId, dec.size, { session });
  }
}

/** Atomically restore stock for every line item of an order (cancellation / refund). */
export async function restoreOrderStock(order, { session } = {}) {
  for (const dec of buildDecrements(order)) {
    await ProductModel.updateOne(
      { id: dec.productId },
      {
        $inc: {
          "variants.$[v].colors.$[c].sizes.$[s].stock": dec.qty,
        },
      },
      {
        arrayFilters: [
          { "v.colors.id": dec.colorId },
          { "c.sizes.size": dec.size },
          { "s.size": dec.size },
        ],
        session,
      }
    ).exec();

    await syncAvailability(dec.productId, dec.colorId, dec.size, { session });
  }
}

/**
 * Restore a cancelled order exactly once. The order flag and stock increments
 * share one transaction, so duplicate admin/webhook cancellation events cannot
 * put inventory back more than once.
 */
export async function restoreOrderStockOnce(orderId, actor = "system") {
  const session = await ProductModel.db.startSession();
  let restored = false;

  try {
    await session.withTransaction(async () => {
      const order = await OrderModel.findOne({
        id: orderId,
        stockDecremented: true,
        stockRestored: false,
      }).session(session).exec();
      if (!order) return;

      await restoreOrderStock(order, { session });
      order.stockRestored = true;
      order.statusHistory = [
        ...(Array.isArray(order.statusHistory) ? order.statusHistory : []),
        {
          status: "inventory_restored",
          timestamp: new Date().toISOString(),
          actor,
        },
      ];
      await order.save({ session });
      restored = true;
    });
  } finally {
    await session.endSession();
  }

  return restored;
}
