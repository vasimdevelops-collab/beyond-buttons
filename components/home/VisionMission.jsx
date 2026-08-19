"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./vision-mission.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const TAGLINE =
  "Our vision is the world's most considered solid-shirt brand. Our mission is simpler: make one thing brilliantly — the perfect solid shirt.";

export default function VisionMission() {
  const sectionRef = useRef(null);
  const lineRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const line = lineRef.current;
    if (!section) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(line, { autoAlpha: 1 });
        return;
      }
      gsap.set(line, { autoAlpha: 0, y: 14 });
      gsap.to(line, {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 82%" },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="vm"
      id="vision-mission"
      aria-label="Vision and Mission"
    >
      <div className="vm__backdrop" aria-hidden="true" />
      <div className="vm__container">
        <p className="vm__eyebrow" ref={lineRef}>
          <span aria-hidden="true" className="vm__dot" />
          Vision &amp; Mission
          <span aria-hidden="true" className="vm__dot" />
        </p>
        <p className="vm__tagline" ref={lineRef}>
          {TAGLINE}
        </p>
        <Link className="vm__link" href="/about">
          The full story
        </Link>
      </div>
    </section>
  );
}