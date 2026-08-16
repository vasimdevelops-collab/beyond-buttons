import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import { getCategoriesServer, getProductsServer, getSettingsServer } from "@/lib/data";
import "@/components/shop/shopping.css";

function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function ShopPage() {
  const [products, categories, settings] = await Promise.all([
    getProductsServer(),
    getCategoriesServer(),
    getSettingsServer(),
  ]);

  const firstCategory = categories[0]?.name || "Essentials";
  const visibleProducts = products.filter(
    (product) => product.status == null || product.status === "active"
  );

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
              <span>{categories.length}</span>
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
            <span className="shop-page__chip is-active">All</span>
            {categories.slice(0, 5).map((category) => (
              <span key={category.slug} className="shop-page__chip">
                {category.name}
              </span>
            ))}
          </div>

          <div className="shop-page__summary">
            <span>Featured collection</span>
            <strong>{firstCategory}</strong>
          </div>
        </section>

        <section className="shop-page__grid" aria-label="Shop products">
          {visibleProducts.map((product) => {
            const image = product.gallery?.[0]?.src || product.gallery?.[0] || "/images/logo.png";
            const price = Number(product.price || 0);
            const comparePrice = Number(product.comparePrice || price || 0);

            return (
              <article key={product.id || product.slug} className="shop-product-card">
                <Link href={`/product/${product.slug}`} className="shop-product-card__media" aria-label={`View ${product.name}`}>
                  <img src={image} alt={product.name} />
                </Link>

                <div className="shop-product-card__body">
                  <div className="shop-product-card__meta">
                    <span>{product.category || "Essential"}</span>
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
      </main>
    </>
  );
}
