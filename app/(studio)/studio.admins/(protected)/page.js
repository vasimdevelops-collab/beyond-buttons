import { bootstrapDatabase } from "@/lib/database/register";
import { CustomerModel, OrderModel, ProductModel } from "@/lib/database/models";

const OVERVIEW_KPIS = [
  { key: "products", label: "Products" },
  { key: "customers", label: "Customers" },
  { key: "orders", label: "Orders" },
  { key: "revenue", label: "Revenue" },
  { key: "media", label: "Media" },
];

export const metadata = {
  title: "Overview — Beyond Buttons Studio",
  description: "Beyond Buttons Studio overview",
};

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default async function StudioOverviewPage() {
  await bootstrapDatabase();
  const [productCount, customerCount, orderCount, revenue] = await Promise.all([
    ProductModel.countDocuments({ status: { $ne: "archived" } }),
    CustomerModel.countDocuments(),
    OrderModel.countDocuments(),
    OrderModel.aggregate([
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]).then((rows) => rows[0]?.total || 0),
  ]);

  const kpis = [
    { key: "products", value: String(productCount), meta: "live catalog" },
    { key: "customers", value: String(customerCount), meta: "customer accounts" },
    { key: "orders", value: String(orderCount), meta: "placed orders" },
    { key: "revenue", value: formatMoney(revenue), meta: "gross revenue" },
    { key: "media", value: "—", meta: "asset library" },
  ];

  return (
    <>
      <header className="studio-main__header">
        <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
        <h1 className="studio-main__title">Overview</h1>
        <p className="studio-main__copy">
          Live catalog and commerce metrics from the connected database.
        </p>
      </header>

      <section className="studio-kpi-grid" aria-label="Overview metrics">
        {OVERVIEW_KPIS.map((kpi) => {
          const data = kpis.find((entry) => entry.key === kpi.key) || {
            value: "—",
            meta: "Ready for live data",
          };

          return (
            <article
              key={kpi.key}
              className="studio-kpi"
              data-kpi={kpi.key}
              data-state="ready"
              aria-busy="false"
            >
              <p className="studio-kpi__label">{kpi.label}</p>
              <p className="studio-kpi__value" data-slot="value">
                {data.value}
              </p>
              <p className="studio-kpi__meta">{data.meta}</p>
            </article>
          );
        })}
      </section>
    </>
  );
}
