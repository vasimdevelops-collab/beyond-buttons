import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import ProductCard from "@/components/product/ProductCard";
import { getCategoriesServer, getProductsServer, getSettingsServer } from "@/lib/data";
import "@/components/shop/shopping.css";

export default async function ShopPage({ searchParams }) {
  const { q = "", category = "", color = "" } = await searchParams;

  const [products, allCategories, settings] = await Promise.all([
    getProductsServer(),
    getCategoriesServer(),
    getSettingsServer(),
  ]);

  const activeCategory = allCategories.find(
    (item) => item.slug === category || item.name?.toLowerCase() === category.toLowerCase()
  );

  const query = String(q || "").trim().toLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);

  const visibleProducts = products.filter((product) => {
    if (product.status != null && product.status !== "active") return false;

    if (activeCategory) {
      const productCategory = String(product.category || "").toLowerCase();
      if (productCategory !== activeCategory.name.toLowerCase()) return false;
    }

    if (color) {
      const matchesColor = (product.colors || []).some(
        (entry) => entry.name && entry.name.toLowerCase() === color.toLowerCase()
      );
      if (!matchesColor) return false;
    }

    if (terms.length > 0) {
      const haystack = [
        product.name,
        product.shortName,
        product.category,
        product.brandStatement,
        product.storyText,
        ...(product.colors || []).map((entry) => entry.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!terms.every((term) => haystack.includes(term))) return false;
    }

    return true;
  });

  const firstCategory = activeCategory?.name || allCategories[0]?.name || "Essentials";

  return (
    <>
      <Navbar />

      <main className="shop-page">
        <section className="shop-page__hero">
          <div className="shop-page__hero-copy">
            <p className="shop-page__eyebrow">Curated essentials</p>
            <h1>Shop the collection</h1>
            <p>
              Refined silhouettes, tonal layers, and everyday staples designed to move
              effortlessly through the day.
            </p>
          </div>
          <div className="shop-page__hero-meta">
            <div>
              <span>{visibleProducts.length}+</span>
              <small>pieces</small>
            </div>
            <div>
              <span>{allCategories.length}</span>
              <small>categories</small>
            </div>
            <div>
              <span>{settings.currency || "INR"}</span>
              <small>pricing</small>
            </div>
          </div>
        </section>

        <section className="shop-page__toolbar" aria-label="Shop filters">
          <div className="shop-page__filter-group" role="tablist" aria-label="Product categories">
            <Link href="/shop" className={`shop-page__chip${activeCategory || query ? "" : " is-active"}`}>
              All
            </Link>
            {allCategories.slice(0, 5).map((item) => (
              <Link
                key={item.slug}
                href={`/shop?category=${item.slug}`}
                className={`shop-page__chip${activeCategory?.slug === item.slug ? " is-active" : ""}`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="shop-page__summary">
            {query ? (
              <span>Results for &ldquo;{q}&rdquo;</span>
            ) : color ? (
              <span>{color}</span>
            ) : (
              <span>Featured collection</span>
            )}
            <strong>{visibleProducts.length} piece{visibleProducts.length === 1 ? "" : "s"}</strong>
          </div>
        </section>

        <section className="shop-page__grid" aria-label="Shop products">
          {visibleProducts.map((product, index) => (
            <ProductCard key={product.id || product.slug} product={product} index={index} />
          ))}
        </section>
      </main>
    </>
  );
}
