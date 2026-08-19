import Link from "next/link";
import { notFound } from "next/navigation";

import Navbar from "@/components/layout/Navbar";
import CategoryCatalog from "@/components/category/CategoryCatalog";
import {
  getCategoriesServer,
  getCategoryBySlugServer,
  getProductsServer,
  getSettingsServer,
} from "@/lib/data";
import "@/components/category/category.css";

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

  // Match by the canonical, unchanged category identifier (slug/id) — never by a
  // display label string that copy edits can rename. Products reattached to
  // `solid-t-shirts` by scripts/sync-catalog-data.mjs (step 9).
  const products = (await getProductsServer()).filter(
    (product) => product.categorySlug === category.slug || product.categoryId === category.id
  );

  return (
    <>
      <Navbar />
      <main className="category-catalog-page">
        <div className="category-catalog-page__container">
          <nav className="category-catalog-page__breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span>{category.name}</span>
          </nav>

          <p className="category-catalog-page__eyebrow">{category.name}</p>
          <h1 className="category-catalog-page__title">{category.title || category.name}</h1>
          {category.description ? (
            <p className="category-catalog-page__tagline">{category.description}</p>
          ) : null}

          <CategoryCatalog category={category} products={products} />
        </div>
      </main>
    </>
  );
}