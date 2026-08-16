"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import { getProducts } from "@/lib/data";
import "@/components/about/about.css";

const products = getProducts();

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return products.slice(0, 6);

    return products.filter((product) => {
      const haystack = [
        product.name,
        product.category,
        product.brandStatement,
        product.storyText,
        product.shortName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(value);
    });
  }, [query]);

  return (
    <>
      <Navbar />

      <main className="search-page">
        <section className="search-page__hero">
          <div>
            <p className="search-page__eyebrow">Search</p>
            <h1>Find the essentials that fit your rhythm.</h1>
            <p>
              Browse the edit quickly and move from inspiration to product in a few taps.
            </p>
          </div>

          <div className="search-page__meta">
            <div>
              <span>{products.length}</span>
              <small>Products</small>
            </div>
            <div>
              <span>Live</span>
              <small>Catalog</small>
            </div>
            <div>
              <span>Fast</span>
              <small>Browse</small>
            </div>
          </div>
        </section>

        <section className="search-page__section">
          <h2>Search the collection</h2>

          <label className="search-page__input-wrap">
            <span className="sr-only">Search products</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, category, or style"
              aria-label="Search products"
            />
          </label>

          <div className="search-page__grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <article key={product.id || product.slug} className="search-product-card">
                  <Link href={`/product/${product.slug}`} className="search-product-card__media">
                    <img
                      src={product.gallery?.[0]?.src || product.gallery?.[0] || "/images/logo.png"}
                      alt={product.name}
                    />
                  </Link>

                  <div className="search-product-card__body">
                    <h3>{product.name}</h3>
                    <p>{product.storyText || product.brandStatement || "Premium everyday essentials."}</p>
                    <div className="search-product-card__meta">
                      <span>{product.category || "Essential"}</span>
                      <span>{product.price ? `₹${product.price}` : "View"}</span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="search-page__empty">
                <p>No products match your search.</p>
              </div>
            )}
          </div>

          <div className="search-page__actions">
            <Link href="/shop" className="search-page__button search-page__button--primary">
              Open shop
            </Link>
            <Link href="/" className="search-page__button">
              Back home
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
