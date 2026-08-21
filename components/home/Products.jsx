"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import ProductCard from "@/components/product/ProductCard";
import {
  getCategories,
  getFeaturedProducts,
  getHomepage,
} from "@/lib/data";
import "./sections.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
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
        if (!cancelled && Array.isArray(data?.products)) {
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
        .products__grid {
          align-items: stretch;
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
