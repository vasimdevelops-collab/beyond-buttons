"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import ProductCard from "@/components/product/ProductCard";

export function SearchResults({ query }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchResults() {
      try {
        const response = await fetch(
          `/api/site/search?q=${encodeURIComponent(query)}`,
          { cache: "no-store" }
        );
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        if (!cancelled) {
          setProducts(data.products || []);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchResults();

    return () => {
      cancelled = true;
    };
  }, [query]);

  if (loading) {
    return (
      <main className="category-catalog-page">
        <div className="category-catalog-page__container">
          <div className="category-catalog-page__header-skeleton">
            <div className="skeleton skeleton--text skeleton--short" />
            <div className="skeleton skeleton--text skeleton--long" />
            <div className="skeleton skeleton--text skeleton--medium" />
          </div>
          <div className="products__grid">
            {[...Array(8)].map((_, i) => (
              <article key={i} className="product-card skeleton-card">
                <div className="product-card__visual skeleton skeleton--image" />
                <div className="product-card__info">
                  <div className="skeleton skeleton--text skeleton--medium" />
                  <div className="skeleton skeleton--text skeleton--short" />
                  <div className="skeleton skeleton--text skeleton--short" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="category-catalog-page">
      <div className="category-catalog-page__container">
        <nav className="category-catalog-page__breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Search</span>
        </nav>

        <p className="category-catalog-page__eyebrow">Search results</p>
        <h1 className="category-catalog-page__title">“{query}”</h1>
        <p className="category-catalog-page__tagline">
          {products.length > 0
            ? `Found ${products.length} product${products.length !== 1 ? "s" : ""}`
            : "No products match your search."}
        </p>

        {products.length > 0 && (
          <div className="products__grid">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}