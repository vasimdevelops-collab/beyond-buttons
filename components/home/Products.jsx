"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Shirt } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import {
  getCategories,
  getFeaturedProducts,
  getHomepage,
} from "@/lib/data";
import "./sections.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function ProductCard({ product, index }) {
  const cardRef = useRef(null);
  const frameRef = useRef(null);
  const visualRef = useRef(null);
  const sheenRef = useRef(null);

  const image = product.gallery?.[0];
  const imageSrc = typeof image === "string" ? image : image?.src;
  const rating = product.rating;
  const hasRating = rating != null && rating !== "";

  useEffect(() => {
    const card = cardRef.current;
    const frame = frameRef.current;
    const visual = visualRef.current;
    if (!card || !frame) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover) return undefined;

    const qRotateY = gsap.quickTo(frame, "rotateY", { duration: 0.55, ease: "power3.out" });
    const qRotateX = gsap.quickTo(frame, "rotateX", { duration: 0.55, ease: "power3.out" });
    const qVisualX = visual
      ? gsap.quickTo(visual, "xPercent", { duration: 0.7, ease: "power3.out" })
      : null;
    const qVisualY = visual
      ? gsap.quickTo(visual, "yPercent", { duration: 0.7, ease: "power3.out" })
      : null;

    const onMove = (event) => {
      const rect = card.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      qRotateY(nx * 4.5);
      qRotateX(ny * -3.5);
      qVisualX?.(nx * -2);
      qVisualY?.(ny * -1.6);
      if (sheenRef.current) {
        gsap.to(sheenRef.current, {
          x: nx * 80,
          opacity: 0.35,
          duration: 0.4,
          overwrite: "auto",
        });
      }
    };

    const onEnter = () => {
      gsap.to(card, {
        y: -6,
        duration: reducedMotion ? 0 : 0.45,
        ease: "power2.out",
        overwrite: "auto",
      });
      gsap.to(frame, {
        boxShadow: "0 22px 48px var(--shadow-strong), 0 0 0 1px var(--hairline-gold-strong)",
        duration: reducedMotion ? 0 : 0.45,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const onLeave = () => {
      qRotateY(0);
      qRotateX(0);
      qVisualX?.(0);
      qVisualY?.(0);
      gsap.to(card, { y: 0, duration: reducedMotion ? 0 : 0.45, ease: "power2.out", overwrite: "auto" });
      gsap.to(frame, {
        boxShadow: "var(--shadow-card)",
        duration: reducedMotion ? 0 : 0.45,
        ease: "power2.out",
        overwrite: "auto",
      });
      if (sheenRef.current) {
        gsap.to(sheenRef.current, { opacity: 0, duration: 0.35, overwrite: "auto" });
      }
    };

    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("pointerleave", onLeave);

    return () => {
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(card, { autoAlpha: 1, y: 0 });
        return;
      }
      gsap.set(card, { autoAlpha: 0, y: 40 });
      gsap.to(card, {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        delay: index * 0.1,
        scrollTrigger: { trigger: card, start: "top 88%" },
      });
    }, card);

    return () => ctx.revert();
  }, [index]);

  return (
    <article className="product-card" ref={cardRef}>
      <div className="product-card__visual">
        <div className="product-card__frame" ref={frameRef}>
          <span className="product-card__rim" aria-hidden="true" />
          <span className="product-card__sheen" ref={sheenRef} aria-hidden="true" />

          <div className="product-card__media" ref={visualRef}>
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="product-card__image" src={imageSrc} alt="" />
            ) : (
              <div className="product-card__placeholder" aria-hidden="true">
                <span className="product-card__corner product-card__corner--tl" />
                <span className="product-card__corner product-card__corner--tr" />
                <span className="product-card__corner product-card__corner--bl" />
                <span className="product-card__corner product-card__corner--br" />
                <Shirt className="product-card__placeholder-icon" size={38} strokeWidth={1} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="product-card__info">
        <h3 className="product-card__name">{product.name}</h3>

        <p
          className={`product-card__rating${hasRating ? "" : " product-card__rating--placeholder"}`}
          aria-label={hasRating ? `Rated ${rating} out of 5` : "Rating coming soon"}
        >
          {hasRating ? (
            <span>{Number(rating).toFixed(1)} / 5</span>
          ) : (
            <span aria-hidden="true">★★★★★</span>
          )}
        </p>

        <Link
          href={`/product/${product.slug}`}
          className="product-card__cta"
          aria-label={`View details for ${product.name}`}
        >
          View Details
        </Link>
      </div>
    </article>
  );
}

export default function Products() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const [products, setProducts] = useState(() => getFeaturedProducts());
  const category = getCategories()[0];
  const homepage = getHomepage();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site/products", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data?.products) && data.products.length > 0) {
          setProducts(data.products);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const title = category?.title || category?.name || homepage.headings?.products?.title;
  const description = category?.description || homepage.headings?.products?.description;

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const parts = header.querySelectorAll("[data-reveal]");

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(parts, { autoAlpha: 1, y: 0 });
        return;
      }
      gsap.set(parts, { autoAlpha: 0, y: 18 });
      gsap.to(parts, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: header, start: "top 88%" },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className="products"
      ref={sectionRef}
      id="shop"
      aria-label={title || "Products"}
    >
      <style>{`
        .product-card {
          text-decoration: none;
          color: inherit;
        }
        .product-card__rating {
          margin: 0;
          font: 600 11px/1.2 var(--font-body);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--goldLight);
        }
        .product-card__rating--placeholder {
          color: var(--text-muted);
          letter-spacing: 0.28em;
          opacity: 0.72;
        }
        .product-card__cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          align-self: flex-start;
          margin-top: 14px;
          padding: 12px 22px;
          border: 1px solid var(--btn-primary-border);
          border-radius: 999px;
          background: var(--btn-primary-bg);
          color: var(--btn-primary-text);
          font: 600 11px/1 var(--font-body);
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          box-shadow: var(--btn-primary-shadow);
          transition: border-color var(--duration-hover) var(--ease-luxury),
            box-shadow var(--duration-hover) var(--ease-luxury),
            color var(--duration-hover) var(--ease-luxury);
        }
        .product-card__cta:hover,
        .product-card__cta:focus-visible {
          border-color: var(--btn-primary-hover-border);
          box-shadow: var(--btn-primary-hover-shadow);
          color: var(--goldLight);
          outline: none;
        }
      `}</style>

      <div className="products__backdrop" aria-hidden="true" />

      <div className="products__container">
        <div className="products__header" ref={headerRef}>
          {category?.name ? (
            <p className="products__eyebrow" data-reveal>
              {category.name}
            </p>
          ) : null}
          <h2 className="products__title" data-reveal>
            {title}
          </h2>
          <span className="products__divider" data-reveal aria-hidden="true" />
          {description ? (
            <p className="products__subtitle" data-reveal>
              {description}
            </p>
          ) : null}
        </div>

        <div className="products__grid">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
