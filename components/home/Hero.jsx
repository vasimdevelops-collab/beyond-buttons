"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

import "./hero.css";
import useHeroTimeline from "./useHeroTimeline";
import HeroVisual from "./HeroVisual";
import { getHomepage } from "@/lib/data";

const GOLD_DUST = ["#D4AF37", "#F1D37B", "#C9A227"];

function createDustMote(width, height, seedTop = false) {
  return {
    x: Math.random() * width,
    y: seedTop ? Math.random() * height : height + Math.random() * 40,
    size: 0.6 + Math.random() * 1.6,
    speed: 0.06 + Math.random() * 0.16,
    drift: Math.random() * Math.PI * 2,
    driftSpeed: 0.002 + Math.random() * 0.004,
    opacity: 0.12 + Math.random() * 0.28,
    color: GOLD_DUST[Math.floor(Math.random() * GOLD_DUST.length)],
  };
}

// Slow, continuous ambient dust for the Hero's studio atmosphere — distinct
// from the Intro's impact/trail bursts, this loop never stops or empties.
function useAmbientDust(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return undefined;

    const ctx = canvas.getContext("2d");
    let motes = [];
    let rafId = null;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = width < 640 ? 22 : width < 1200 ? 36 : 52;
      motes = Array.from({ length: count }, () => createDustMote(width, height, true));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const mote of motes) {
        mote.y -= mote.speed;
        mote.drift += mote.driftSpeed;
        mote.x += Math.sin(mote.drift) * 0.15;

        if (mote.y < -10) {
          Object.assign(mote, createDustMote(width, height, false));
          mote.y = height + 10;
        }

        ctx.globalAlpha = mote.opacity;
        ctx.fillStyle = mote.color;
        ctx.beginPath();
        ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(draw);
    };

    resize();
    rafId = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, [canvasRef]);
}

export default function Hero() {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const [liveHomepage, setLiveHomepage] = useState(getHomepage());

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/site/homepage", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (active && payload?.hero) {
          setLiveHomepage(payload);
        }
      } catch {
        // Ignore fetch failures and keep the static fallback intact.
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useHeroTimeline(rootRef);
  useAmbientDust(canvasRef);

  const hero = liveHomepage?.hero || getHomepage().hero;
  const headlineLines = Array.isArray(hero?.headlineLines) && hero.headlineLines.length > 0
    ? hero.headlineLines
    : ["We define presence.", "The perfect solid shirt."];
  const subtitleLines = Array.isArray(hero?.subtitleLines) && hero.subtitleLines.length > 0
    ? hero.subtitleLines
    : ["Crafted with premium fabrics,", "timeless tailoring,", "and confidence in every stitch."];
  const primaryButton = hero?.buttons?.primary || { label: "Shop Collection", href: "/shop" };
  const secondaryButton = hero?.buttons?.secondary || { label: "Our Story", href: "/about" };

  return (
    <section className="hero" ref={rootRef} aria-label="Beyond Buttons — presence, defined">
      <div className="hero__backdrop" aria-hidden="true" />
      <canvas className="hero__dust" ref={canvasRef} aria-hidden="true" />

      <div className="hero__container">
        <div className="hero__content">
          <p className="hero__label">{hero?.label || "Beyond Buttons"}</p>

          <h1 className="hero__headline">
            {headlineLines.map((line) => (
              <span key={line} className="hero__line">{line}</span>
            ))}
          </h1>

          <p className="hero__subtitle">
            {subtitleLines.map((line, index) => (
              <span key={`${line}-${index}`}>
                {index > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </p>

          <div className="hero__actions">
            <Link href={primaryButton.href || "/shop"} className="hero__cta hero__cta--primary">
              <span className="hero__cta-glow" aria-hidden="true" />
              <span className="hero__cta-label">{primaryButton.label || "Shop Collection"}</span>
              <ArrowRight className="hero__cta-icon" size={18} strokeWidth={1.5} aria-hidden="true" />
            </Link>

            <Link href={secondaryButton.href || "/about"} className="hero__cta hero__cta--secondary">
              <span className="hero__link-label">{secondaryButton.label || "Our Story"}</span>
              <span className="hero__link-underline" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <HeroVisual
          media={{
            type: hero?.media?.type || "image",
            src: hero?.media?.src || "/images/homeback.jpeg",
            alt: hero?.media?.alt || "Beyond Buttons — presence, defined",
          }}
        />
      </div>

      <div className="hero__scroll-cue">
        <span className="hero__scroll-track">
          <span className="hero__scroll-dot" />
        </span>
        <span className="hero__scroll-label">{hero?.scrollLabel || "Scroll"}</span>
      </div>
    </section>
  );
}
