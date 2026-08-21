"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ArrowUpRight } from "lucide-react";

import { getCategories, getHomepage, getProducts } from "@/lib/data";

/** Flat Shop menu entries — kept for the mobile drawer's Collections list. */
export function getShopMenuItems() {
  const categories = getCategories();
  const products = getProducts();
  const homepage = getHomepage();
  const items = [];

  categories.forEach((category) => {
    items.push({
      id: category.id || category.slug,
      label: category.name || category.title,
      detail: category.description || "",
      href: category.href || `/category/${category.slug}`,
      kind: "category",
    });
  });

  products.forEach((product) => {
    items.push({
      id: product.id || product.slug,
      label: product.name,
      detail: product.brandStatement || product.storyText || "",
      href: `/product/${product.slug}`,
      kind: "product",
    });
  });

  const primary = categories[0];
  const exploreHref =
    primary?.href ||
    (primary?.slug ? `/category/${primary.slug}` : null) ||
    homepage?.collections?.[0]?.href ||
    "/category/solid-t-shirts";
  const exploreLabel = primary?.ctaLabel || "Explore Collection";

  items.push({
    id: "explore-collection",
    label: exploreLabel,
    detail: primary?.title || primary?.name || "Browse the edit",
    href: exploreHref,
    kind: "explore",
  });

  return items;
}

/** @deprecated Use getShopMenuItems — kept for MobileDrawer compatibility */
export const SHOP_CATEGORIES = getShopMenuItems();

function productImage(product) {
  return product.gallery?.[0]?.src || product.gallery?.[0] || null;
}

export default function MegaMenu({ isOpen, onNavigate }) {
  const menuRef = useRef(null);
  const zonesRef = useRef(null);
  const products = useMemo(() => getProducts(), []);
  const feature = products[0] || null;
  const featured = products.slice(0, 4);

  const categories = useMemo(() => {
    const map = new Map();
    getCategories().forEach((category) => {
      if (category.published === false) return;
      const href = category.href || `/category/${category.slug}`;
      if (!map.has(href)) map.set(href, { label: category.name || category.title, href });
    });
    products.forEach((product) => {
      if (!product.category || !product.categorySlug) return;
      const href = `/category/${product.categorySlug}`;
      if (!map.has(href)) map.set(href, { label: product.category, href });
    });
    return [...map.values()];
  }, [products]);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    const zones = zonesRef.current?.children;

    gsap.set(menu, { autoAlpha: 0, y: 8, pointerEvents: "none" });
    gsap.set(zones, { autoAlpha: 0, y: 10 });

    return () => {
      gsap.killTweensOf([menu, zones]);
    };
  }, []);

  useEffect(() => {
    const menu = menuRef.current;
    const zones = zonesRef.current?.children;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 0 : 0.25;

    gsap.killTweensOf([menu, zones]);

    if (isOpen) {
      gsap.set(menu, { visibility: "visible", pointerEvents: "auto" });
      gsap
        .timeline()
        .to(menu, { autoAlpha: 1, y: 0, duration, ease: "power2.out" })
        .to(
          zones,
          {
            autoAlpha: 1,
            y: 0,
            duration: reducedMotion ? 0 : 0.28,
            stagger: reducedMotion ? 0 : 0.05,
            ease: "power2.out",
          },
          reducedMotion ? 0 : "-=0.18"
        );
      return;
    }

    gsap
      .timeline({
        onComplete: () => gsap.set(menu, { visibility: "hidden" }),
      })
      .to(zones, {
        autoAlpha: 0,
        y: 6,
        duration: reducedMotion ? 0 : 0.16,
        stagger: reducedMotion ? 0 : 0.02,
        ease: "power2.out",
      })
      .to(
        menu,
        {
          autoAlpha: 0,
          y: 8,
          pointerEvents: "none",
          duration: reducedMotion ? 0 : 0.26,
          ease: "power2.out",
        },
        reducedMotion ? 0 : "-=0.1"
      );
  }, [isOpen]);

  return (
    <div
      ref={menuRef}
      className="luxury-mega"
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <div className="luxury-mega__inner">
        <div className="luxury-mega__header">
          <div>
            <p className="luxury-mega__eyebrow">Shop</p>
            <h2>Find your signature solid</h2>
          </div>
          <Link className="luxury-mega__view-all" href="/shop" onClick={onNavigate}>
            View all products
            <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.5} />
          </Link>
        </div>

        <div ref={zonesRef} className="luxury-mega__body">
          <nav className="luxury-mega__cats" aria-label="Shop categories">
            <h3 className="luxury-mega__zone-title">Categories</h3>
            <ul>
              {categories.map((category, index) => (
                <li key={category.href}>
                  <Link href={category.href} onClick={onNavigate}>
                    <span className="luxury-mega__cat-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="luxury-mega__cat-label">{category.label}</span>
                    <ArrowUpRight
                      className="luxury-mega__cat-arrow"
                      aria-hidden="true"
                      size={15}
                      strokeWidth={1.5}
                    />
                  </Link>
                </li>
              ))}
            </ul>
            <Link className="luxury-mega__cats-all" href="/shop" onClick={onNavigate}>
              Browse everything
              <span aria-hidden="true">→</span>
            </Link>
          </nav>

          <div className="luxury-mega__products">
            <h3 className="luxury-mega__zone-title">Featured</h3>
            <ul className="luxury-mega__product-list">
              {featured.map((product) => (
                <li key={product.slug}>
                  <Link
                    className="luxury-mega__product"
                    href={`/product/${product.slug}`}
                    onClick={onNavigate}
                  >
                    <span className="luxury-mega__product-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={productImage(product) || "/images/logo.png"} alt="" />
                    </span>
                    <span className="luxury-mega__product-meta">
                      <strong>{product.name}</strong>
                      <small>{product.category}</small>
                    </span>
                    <span className="luxury-mega__product-price">₹{product.price}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {feature ? (
            <Link
              className="luxury-mega__feature"
              href={`/product/${feature.slug}`}
              onClick={onNavigate}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={productImage(feature) || "/images/logo.png"} alt={feature.name} />
              <span className="luxury-mega__feature-overlay">
                <span className="luxury-mega__feature-eyebrow">Signature</span>
                <strong>{feature.name}</strong>
                <span className="luxury-mega__feature-cta">
                  Shop now <span aria-hidden="true">→</span>
                </span>
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}