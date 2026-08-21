"use client";

import { useEffect, useState } from "react";
import "./hero-filmstrip.css";

// Seconds for one full image set to scroll past the viewport. The track is
// rendered twice and translated -50%, so this is the seamless loop length.
const LOOP_DURATION = 48;
// On mobile each slide advances one at a time; hold time per slide.
const MOBILE_HOLD = 4600;

/**
 * Homepage hero.
 *
 * Desktop — a continuously auto-scrolling horizontal filmstrip. Multiple
 * images are visible side by side; the whole row drifts left at a slow
 * constant speed forever. The image list is duplicated so the -50%
 * translate loop restarts invisibly.
 *
 * Mobile (<=767px) — a 1-by-1 swipe carousel: one full-viewport slide at a
 * time, auto-advancing with dot navigation, at the same tall hero height as
 * desktop. Reduced-motion users get a static row via CSS.
 */
export default function HeroFilmstrip({ slides = [] }) {
  const [isMobile, setIsMobile] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isMobile || slides.length < 2) return undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return undefined;
    const id = window.setInterval(() => {
      setActive((index) => (index + 1) % slides.length);
    }, MOBILE_HOLD);
    return () => window.clearInterval(id);
  }, [isMobile, slides.length]);

  if (!slides.length) return null;

  if (isMobile) {
    return (
      <section className="hero-filmstrip hero-filmstrip--mobile" aria-label="Featured collection">
        <div
          className="hero-filmstrip__mobile-track"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <div key={`${slide.id}-${i}`} className="hero-filmstrip__mobile-tile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.media?.src || "/images/homeback.jpeg"}
                alt={slide.media?.alt || slide.headline || "Beyond Buttons"}
                className="hero-filmstrip__image"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        <div className="hero-filmstrip__shade" aria-hidden="true" />

        <div className="hero-filmstrip__dots" role="tablist" aria-label="Featured slides">
          {slides.map((slide, i) => (
            <button
              key={slide.id || i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show slide ${i + 1}`}
              className={i === active ? "is-active" : undefined}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      </section>
    );
  }

  const strip = [...slides, ...slides];

  return (
    <section className="hero-filmstrip" aria-label="Featured collection">
      <div
        className="hero-filmstrip__track"
        style={{ "--loop-duration": `${LOOP_DURATION}s` }}
      >
        {strip.map((slide, i) => (
          <div key={`${slide.id}-${i}`} className="hero-filmstrip__tile">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.media?.src || "/images/homeback.jpeg"}
              alt={slide.media?.alt || slide.headline || "Beyond Buttons"}
              className="hero-filmstrip__image"
              loading={i < 4 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {/* Readability scrim — keeps the hero legible without hiding the imagery. */}
      <div className="hero-filmstrip__shade" aria-hidden="true" />
    </section>
  );
}