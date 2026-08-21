"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { Shirt } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./product-card.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Shared product card used in every product grid (homepage, category listing,
 * shop/search). Flex column so every card in a row is the same height, a fixed
 * aspect-ratio image keeps visuals uniform, and margin-top:auto pins the CTA to
 * the bottom of the card regardless of how long the product title wraps.
 */
export default function ProductCard({ product, index = 0 }) {
  const cardRef = useRef(null);
  const frameRef = useRef(null);
  const visualRef = useRef(null);
  const sheenRef = useRef(null);

  const image = product.gallery?.[0];
  const imageSrc = typeof image === "string" ? image : image?.src;
  const rating = product.rating;
  const hasRating = rating != null && rating !== "";

  const price = Number(product.price || 0);
  const comparePrice = Number(product.comparePrice || 0);

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

    // Cap the stagger so long grids don't build up a big delay.
    const delay = Math.min(index, 8) * 0.09;

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
        delay,
        scrollTrigger: { trigger: card, start: "top 88%" },
      });
    }, card);

    return () => ctx.revert();
  }, [index]);

  return (
    <article className="product-card" ref={cardRef}>
      <Link
        className="product-card__visual"
        href={`/product/${product.slug}`}
        aria-label={`View details for ${product.name}`}
        tabIndex={-1}
      >
        <div className="product-card__frame" ref={frameRef}>
          <span className="product-card__sheen" ref={sheenRef} aria-hidden="true" />

          <div className="product-card__media" ref={visualRef}>
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="product-card__image" src={imageSrc} alt="" loading="lazy" />
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
      </Link>

      <div className="product-card__info">
        <h3 className="product-card__name">{product.name}</h3>

        {price > 0 ? (
          <p className="product-card__price">
            <strong>{formatMoney(price)}</strong>
            {comparePrice > price ? <s>{formatMoney(comparePrice)}</s> : null}
          </p>
        ) : null}

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