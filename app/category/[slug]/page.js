import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import {
  getCategoriesServer,
  getCategoryBySlugServer,
  getProductsServer,
  getSettingsServer,
} from "@/lib/data";
import "@/components/home/sections.css";

function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function generateStaticParams() {
  const categories = await getCategoriesServer();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategoryBySlugServer(slug);
  const settings = await getSettingsServer();

  return {
    title: category
      ? `${category.seo?.title || category.title || category.name}`
      : `${settings.metaTitle || "Collection"}`,
    description: category?.seo?.description || category?.description || settings.metaDescription,
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = await getCategoryBySlugServer(slug);

  if (!category) {
    notFound();
  }

  const products = (await getProductsServer()).filter(
    (product) => product.categorySlug === category.slug || product.categoryId === category.id
  );

  return (
    <>
      <Navbar />
      <main className="category-landing">
        <div className="category-landing__container">
          <Link href="/" className="category-landing__back">
            <ArrowLeft size={15} strokeWidth={1.5} aria-hidden="true" />
            Back to home
          </Link>

          <p className="category-landing__eyebrow">{category.name}</p>
          <h1 className="category-landing__title">{category.title || category.name}</h1>
          <span className="category-landing__divider" aria-hidden="true" />
          {category.description ? (
            <p className="category-landing__tagline">{category.description}</p>
          ) : null}

          {products.length > 0 ? (
            <section className="shop-page__grid" aria-label={`${category.name} collection`}>
              {products.map((product) => {
                const media = product.gallery?.[0]?.src || "/images/logo.png";
                const price = Number(product.price || 0);
                const comparePrice = Number(product.comparePrice || 0);
                return (
                  <article key={product.id || product.slug} className="shop-product-card">
                    <Link href={`/product/${product.slug}`} className="shop-product-card__media" aria-label={`View ${product.name}`}>
                      <img src={media} alt={product.name} />
                    </Link>

                    <div className="shop-product-card__body">
                      <div className="shop-product-card__meta">
                        <span>{product.category || category.name}</span>
                        <span>{product.colors?.length || 1} colors</span>
                      </div>

                      <h2>
                        <Link href={`/product/${product.slug}`}>{product.name}</Link>
                      </h2>

                      <div className="shop-product-card__price-row">
                        <strong>{formatMoney(price)}</strong>
                        {comparePrice > price ? <span>{formatMoney(comparePrice)}</span> : null}
                      </div>

                      <Link href={`/product/${product.slug}`} className="shop-product-card__button">
                        View Details
                      </Link>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : (
            <div className="studio-table__empty" style={{ marginTop: "1rem" }}>
              <p className="studio-table__empty-title">No products in this collection yet</p>
              <p className="studio-table__empty-copy">Create products in the admin panel and they will appear here automatically.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
