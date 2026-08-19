"use client";

import Link from "next/link";
import { X } from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import { useCart } from "@/lib/shop/commerce";
import "@/components/about/about.css";

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useCart();

  const handleRemove = (item) => {
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
              <span>0</span>
              <small>Pending</small>
            </div>
            <div>
              <span>Ready</span>
              <small>Status</small>
            </div>
          </div>
        </section>

        <section className="wishlist-page__section">
          <h2>Saved essentials</h2>

          {wishlist.length === 0 ? (
            <p className="wishlist-page__empty">
              Your wishlist is empty. Tap the heart on any product to save it here.
            </p>
          ) : (
            <div className="wishlist-page__grid">
              {wishlist.map((item) => (
                <article key={item.id} className="wishlist-product-card">
                  <Link href={`/product/${item.slug}`} className="wishlist-product-card__media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image || "/images/logo.png"} alt={item.name} />
                  </Link>

                  <div className="wishlist-product-card__body">
                    <h3>{item.name}</h3>
                    <p>Save what you love and return when you are ready.</p>
                    <div className="wishlist-product-card__meta">
                      <span>{item.price ? `₹${Number(item.price).toLocaleString("en-IN")}` : "View"}</span>
                      <button
                        type="button"
                        className="wishlist-product-card__remove"
                        onClick={() => handleRemove(item)}
                      >
                        <X size={13} strokeWidth={2} aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="wishlist-page__actions">
            <Link href="/shop" className="wishlist-page__button wishlist-page__button--primary">
              Continue shopping
            </Link>
            <Link href="/" className="wishlist-page__button">
              Home
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}