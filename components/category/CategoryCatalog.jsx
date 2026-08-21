"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Filter, Shirt, X } from "lucide-react";

import ProductCard from "@/components/product/ProductCard";

import "./category.css";

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
];

export default function CategoryCatalog({ products }) {
  const [sort, setSort] = useState("newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const sizes = useMemo(() => {
    const set = new Set();
    products.forEach((product) => (product.sizes || []).forEach((entry) => set.add(entry.size)));
    return [...set].sort();
  }, [products]);

  const colors = useMemo(() => {
    const set = new Set();
    products.forEach((product) => (product.colors || []).forEach((color) => set.add(color.name)));
    return [...set];
  }, [products]);

  const prices = useMemo(() => products.map((product) => product.price).filter((value) => value > 0), [products]);
  const minBound = prices.length ? Math.min(...prices) : 0;
  const maxBound = prices.length ? Math.max(...prices) : 0;

  const visible = useMemo(() => {
    let list = [...products];

    if (selectedSizes.length) {
      list = list.filter((product) => (product.sizes || []).some((entry) => selectedSizes.includes(entry.size)));
    }
    if (selectedColors.length) {
      list = list.filter((product) => (product.colors || []).some((color) => selectedColors.includes(color.name)));
    }
    if (minPrice) list = list.filter((product) => product.price >= Number(minPrice));
    if (maxPrice) list = list.filter((product) => product.price <= Number(maxPrice));

    if (sort === "price-asc") list.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sort === "price-desc") list.sort((a, b) => (b.price || 0) - (a.price || 0));

    return list;
  }, [products, sort, selectedSizes, selectedColors, minPrice, maxPrice]);

  const toggleSize = (size) =>
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((item) => item !== size) : [...prev, size]));

  const toggleColor = (color) =>
    setSelectedColors((prev) => (prev.includes(color) ? prev.filter((item) => item !== color) : [...prev, color]));

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setMinPrice("");
    setMaxPrice("");
  };

  const hasFilters = selectedSizes.length > 0 || selectedColors.length > 0 || Boolean(minPrice) || Boolean(maxPrice);
  const empty = products.length === 0;
  const noMatch = !empty && visible.length === 0;

  return (
    <div className="category-catalog">
      <div className="category-catalog__toolbar">
        <p className="category-catalog__count">
          {visible.length} product{visible.length === 1 ? "" : "s"}
        </p>

        <div className="category-catalog__tools">
          <button
            type="button"
            className="category-catalog__filter-btn"
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen((value) => !value)}
          >
            <Filter size={14} strokeWidth={1.5} aria-hidden="true" />
            Filters
            {hasFilters ? <span className="category-catalog__filter-dot" aria-hidden="true" /> : null}
          </button>

          <div className="category-catalog__sort">
            <label htmlFor="category-sort">Sort</label>
            <div className="category-catalog__select-wrap">
              <select id="category-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
                {SORTS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} strokeWidth={1.5} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {filterOpen ? (
        <div className="category-catalog__filters">
          <div className="category-catalog__filter-group">
            <b>Size</b>
            <div className="category-catalog__chips">
              {sizes.map((size) => (
                <button
                  type="button"
                  key={size}
                  className={`category-catalog__chip${selectedSizes.includes(size) ? " is-active" : ""}`}
                  onClick={() => toggleSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="category-catalog__filter-group">
            <b>Colour</b>
            <div className="category-catalog__chips">
              {colors.map((color) => (
                <button
                  type="button"
                  key={color}
                  className={`category-catalog__chip${selectedColors.includes(color) ? " is-active" : ""}`}
                  onClick={() => toggleColor(color)}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <div className="category-catalog__filter-group">
            <b>Price</b>
            <div className="category-catalog__price">
              <input
                type="number"
                min="0"
                placeholder={`Min ₹${minBound}`}
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                aria-label="Minimum price"
              />
              <span aria-hidden="true">—</span>
              <input
                type="number"
                min="0"
                placeholder={`Max ₹${maxBound}`}
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                aria-label="Maximum price"
              />
            </div>
          </div>

          {hasFilters ? (
            <button type="button" className="category-catalog__clear" onClick={clearFilters}>
              <X size={13} strokeWidth={1.5} aria-hidden="true" />
              Clear all
            </button>
          ) : null}
        </div>
      ) : null}

      {empty || noMatch ? (
        <div className="category-catalog__empty">
          <div className="category-catalog__empty-icon">
            <Shirt size={30} strokeWidth={1} aria-hidden="true" />
          </div>
          <h3>{empty ? "No products in this collection yet" : "No products match your filters"}</h3>
          <p>
            {empty
              ? "New pieces will appear here as the edit grows."
              : "Try adjusting or clearing your filters to see more pieces."}
          </p>
          {noMatch ? (
            <button type="button" className="category-catalog__empty-cta" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
          <Link href="/shop" className="category-catalog__empty-cta">
            Browse all products
          </Link>
        </div>
      ) : (
        <div className="category-catalog__grid">
          {visible.map((product, index) => (
            <ProductCard key={product.id || product.slug} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}