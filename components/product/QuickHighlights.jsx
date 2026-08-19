"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./product-phase-c.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function hasValue(value) {
  return value != null && String(value).trim() !== "";
}

function formatLabel(key = "") {
  return String(key)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function collectHighlights({ highlights, fit }) {
  const cards = [];

  if (Array.isArray(highlights)) {
    highlights.forEach((entry) => {
      if (typeof entry === "string" && hasValue(entry)) {
        cards.push({ label: "Detail", value: entry.trim() });
        return;
      }
      if (!entry || typeof entry !== "object") return;
      const label = entry.label || entry.name || entry.key;
      const value = entry.value ?? entry.detail ?? entry.text;
      if (hasValue(label) && hasValue(value)) {
        cards.push({ label: String(label).trim(), value: String(value).trim() });
      }
    });
  } else if (highlights && typeof highlights === "object") {
    Object.entries(highlights).forEach(([key, value]) => {
      if (hasValue(value)) {
        cards.push({ label: formatLabel(key), value: String(value).trim() });
      }
    });
  }

  // NOTE: fabric composition is intentionally NOT merged here — it is shown
  // once, cleanly, in "The Fabric" section on the same page. Only unique
  // details (fit, product highlights) are collected below.

  const fitType =
    (typeof fit === "string" && fit) ||
    fit?.type ||
    fit?.fit ||
    fit?.name ||
    "";
  if (hasValue(fitType)) {
    const label = "Fit";
    const value = String(fitType).trim();
    if (!cards.some((card) => card.label === label && card.value === value)) {
      cards.push({ label, value });
    }
  }

  return cards;
}

export default function QuickHighlights({ highlights = null, fit = null }) {
  const rootRef = useRef(null);
  const cards = collectHighlights({ highlights, fit });

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !cards.length) return undefined;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return undefined;

    const ctx = gsap.context(() => {
      const items = root.querySelectorAll("[data-highlight-card]");
      gsap.set(items, { y: 28, opacity: 0, force3D: true });
      gsap.to(items, {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.08,
        ease: "power2.out",
        force3D: true,
        scrollTrigger: {
          trigger: root,
          start: "top 82%",
          once: true,
        },
      });
    }, root);

    return () => ctx.revert();
  }, [cards.length]);

  if (!cards.length) return null;

  return (
    <section
      ref={rootRef}
      className="phase-c phase-c--highlights"
      aria-labelledby="quick-highlights-title"
    >
      <header className="phase-c__header">
        <span className="phase-c__eyebrow">Details</span>
        <h2 id="quick-highlights-title">Quick Product Highlights</h2>
        <p className="phase-c__support">
          The essentials, drawn only from what this piece carries.
        </p>
      </header>

      <ul className="highlight-cards">
        {cards.map((card) => (
          <li className="highlight-card" data-highlight-card key={`${card.label}-${card.value}`}>
            <span className="highlight-card__label">{card.label}</span>
            <strong className="highlight-card__value">{card.value}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
