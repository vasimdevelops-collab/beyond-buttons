"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./vision-mission.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const MISSION = {
  title: "Mission",
  copy: "To make premium solid shirts accessible to everyone by combining timeless design, exceptional quality, and honest pricing. We exist to prove that simplicity is not ordinary—it is confidence, crafted for everyday life.",
};

const VISION = {
  title: "Vision",
  copy: "To become the world's most trusted solid shirt brand, redefining everyday fashion through simplicity, consistency, and affordability—making BEYOND BUTTONS™ the first name people think of whenever they choose a solid shirt.",
};

export default function VisionMission() {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".vm__card", section);
      if (reducedMotion || cards.length === 0) {
        if (cards.length > 0) gsap.set(cards, { autoAlpha: 1 });
        return;
      }
      gsap.set(cards, { autoAlpha: 0, y: 14 });
      gsap.to(cards, {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
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
      <div className="vm__container">
        <div className="vm__grid">
          <article className="vm__card">
            <h2 className="vm__card-title">{MISSION.title}</h2>
            <p className="vm__card-copy">{MISSION.copy}</p>
          </article>
          <article className="vm__card">
            <h2 className="vm__card-title">{VISION.title}</h2>
            <p className="vm__card-copy">{VISION.copy}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
