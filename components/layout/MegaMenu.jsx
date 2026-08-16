"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ArrowUpRight } from "lucide-react";

import { getCategories, getHomepage, getProducts } from "@/lib/data";

/** Shop mega-menu entries — categories + products + explore CTA from data. */
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

export default function MegaMenu({ isOpen, onNavigate }) {
  const menuRef = useRef(null);
  const cardsRef = useRef(null);
  const items = useMemo(() => getShopMenuItems(), []);
  const explore = items.find((item) => item.kind === "explore") || items[items.length - 1];

  useLayoutEffect(() => {
    const menu = menuRef.current;
    const cards = cardsRef.current?.children;

    gsap.set(menu, { autoAlpha: 0, y: 8, pointerEvents: "none" });
    gsap.set(cards, { autoAlpha: 0, y: 10 });

    return () => {
      gsap.killTweensOf([menu, cards]);
    };
  }, []);

  useEffect(() => {
    const menu = menuRef.current;
    const cards = cardsRef.current?.children;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 0 : 0.25;

    gsap.killTweensOf([menu, cards]);

    if (isOpen) {
      gsap.set(menu, { visibility: "visible", pointerEvents: "auto" });
      gsap
        .timeline()
        .to(menu, { autoAlpha: 1, y: 0, duration, ease: "power2.out" })
        .to(
          cards,
          {
            autoAlpha: 1,
            y: 0,
            duration: reducedMotion ? 0 : 0.28,
            stagger: reducedMotion ? 0 : 0.035,
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
      .to(cards, {
        autoAlpha: 0,
        y: 6,
        duration: reducedMotion ? 0 : 0.16,
        stagger: reducedMotion ? 0 : 0.015,
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
            <h2>Explore the collection</h2>
          </div>
          {explore ? (
            <Link
              className="luxury-mega__view-all"
              href={explore.href}
              onClick={onNavigate}
            >
              {explore.label}
              <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.5} />
            </Link>
          ) : null}
        </div>

        <div ref={cardsRef} className="luxury-mega__grid">
          {items.map((item, index) => (
            <Link
              key={item.id || item.label}
              className="luxury-mega__card"
              href={item.href}
              onClick={onNavigate}
            >
              <span className="luxury-mega__number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="luxury-mega__card-copy">
                <strong>{item.label}</strong>
                {item.detail ? <small>{item.detail}</small> : null}
              </span>
              <ArrowUpRight
                className="luxury-mega__card-icon"
                aria-hidden="true"
                size={18}
                strokeWidth={1.25}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
