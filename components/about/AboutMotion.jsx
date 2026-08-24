"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * AboutMotion — page-level choreography for /about
 * Runs once on mount, scoped to .bb-about, cleaned up on unmount.
 * Respects prefers-reduced-motion (everything stays visible).
 */
export default function AboutMotion() {
  useEffect(() => {
    const root = document.querySelector(".bb-about");
    if (!root) return undefined;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reduced) return;

      /* ── Hero intro (plays on load) ── */
      gsap.set(
        [
          "[data-hero='eyebrow']",
          "[data-hero='title']",
          "[data-hero='divider']",
          "[data-hero='intro']",
        ],
        { autoAlpha: 0, y: 26 }
      );
      gsap.set("[data-hero='divider']", { y: 0, scaleX: 0 });
      gsap.set(".bb-about__stat", { autoAlpha: 0, y: 18 });

      gsap
        .timeline({ defaults: { ease: "power3.out" }, delay: 0.1 })
        .to("[data-hero='eyebrow']", { autoAlpha: 1, y: 0, duration: 0.6 })
        .to("[data-hero='title']", { autoAlpha: 1, y: 0, duration: 0.85 }, "-=0.38")
        .to(
          "[data-hero='divider']",
          { autoAlpha: 1, scaleX: 1, duration: 0.7, ease: "power2.out" },
          "-=0.5"
        )
        .to("[data-hero='intro']", { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.45")
        .to(
          ".bb-about__stat",
          { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.09 },
          "-=0.4"
        );

      /* ── Generic scroll-rise blocks ── */
      gsap.utils.toArray("[data-motion='rise']").forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 30 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 86%" },
          }
        );
      });

      /* ── Gold dividers draw in ── */
      gsap.utils.toArray("[data-motion='divider-left']").forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, scaleX: 0 },
          {
            autoAlpha: 1,
            scaleX: 1,
            transformOrigin: "left center",
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          }
        );
      });

      gsap.utils.toArray("[data-motion='divider-center']").forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, scaleX: 0 },
          {
            autoAlpha: 1,
            scaleX: 1,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          }
        );
      });

      /* ── Founding story — paragraphs cascade ── */
      const paras = gsap.utils.toArray(".bb-about__story p");
      if (paras.length) {
        gsap.set(paras, { autoAlpha: 0, y: 20 });
        gsap.to(paras, {
          autoAlpha: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.11,
          ease: "power2.out",
          scrollTrigger: { trigger: ".bb-about__story", start: "top 82%" },
        });
      }

      /* ── Pull quote ── */
      const pull = root.querySelector(".bb-about__pull");
      if (pull) {
        gsap.fromTo(
          pull,
          { autoAlpha: 0, y: 26 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: pull, start: "top 85%" },
          }
        );
      }

      /* ── Editorial image — cinematic unmask ── */
      const figure = root.querySelector(".bb-about__figure");
      if (figure) {
        const img = figure.querySelector("img");
        const caption = figure.querySelector("figcaption");
        gsap.set(figure, { autoAlpha: 0, clipPath: "inset(10% 5% 10% 5% round 22px)" });
        if (img) gsap.set(img, { scale: 1.12 });

        const ftl = gsap.timeline({
          scrollTrigger: { trigger: figure, start: "top 80%" },
        });
        ftl.to(figure, {
          autoAlpha: 1,
          clipPath: "inset(0% 0% 0% 0% round 22px)",
          duration: 1.05,
          ease: "power3.out",
        });
        if (img) ftl.to(img, { scale: 1, duration: 1.3, ease: "power2.out" }, 0);
        if (caption) {
          ftl.fromTo(
            caption,
            { autoAlpha: 0, y: 10 },
            { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
            "-=0.35"
          );
        }
      }

      /* ── Ornament — lines draw out from the diamond ── */
      const orn = root.querySelector(".bb-about__ornament");
      if (orn) {
        const lines = orn.querySelectorAll(":scope > span");
        const diamond = orn.querySelector(":scope > i");
        gsap.set(lines, { scaleX: 0 });
        if (diamond) gsap.set(diamond, { autoAlpha: 0, scale: 0, rotation: -135 });

        const otl = gsap.timeline({
          scrollTrigger: { trigger: orn, start: "top 92%" },
        });
        otl
          .to(lines[0], {
            scaleX: 1,
            transformOrigin: "right center",
            duration: 0.65,
            ease: "power2.out",
          })
          .to(
            diamond,
            {
              autoAlpha: 1,
              scale: 1,
              rotation: 45,
              duration: 0.5,
              ease: "back.out(2.2)",
            },
            "-=0.3"
          )
          .to(
            lines[1],
            { scaleX: 1, transformOrigin: "left center", duration: 0.65, ease: "power2.out" },
            "-=0.35"
          );
      }

      /* ── Craft values — staggered tiles ── */
      const values = gsap.utils.toArray(".bb-about__value");
      if (values.length) {
        gsap.set(values, { autoAlpha: 0, y: 26 });
        gsap.to(values, {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: { trigger: ".bb-about__values", start: "top 85%" },
        });
      }

      /* ── Mission & Vision cards ── */
      const vmCards = gsap.utils.toArray(".bb-about__vm-card");
      if (vmCards.length) {
        gsap.set(vmCards, { autoAlpha: 0, y: 34 });
        gsap.to(vmCards, {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.14,
          ease: "power3.out",
          scrollTrigger: { trigger: ".bb-about__vm-grid", start: "top 84%" },
        });

        const rules = gsap.utils.toArray(".bb-about__vm-rule");
        gsap.set(rules, { scaleX: 0 });
        gsap.to(rules, {
          scaleX: 1,
          duration: 0.6,
          stagger: 0.14,
          ease: "power2.out",
          scrollTrigger: { trigger: ".bb-about__vm-grid", start: "top 68%" },
        });
      }

      /* ── Closing CTA ── */
      const closingTitle = root.querySelector(".bb-about__closing-title");
      const closingCopy = root.querySelector(".bb-about__closing-copy");
      const ctas = gsap.utils.toArray(".bb-about__cta-row .about-page__cta");
      const ctl = gsap.timeline({
        scrollTrigger: { trigger: ".bb-about__closing", start: "top 78%" },
      });
      if (closingTitle) {
        ctl.fromTo(
          closingTitle,
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, duration: 0.85, ease: "power3.out" }
        );
      }
      if (closingCopy) {
        ctl.fromTo(
          closingCopy,
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" },
          "-=0.5"
        );
      }
      if (ctas.length) {
        ctl.fromTo(
          ctas,
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.1, ease: "power2.out" },
          "-=0.4"
        );
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return null;
}
