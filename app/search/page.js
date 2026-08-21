import { Suspense } from "react";
import { notFound } from "next/navigation";

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

export default async function SearchPage({ searchParams }) {
  const { q } = await searchParams;
  const query = q || "";

  if (!query.trim()) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <Suspense fallback={<SearchSkeleton />}>
        <SearchResults query={query} />
      </Suspense>
    </>
  );
}