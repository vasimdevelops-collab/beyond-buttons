"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

const PRODUCTS_PATH = "/studio.admins/products";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

export default function StudioProductsPage() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);

  async function refreshProducts() {
    try {
      const response = await fetch("/api/admin/products", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load products");
      const data = await response.json();
      if (mountedRef.current) {
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch {
      if (mountedRef.current) {
        setProducts([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshProducts();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const categories = useMemo(() => {
    const values = new Set(
      products.map((product) => product.category).filter(Boolean)
    );
    return ["all", ...Array.from(values)];
  }, [products]);

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        !normalized ||
        product.name?.toLowerCase().includes(normalized) ||
        product.slug?.toLowerCase().includes(normalized);
      const matchesStatus = status === "all" || product.status === status;
      const matchesCategory = category === "all" || product.category === category;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [products, query, status, category]);

  async function handleDelete(productId) {
    if (!productId) return;
    const confirmed = window.confirm("Delete this product from the catalog?");
    if (!confirmed) return;

    const response = await fetch(`/api/admin/products?id=${encodeURIComponent(productId)}`, {
      method: "DELETE",
    });

    if (response.ok) {
      await refreshProducts();
    }
  }

  return (
    <div className="studio-products" data-state={loading ? "loading" : "ready"}>
      <header className="studio-main__header studio-products__header">
        <div>
          <p className="studio-main__eyebrow">Beyond Buttons Studio</p>
          <h1 className="studio-main__title">Products</h1>
          <p className="studio-main__copy">
            Catalog list connected to the live database and storefront data layer.
          </p>
        </div>
        <Link className="studio-btn studio-btn--primary" href={`${PRODUCTS_PATH}/new`}>
          New Product
        </Link>
      </header>

      <section className="studio-toolbar" aria-label="Product filters">
        <label className="studio-field studio-toolbar__search">
          <span className="studio-field__label">Search</span>
          <input
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products"
            autoComplete="off"
          />
        </label>

        <label className="studio-field">
          <span className="studio-field__label">Status</span>
          <select
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="studio-field">
          <span className="studio-field__label">Category</span>
          <select
            name="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? "All categories" : value}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section
        className="studio-table"
        data-state={visibleProducts.length ? "ready" : "empty"}
        aria-label="Products"
      >
        <div className="studio-table__head" role="row">
          <span>Product</span>
          <span>Status</span>
          <span>Category</span>
          <span>Featured</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className="studio-table__empty" role="status">
            <p className="studio-table__empty-title">Loading products…</p>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="studio-table__empty" role="status">
            <p className="studio-table__empty-title">No products yet</p>
            <p className="studio-table__empty-copy">
              Create a product to populate the catalog and drive the storefront.
            </p>
            <Link className="studio-btn studio-btn--ghost" href={`${PRODUCTS_PATH}/new`}>
              New Product
            </Link>
          </div>
        ) : (
          <ul className="studio-table__body">
            {visibleProducts.map((product) => (
              <li key={product.id}>
                <div className="studio-table__row">
                  <span className="studio-table__product">
                    <strong>{product.name || "Untitled product"}</strong>
                    <small>{product.slug || "—"}</small>
                  </span>
                  <span className="studio-table__status" data-status={product.status}>
                    {product.status || "—"}
                  </span>
                  <span>{product.category || "—"}</span>
                  <span>{product.featured ? "Yes" : "No"}</span>
                  <span className="studio-table__actions">
                    <Link className="studio-btn studio-btn--ghost" href={`${PRODUCTS_PATH}/${product.id}`}>
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="studio-btn studio-btn--ghost"
                      onClick={() => handleDelete(product.id)}
                      style={{ marginLeft: "0.5rem" }}
                    >
                      Delete
                    </button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
