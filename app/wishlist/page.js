"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import { useCart } from "@/lib/shop/commerce";
import { getProductBySlug } from "@/lib/data";
import "@/components/about/about.css";

function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addItem } = useCart();

  const handleRemove = (item) => {
    toggleWishlist(item);
  };

  const handleMoveToBag = (item) => {
    const product = getProductBySlug(item.slug);
    const defaultColor =
      product?.colors?.find((color) => color.default) || product?.colors?.[0] || null;
    const size = defaultColor?.sizes?.[0]?.size || product?.sizes?.[0] || "";

    if (!size) {
      window.location.href = `/product/${item.slug}`;
      return;
    }

    addItem({
      productId: item.id,
      slug: item.slug,
      name: item.name,
      image: item.image,
      color: defaultColor?.name || "",
      size,
    });
    toggleWishlist(item);
  };

  return (
    <>
      <Navbar />

      <main className="wishlist-page">
        <section className="wishlist-page__hero">
          <div>
            <p className="wishlist-page__eyebrow">Wishlist</p>
            <h1>Your saved pieces, kept close.</h1>
            <p>
              Save what you love and return when you are ready to build your next refined rotation.
            </p>
          </div>

          <div className="wishlist-page__meta">
            <div>
              <span>{wishlist.length}</span>
              <small>Saved</small>
            </div>
            <div>
              <span>{wishlist.length > 0 ? "Ready" : "—"}</span>
              <small>Status</small>
            </div>
          </div>
        </section>

        <section className="wishlist-page__section">
          <h2>Saved essentials</h2>

          {wishlist.length === 0 ? (
            <div className="wishlist-page__empty">
              <p>Your wishlist is empty. Tap the heart on any product to save it here.</p>
              <Link href="/#shop" className="wishlist-page__button wishlist-page__button--primary">
                Discover pieces
              </Link>
            </div>
          ) : (
            <>
              <div className="wishlist-page__grid">
                {wishlist.map((item) => {
                  const product = getProductBySlug(item.slug);
                  const comparePrice = product?.comparePrice || null;

                  return (
                    <article key={item.id} className="wishlist-product-card">
                      <Link
                        href={`/product/${item.slug}`}
                        className="wishlist-product-card__media"
                        tabIndex={-1}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image || "/images/logo.png"} alt={item.name} />
                        <button
                          type="button"
                          className="wishlist-product-card__heart"
                          aria-label={`Remove ${item.name} from wishlist`}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleRemove(item);
                          }}
                        >
                          <Heart size={16} strokeWidth={1.6} fill="currentColor" aria-hidden="true" />
                        </button>
                      </Link>

                      <div className="wishlist-product-card__body">
                        <Link href={`/product/${item.slug}`} className="wishlist-product-card__title">
                          {item.name}
                        </Link>
                        <div className="wishlist-product-card__price-row">
                          <strong>{formatPrice(item.price) || "View"}</strong>
                          {comparePrice ? <span>{formatPrice(comparePrice)}</span> : null}
                        </div>
                        <button
                          type="button"
                          className="wishlist-product-card__bag"
                          onClick={() => handleMoveToBag(item)}
                        >
                          <ShoppingBag size={15} strokeWidth={1.6} aria-hidden="true" />
                          Move to Bag
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="wishlist-page__actions">
                <Link href="/#shop" className="wishlist-page__button wishlist-page__button--primary">
                  Continue shopping
                </Link>
                <Link href="/" className="wishlist-page__button">
                  Home
                </Link>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}