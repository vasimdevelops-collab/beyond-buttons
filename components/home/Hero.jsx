"use client";

import { useEffect, useState } from "react";

import HeroLegacy from "./HeroLegacy";
import HeroFilmstrip from "./HeroFilmstrip";
import "./hero-filmstrip.css";

/**
 * Homepage hero — shows the admin-managed hero filmstrip when active slides
 * exist, otherwise falls back to the legacy static hero so the page never
 * breaks when the catalog has no slides yet.
 */
export default function Hero() {
  const [slides, setSlides] = useState([]);
  const [mode, setMode] = useState("loading"); // "loading" | "filmstrip" | "legacy"

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/site/hero-slides", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load hero slides");
        const payload = await response.json();
        if (!active) return;
        const list = Array.isArray(payload?.slides)
          ? payload.slides.filter((slide) => slide && slide.media?.src)
          : [];
        setSlides(list);
        setMode(list.length ? "filmstrip" : "legacy");
      } catch {
        if (active) setMode("legacy");
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  if (mode === "filmstrip") {
    return <HeroFilmstrip slides={slides} />;
  }

  if (mode === "legacy") {
    return <HeroLegacy />;
  }

  // Loading placeholder — solid backdrop so the hero doesn't flash empty.
  return <div className="hero-filmstrip hero-filmstrip--loading" aria-hidden="true" />;
}