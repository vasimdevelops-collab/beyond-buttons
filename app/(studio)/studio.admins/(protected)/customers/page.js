import { bootstrapDatabase } from "@/lib/database/register";
import { CustomerModel } from "@/lib/database/models";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const metadata = {
  title: "Customers — Beyond Buttons Studio",
  description: "View live customer records from MongoDB",
};

export default async function StudioCustomersPage() {
  await bootstrapDatabase();
  const customers = await CustomerModel.find({}).sort({ createdAt: -1 }).lean().exec();

  return (
    <>
      <header className="studio-main__header studio-products__header">
        <div>
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title">Customers</h1>
          <p className="studio-main__copy">
            Live sign-ups from the storefront are synced into MongoDB and appear here automatically.
          </p>
        </div>
      </header>

      <section className="studio-table" data-state={customers.length ? "ready" : "empty"} aria-label="Customers">
        <div className="studio-table__head" role="row">
          <span>Name</span>
          <span>Email</span>
          <span>Phone</span>
          <span>Status</span>
          <span>Joined</span>
        </div>

        {customers.length === 0 ? (
          <div className="studio-table__empty" role="status">
            <p className="studio-table__empty-title">No customers yet</p>
            <p className="studio-table__empty-copy">
              New storefront sign-ups will appear here as soon as they are saved in MongoDB.
            </p>
          </div>
        ) : (
          <ul className="studio-table__body">
            {customers.map((customer) => (
              <li key={customer.id}>
                <div className="studio-table__row">
                  <span className="studio-table__product">
                    <strong>{customer.fullName || "Untitled customer"}</strong>
                    <small>{customer.id}</small>
                  </span>
                  <span>{customer.email || "—"}</span>
                  <span>{customer.phone || "—"}</span>
                  <span className="studio-table__status" data-status={customer.status || "active"}>
                    {customer.status || "active"}
                  </span>
                  <span>{formatDate(customer.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
