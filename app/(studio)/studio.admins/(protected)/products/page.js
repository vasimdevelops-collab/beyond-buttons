"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { toast } from "@/components/toast/toast-store";

const PRODUCTS_PATH = "/studio.admins/products";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

export default function StudioProductsPage() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);

  // Debounce the search box so we don't hammer the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function refreshProducts() {
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (status !== "all") params.set("status", status);
      if (category !== "all") params.set("category", category);
      if (page > 1) params.set("page", String(page));

      const response = await fetch(`/api/admin/products?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Unable to load products");
      const data = await response.json();
      if (mountedRef.current) {
        setProducts(Array.isArray(data) ? data : Array.isArray(data?.products) ? data.products : []);
        setPagination(data?.pagination || null);
      }
    } catch {
      if (mountedRef.current) {
        setProducts([]);
        setPagination(null);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshProducts();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, status, category, page]);

  const categories = useMemo(() => {
    const values = new Set(
      products.map((product) => product.category).filter(Boolean)
    );
    return ["all", ...Array.from(values)];
  }, [products]);

  const hasActiveFilters = Boolean(debouncedQuery) || status !== "all" || category !== "all";

  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setStatus("all");
    setCategory("all");
    setPage(1);
  };

  async function handleDelete(productId) {
    if (!productId) return;
    const confirmed = window.confirm("Delete this product from the catalog?");
    if (!confirmed) return;

    const response = await fetch(`/api/admin/products?id=${encodeURIComponent(productId)}`, {
      method: "DELETE",
    });

    if (response.ok) {
      await refreshProducts();
      toast.success("Product deleted");
    } else {
      toast.error("Unable to delete product");
    }
  }

  async function handleDuplicate(productId) {
    if (!productId) return;

    const response = await fetch(
      `/api/admin/products?id=${encodeURIComponent(productId)}`,
      { cache: "no-store" }
    );
    if (!response.ok) {
      toast.error("Unable to load product");
      return;
    }

    const product = await response.json();
    const newName = `${product.name || "Untitled product"} (Copy)`;
    const colors = Array.isArray(product.colors) ? product.colors : [];
    // Event handler (not render), so Date.now() is safe here.
    // eslint-disable-next-line react-hooks/purity
    const copySuffix = Date.now();

    const payload = {
      name: newName,
      slug: `${product.slug || "product"}-copy-${copySuffix}`,
      category: product.category,
      categoryId: product.categoryId,
      status: "draft",
      featured: false,
      price: product.price,
      comparePrice: product.comparePrice,
      generalInformation: {
        name: newName,
        shortName: newName,
        description: product.generalInformation?.description || "",
        brandStatement: product.generalInformation?.brandStatement || "",
      },
      story: product.story,
      colors: colors.map((color) => ({
        name: color.name,
        hex: color.hex,
        status: "draft",
        isDefault: Boolean(color.isDefault),
        price: color.price,
        comparePrice: color.comparePrice,
        media: color.media,
        inventory: Object.fromEntries(
          Object.entries(color.inventory || {}).map(([size, entry]) => [
            size,
            {
              stock: entry?.stock ?? "",
              sku: "",
              enabled: entry?.enabled !== false,
            },
          ])
        ),
      })),
    };

    const saveResponse = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (saveResponse.ok) {
      toast.success("Product duplicated as draft");
      await refreshProducts();
    } else {
      toast.error("Unable to duplicate product");
    }
  }

  const totalCount = pagination?.total ?? products.length;
  const startIndex = totalCount === 0 ? 0 : (pagination?.page - 1) * (pagination?.limit || 50) + 1;
  const endIndex = Math.min(totalCount, startIndex + products.length - 1);

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
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name, slug, or ID"
            autoComplete="off"
          />
        </label>

        <label className="studio-field">
          <span className="studio-field__label">Status</span>
          <select
            name="status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
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
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            {categories.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? "All categories" : value}
              </option>
            ))}
          </select>
        </label>

        {hasActiveFilters ? (
          <button
            type="button"
            className="studio-btn studio-btn--ghost"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        ) : null}
      </section>

      {!loading && totalCount > 0 ? (
        <p className="studio-products__count" role="status">
          Showing {startIndex}–{endIndex} of {totalCount} products
          {debouncedQuery ? ` for "{debouncedQuery}"` : ""}
        </p>
      ) : null}

      <section
        className="studio-table"
        data-state={loading ? "loading" : products.length ? "ready" : "empty"}
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
        ) : products.length === 0 ? (
          <div className="studio-table__empty" role="status">
            {hasActiveFilters ? (
              <>
                <p className="studio-table__empty-title">No products match your filters</p>
                <p className="studio-table__empty-copy">
                  Try a different search term or clear the filters to see the full catalog.
                </p>
                <button
                  type="button"
                  className="studio-btn studio-btn--ghost"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="studio-table__empty-title">No products yet</p>
                <p className="studio-table__empty-copy">
                  Create a product to populate the catalog and drive the storefront.
                </p>
                <Link className="studio-btn studio-btn--ghost" href={`${PRODUCTS_PATH}/new`}>
                  New Product
                </Link>
              </>
            )}
          </div>
        ) : (
          <ul className="studio-table__body">
            {products.map((product) => (
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
                      onClick={() => handleDuplicate(product.id)}
                      style={{ marginLeft: "0.5rem" }}
                    >
                      Duplicate
                    </button>
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

      {pagination && pagination.pages > 1 ? (
        <nav className="studio-pagination" aria-label="Product pages">
          <button
            type="button"
            className="studio-btn studio-btn--ghost"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </button>
          <span className="studio-pagination__info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            type="button"
            className="studio-btn studio-btn--ghost"
            disabled={page >= pagination.pages}
            onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))}
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}