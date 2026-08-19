"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./brand-story.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const TEASER_LINES = [
  "Beyond Buttons began with one conviction: a wardrobe should never shout. It should simply be right.",
  "We started with a single garment — one shirt, cut clean and made properly. Not to follow a trend, but to fix a feeling.",
];

export default function BrandStory() {
  const sectionRef = useRef(null);
  const copyRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const parts = copyRef.current?.querySelectorAll("[data-reveal]") || [];
      if (reducedMotion) {
        gsap.set(parts, { autoAlpha: 1, y: 0 });
        return;
      }
      gsap.set(parts, { autoAlpha: 0, y: 24 });
      gsap.to(parts, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 78%" },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="brand-story"
      id="story"
      aria-label="Story of Beyond Buttons"
    >
      <div className="brand-story__backdrop" aria-hidden="true" />

      <div className="brand-story__container">
        <div className="brand-story__layout">
          <div className="brand-story__media" data-reveal>
            <span className="brand-story__media-frame" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/homeback.jpeg"
              alt="Beyond Buttons — a quiet, considered wardrobe of solid shirts"
            />
          </div>

          <div className="brand-story__copy" ref={copyRef}>
            <header className="brand-story__header">
              <p className="brand-story__eyebrow" data-reveal>
                Our Story
              </p>
              <h2 className="brand-story__title" data-reveal>
                Beyond buttons, into a sharper everyday uniform.
              </h2>
              <span className="brand-story__divider" data-reveal aria-hidden="true" />
            </header>

            <div className="brand-story__teaser">
              {TEASER_LINES.map((line, index) => (
                <p key={index} data-reveal>
                  {line}
                </p>
              ))}
            </div>

            <p className="brand-story__cta" data-reveal>
              <Link href="/about">Read the full story</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}