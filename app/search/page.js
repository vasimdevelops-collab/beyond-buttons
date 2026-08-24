import { Suspense } from "react";
import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import SearchResults from "./SearchResults";
import "@/components/category/category.css";

export async function generateMetadata({ searchParams }) {
  const { q } = await searchParams;
  const query = q || "";
  return {
    title: query ? `Search: "${query}"` : "Search",
    description: query
      ? `Search results for "${query}"`
      : "Search for products",
  };
}

function SearchSkeleton() {
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

function SearchEmptyState() {
  return (
    <main className="category-catalog-page">
      <div className="category-catalog-page__container">
        <nav className="category-catalog-page__breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Search</span>
        </nav>

        <p className="category-catalog-page__eyebrow">Search</p>
        <h1 className="category-catalog-page__title">Find your next favourite</h1>
        <p className="category-catalog-page__tagline">
          Use the search box in the header to look across our entire catalogue.
        </p>

        <div className="search-empty__actions">
          <Link href="/shop" className="search-empty__cta">Browse the shop</Link>
          <Link href="/track" className="search-empty__link">Track an order</Link>
        </div>
      </div>
    </main>
  );
}

export default async function SearchPage({ searchParams }) {
  const { q } = await searchParams;
  const query = q || "";

  return (
    <>
      <Navbar />
      {query.trim() ? (
        <Suspense fallback={<SearchSkeleton />}>
          <SearchResults query={query} />
        </Suspense>
      ) : (
        <SearchEmptyState />
      )}
    </>
  );
}