import { bootstrapDatabase } from "@/lib/database/register";
import { CustomerModel, MediaModel, OrderModel, ProductModel } from "@/lib/database/models";
import OverviewDashboard from "@/components/studio/OverviewDashboard";

export const metadata = {
  title: "Overview — Beyond Buttons Studio",
  description: "Beyond Buttons Studio overview",
};

const DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * DAY_MS);
// Resolved once at module scope (server import) so the render path stays pure.
const NOW = Date.now();
const TODAY_START = (() => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
})();

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

export default async function StudioOverviewPage() {
  await bootstrapDatabase();

  const [productCount, customerCount, orderCount, paidRevenue, mediaCount, pendingPayment, pendingShipment, dailySales, recentOrders, revenueByMethod, ordersToday] =
    await Promise.all([
      ProductModel.countDocuments({ status: { $ne: "archived" } }),
      CustomerModel.countDocuments(),
      OrderModel.countDocuments(),
      OrderModel.aggregate([
        { $match: { paymentStatus: "paid" } },
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
          $match: { paymentStatus: "paid", createdAt: { $gte: THIRTY_DAYS_AGO } },
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
        .select("id orderNumber total currency paymentStatus paymentMethod shippingStatus shippingAddress createdAt")
        .lean()
        .exec(),
      OrderModel.aggregate([
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
            revenue: { $sum: "$total" },
          },
        },
      ]),
      OrderModel.countDocuments({ createdAt: { $gte: TODAY_START } }),
    ]);

  const initialData = {
    now: NOW,
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
    paymentMethods: revenueByMethod.map((row) => ({
      method: row._id || "cod",
      count: Number(row.count || 0),
      revenue: Number(row.revenue || 0),
    })),
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
  };

  return (
    <>
      <header className="studio-main__header">
        <div>
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title">Overview</h1>
          <p className="studio-main__copy">
            Live catalog and commerce metrics. Refreshes automatically.
          </p>
        </div>
      </header>

      <OverviewDashboard initialData={initialData} />
    </>
  );
}
