"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { getCategories, getProducts } from "@/lib/data";
import "./sections.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function ExploreCard({ product, index, exploreLabel }) {
  const cardRef = useRef(null);
  const mediaRef = useRef(null);
  const overlayRef = useRef(null);
  const titleRef = useRef(null);
  const ctaRef = useRef(null);
  const arrowRef = useRef(null);
  const borderRef = useRef(null);

  const swatch = product.colors?.find((c) => c.default) || product.colors?.[0];

  useEffect(() => {
    const card = cardRef.current;
    const media = mediaRef.current;
    const cta = ctaRef.current;
    if (!card || !media) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    gsap.set(media, { scale: 1.02, transformOrigin: "50% 50%" });

    const quickMediaX = canHover
      ? gsap.quickTo(media, "xPercent", { duration: 1, ease: "power3.out" })
      : null;
    const quickMediaY = canHover
      ? gsap.quickTo(media, "yPercent", { duration: 1, ease: "power3.out" })
      : null;
    const quickCtaX = canHover
      ? gsap.quickTo(cta, "x", { duration: 0.5, ease: "power3.out" })
      : null;
    const quickCtaY = canHover
      ? gsap.quickTo(cta, "y", { duration: 0.5, ease: "power3.out" })
      : null;

    const handleMove = (event) => {
      const rect = card.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      quickMediaX?.(nx * -3);
      quickMediaY?.(ny * -3);
      quickCtaX?.(nx * 10);
      quickCtaY?.(ny * 6);
    };

    const handleEnter = () => {
      gsap.to(media, { scale: 1.08, duration: reducedMotion ? 0 : 1.1, ease: "power2.out" });
      gsap.to(overlayRef.current, {
        opacity: 0.82,
        duration: reducedMotion ? 0 : 0.55,
        ease: "power2.out",
      });
      gsap.to(titleRef.current, { y: -6, duration: reducedMotion ? 0 : 0.55, ease: "power2.out" });
      gsap.to(arrowRef.current, { x: 6, duration: reducedMotion ? 0 : 0.45, ease: "power2.out" });
      gsap.to(borderRef.current, { opacity: 1, duration: reducedMotion ? 0 : 0.55, ease: "power2.out" });
      gsap.to(card, {
        y: -4,
        duration: reducedMotion ? 0 : 0.45,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const handleLeave = () => {
      gsap.to(media, { scale: 1.02, duration: reducedMotion ? 0 : 0.9, ease: "power2.out" });
      gsap.to(overlayRef.current, {
        opacity: 0.55,
        duration: reducedMotion ? 0 : 0.55,
        ease: "power2.out",
      });
      gsap.to(titleRef.current, { y: 0, duration: reducedMotion ? 0 : 0.55, ease: "power2.out" });
      gsap.to(arrowRef.current, { x: 0, duration: reducedMotion ? 0 : 0.45, ease: "power2.out" });
      gsap.to(borderRef.current, { opacity: 0, duration: reducedMotion ? 0 : 0.55, ease: "power2.out" });
      gsap.to(card, { y: 0, duration: reducedMotion ? 0 : 0.45, ease: "power2.out", overwrite: "auto" });
      quickMediaX?.(0);
      quickMediaY?.(0);
      quickCtaX?.(0);
      quickCtaY?.(0);
    };

    card.addEventListener("pointermove", handleMove);
    card.addEventListener("pointerenter", handleEnter);
    card.addEventListener("pointerleave", handleLeave);
    card.addEventListener("focus", handleEnter);
    card.addEventListener("blur", handleLeave);

    return () => {
      card.removeEventListener("pointermove", handleMove);
      card.removeEventListener("pointerenter", handleEnter);
      card.removeEventListener("pointerleave", handleLeave);
      card.removeEventListener("focus", handleEnter);
      card.removeEventListener("blur", handleLeave);
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
      gsap.set(card, { autoAlpha: 0, y: 48 });
      gsap.to(card, {
        autoAlpha: 1,
        y: 0,
        duration: 0.95,
        ease: "power3.out",
        delay: index * 0.12,
        scrollTrigger: { trigger: card, start: "top 86%" },
      });
    }, card);

    return () => ctx.revert();
  }, [index]);

  const image = product.gallery?.[0];

  return (
    <Link
      href={`/product/${product.slug}`}
      className="category-card"
      ref={cardRef}
      aria-label={`${product.name} — Explore`}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="category-card__media"
          ref={mediaRef}
          src={typeof image === "string" ? image : image.src}
          alt=""
          aria-hidden="true"
        />
      ) : (
        <div
          className="category-card__placeholder"
          ref={mediaRef}
          aria-hidden="true"
          style={{
            background: `radial-gradient(ellipse 70% 55% at 50% 42%, ${
              swatch?.hex || "var(--wash-gold)"
            }33, transparent 70%), var(--surface-frame)`,
          }}
        >
          <span className="category-card__corner category-card__corner--tl" />
          <span className="category-card__corner category-card__corner--tr" />
          <span className="category-card__corner category-card__corner--bl" />
          <span className="category-card__corner category-card__corner--br" />
        </div>
      )}

      <div className="category-card__overlay" ref={overlayRef} aria-hidden="true" />
      <span className="category-card__border" ref={borderRef} aria-hidden="true" />

      <div className="category-card__content">
        <h3 className="category-card__title" ref={titleRef}>
          {product.name}
        </h3>
        <span className="category-card__cta" ref={ctaRef}>
          <span className="category-card__cta-label">{exploreLabel}</span>
          <ArrowUpRight
            className="category-card__cta-icon"
            ref={arrowRef}
            size={20}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

export default function Categories() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const category = getCategories()[0];
  const products = getProducts();
  const exploreLabel = (category?.ctaLabel || "Explore").replace(/\s+collection$/i, "").trim();

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
      gsap.set(parts, { autoAlpha: 0, y: 20 });
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

  if (!category) return null;

  return (
    <section
      ref={sectionRef}
      className="categories"
      id="solid-t-shirts"
      aria-label={category.title || category.name}
    >
      <div className="categories__container">
        <header className="categories__header" ref={headerRef}>
          <p className="categories__eyebrow" data-reveal>
            {category.name}
          </p>
          <h2 className="categories__title" data-reveal>
            {category.title || category.name}
          </h2>
          {category.description ? (
            <p className="categories__description" data-reveal>
              {category.description}
            </p>
          ) : null}
        </header>

        <div className="categories__grid">
          {products.map((product, index) => (
            <ExploreCard
              key={product.id}
              product={product}
              index={index}
              exploreLabel={exploreLabel}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
