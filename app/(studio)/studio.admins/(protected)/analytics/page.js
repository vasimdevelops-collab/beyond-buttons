import { bootstrapDatabase } from "@/lib/database/register";
import {
  CategoryModel,
  CouponModel,
  CustomerModel,
  MediaModel,
  OrderModel,
  ProductModel,
} from "@/lib/database/models";
import SalesChart from "@/components/studio/SalesChart";

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Resolved once at module scope (server import) so the render path stays pure.
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

export const metadata = {
  title: "Analytics — Beyond Buttons Studio",
};

export default async function StudioAnalyticsPage() {
  await bootstrapDatabase();

  const [
    productCount,
    customerCount,
    totalOrderCount,
    categoryCount,
    mediaCount,
    couponCount,
    paidRevenue,
    ordersByPaymentStatus,
    ordersByShippingStatus,
    dailySales,
  ] = await Promise.all([
    ProductModel.countDocuments({ status: { $ne: "archived" } }),
    CustomerModel.countDocuments(),
    OrderModel.countDocuments(),
    CategoryModel.countDocuments(),
    MediaModel.countDocuments(),
    CouponModel.countDocuments(),
    // Revenue: confirmed sales (paid online or COD).
    OrderModel.aggregate([
      { $match: SALE_MATCH },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]).then((rows) => rows[0]?.total || 0),
    // Order count by payment status.
    OrderModel.aggregate([
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
    ]),
    // Order count by shipping status.
    OrderModel.aggregate([
      { $group: { _id: "$shippingStatus", count: { $sum: 1 } } },
    ]),
    // Daily sales (confirmed orders) for the last 30 days.
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
  ]);

  const paymentBreakdown = ordersByPaymentStatus.reduce((acc, row) => {
    acc[row._id || "unknown"] = row.count;
    return acc;
  }, {});

  const shippingBreakdown = ordersByShippingStatus.reduce((acc, row) => {
    acc[row._id || "unknown"] = row.count;
    return acc;
  }, {});

  const salesSeries = buildDailySeries(dailySales);

  const kpis = [
    { label: "Products", value: formatNumber(productCount), detail: "active catalog" },
    { label: "Customers", value: formatNumber(customerCount), detail: "registered accounts" },
    { label: "Orders", value: formatNumber(totalOrderCount), detail: "all time" },
    { label: "Revenue", value: formatMoney(paidRevenue), detail: "paid + COD orders" },
    { label: "Categories", value: formatNumber(categoryCount), detail: "collections" },
    { label: "Media", value: formatNumber(mediaCount), detail: "uploaded assets" },
    { label: "Coupons", value: formatNumber(couponCount), detail: "total coupons" },
  ];

  const summaryRows = [
    { key: "products", label: "Products", value: formatNumber(productCount) },
    { key: "customers", label: "Customers", value: formatNumber(customerCount) },
    { key: "orders", label: "Orders (all)", value: formatNumber(totalOrderCount) },
    { key: "revenue", label: "Revenue", value: formatMoney(paidRevenue) },
    { key: "media", label: "Media", value: formatNumber(mediaCount) },
    { key: "coupons", label: "Coupons", value: formatNumber(couponCount) },
  ];

  const paymentRows = [
    { key: "pending", label: "Pending payment", value: formatNumber(paymentBreakdown.pending || 0) },
    { key: "paid", label: "Paid", value: formatNumber(paymentBreakdown.paid || 0) },
    { key: "failed", label: "Failed", value: formatNumber(paymentBreakdown.failed || 0) },
    { key: "refunded", label: "Refunded", value: formatNumber(paymentBreakdown.refunded || 0) },
  ];

  const shippingRows = [
    { key: "pending", label: "Pending shipment", value: formatNumber(shippingBreakdown.pending || 0) },
    { key: "processing", label: "Processing", value: formatNumber(shippingBreakdown.processing || 0) },
    { key: "shipped", label: "Shipped", value: formatNumber(shippingBreakdown.shipped || 0) },
    { key: "delivered", label: "Delivered", value: formatNumber(shippingBreakdown.delivered || 0) },
    { key: "cancelled", label: "Cancelled", value: formatNumber(shippingBreakdown.cancelled || 0) },
  ];

  return (
    <>
      <header className="studio-main__header studio-products__header">
        <div>
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title">Analytics</h1>
          <p className="studio-main__copy">
            Live commerce metrics pulled from the connected database.
          </p>
        </div>
      </header>

      {/* Overview KPIs */}
      <section className="studio-section" style={{ marginBottom: "1.25rem" }}>
        <header className="studio-section__header">
          <h2 className="studio-section__title">Overview</h2>
        </header>
        <div className="studio-section__fields studio-form-grid">
          {kpis.map((item) => (
            <article key={item.label} className="studio-metric-card">
              <span className="studio-metric-card__label">{item.label}</span>
              <p className="studio-metric-card__value">{item.value}</p>
              <small className="studio-metric-card__meta">{item.detail}</small>
            </article>
          ))}
        </div>
      </section>

      {/* Summary table */}
      <section className="studio-section" style={{ marginBottom: "1.25rem" }}>
        <header className="studio-section__header">
          <h2 className="studio-section__title">Live summary</h2>
        </header>
        <div className="studio-table" data-state="ready" aria-label="Analytics summary">
          <div className="studio-table__head" role="row">
            <span>Metric</span>
            <span>Current value</span>
          </div>
          <ul className="studio-table__body">
            {summaryRows.map((row) => (
              <li key={row.key}>
                <div className="studio-table__row">
                  <span className="studio-table__product">
                    <strong>{row.label}</strong>
                  </span>
                  <span>{row.value}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Sales graph */}
      <section className="studio-section" style={{ marginBottom: "1.25rem" }}>
        <header className="studio-section__header">
          <h2 className="studio-section__title">Sales — last 30 days</h2>
          <p className="studio-section__copy">
            Confirmed orders (paid + COD). Bars = daily revenue, line = revenue trend.
          </p>
        </header>
        <SalesChart series={salesSeries} />
      </section>

      {/* Payment status breakdown */}
      <section className="studio-section" style={{ marginBottom: "1.25rem" }}>
        <header className="studio-section__header">
          <h2 className="studio-section__title">Orders by payment status</h2>
          <p className="studio-section__copy">
            Revenue metric includes paid and COD orders.
          </p>
        </header>
        <div className="studio-table" data-state="ready" aria-label="Payment status breakdown">
          <div className="studio-table__head" role="row">
            <span>Payment status</span>
            <span>Order count</span>
          </div>
          <ul className="studio-table__body">
            {paymentRows.map((row) => (
              <li key={row.key}>
                <div className="studio-table__row">
                  <span className="studio-table__product">
                    <strong>{row.label}</strong>
                  </span>
                  <span>{row.value}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Shipping status breakdown */}
      <section className="studio-section">
        <header className="studio-section__header">
          <h2 className="studio-section__title">Orders by shipping status</h2>
        </header>
        <div className="studio-table" data-state="ready" aria-label="Shipping status breakdown">
          <div className="studio-table__head" role="row">
            <span>Shipping status</span>
            <span>Order count</span>
          </div>
          <ul className="studio-table__body">
            {shippingRows.map((row) => (
              <li key={row.key}>
                <div className="studio-table__row">
                  <span className="studio-table__product">
                    <strong>{row.label}</strong>
                  </span>
                  <span>{row.value}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
