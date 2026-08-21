import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/session";
import { bootstrapDatabase, MediaModel, CustomerModel, OrderModel, ProductModel } from "@/lib/database/register";

const DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * DAY_MS);

// A "confirmed sale" for revenue purposes: online orders confirmed by the
// Razorpay webhook (paid), or COD orders (payment collected on delivery).
const SALE_MATCH = { $or: [{ paymentStatus: "paid" }, { paymentMethod: "cod" }] };

function buildDailySeries(dailyRows, days = 30) {
  const byDate = new Map();
  for (const row of dailyRows) {
    byDate.set(row._id, { orders: row.orders, revenue: row.revenue });
  }

  const series = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * DAY_MS);
    const iso = date.toISOString().slice(0, 10);
    const entry = byDate.get(iso) || { orders: 0, revenue: 0 };
    series.push({
      date: iso,
      label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      orders: Number(entry.orders || 0),
      revenue: Number(entry.revenue || 0),
    });
  }
  return series;
}

export async function GET(request) {
  const guard = requireAdmin(request);
  if (guard.error) return NextResponse.json(guard.error, { status: guard.status });

  try {
    await bootstrapDatabase();

    const [productCount, customerCount, orderCount, paidRevenue, mediaCount, pendingPayment, pendingShipment, dailySales, recentOrders, revenueByMethod] =
      await Promise.all([
        ProductModel.countDocuments({ status: { $ne: "archived" } }),
        CustomerModel.countDocuments(),
        OrderModel.countDocuments(),
        OrderModel.aggregate([
          { $match: SALE_MATCH },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]).then((rows) => rows[0]?.total || 0),
        MediaModel.countDocuments(),
        OrderModel.countDocuments({ paymentStatus: "pending" }),
        OrderModel.countDocuments({
          paymentStatus: "paid",
          shippingStatus: { $in: ["pending", "processing"] },
        }),
        OrderModel.aggregate([
          {
            $match: {
              ...SALE_MATCH,
              createdAt: { $gte: THIRTY_DAYS_AGO },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" },
              },
              orders: { $sum: 1 },
              revenue: { $sum: "$total" },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        OrderModel.find({})
          .sort({ createdAt: -1 })
          .limit(6)
          .select(
            "id orderNumber total currency paymentStatus paymentMethod shippingStatus shippingAddress createdAt"
          )
          .lean()
          .exec(),
        OrderModel.aggregate([
          { $match: SALE_MATCH },
          {
            $group: {
              _id: "$paymentMethod",
              count: { $sum: 1 },
              revenue: { $sum: "$total" },
            },
          },
        ]),
      ]);

    const lastOrder = recentOrders[0] || null;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const ordersToday = await OrderModel.countDocuments({ createdAt: { $gte: todayStart } });

    const methodBreakdown = revenueByMethod.map((row) => ({
      method: row._id || "cod",
      count: Number(row.count || 0),
      revenue: Number(row.revenue || 0),
    }));

    return NextResponse.json({
      now: Date.now(),
      kpis: {
        products: productCount,
        customers: customerCount,
        orders: orderCount,
        ordersToday,
        revenue: paidRevenue,
        media: mediaCount,
        pendingPayment,
        pendingShipment,
      },
      salesSeries: buildDailySeries(dailySales),
      paymentMethods: methodBreakdown,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.shippingAddress?.fullName || order.shippingAddress?.name || "Guest",
        total: order.total,
        currency: order.currency || "INR",
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        shippingStatus: order.shippingStatus,
        createdAt: order.createdAt,
      })),
      lastOrder,
    });
  } catch (error) {
    console.error("[admin/overview] GET failed:", error);
    return NextResponse.json({ error: "Unable to load overview" }, { status: 500 });
  }
}
