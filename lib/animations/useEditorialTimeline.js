"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function useEditorialTimeline(rootRef, dependencyKey = "") {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const sections = Array.from(
      root.querySelectorAll("[data-editorial-section]")
    );
    if (!sections.length) return undefined;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const context = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(root.querySelectorAll("[data-editorial-reveal]"), {
          clearProps: "all",
        });
        return;
      }

      sections.forEach((section, index) => {
        const reveals = section.querySelectorAll("[data-editorial-reveal]");
        const media = section.querySelector("[data-editorial-media]");
        const previous = sections[index - 1];

        gsap.set(reveals, {
          yPercent: 16,
          clipPath: "inset(0 0 100% 0)",
        });

        if (media) {
          gsap.set(media, {
            scale: 1.035,
            clipPath: "inset(8% 0 8% 0 round 22px)",
          });
        }

        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top 88%",
            end: "top 30%",
            scrub: 1.15,
            invalidateOnRefresh: true,
          },
        });

        if (previous) {
          timeline.to(
            previous,
            {
              yPercent: -3,
              scale: 0.99,
              opacity: 0.76,
              transformOrigin: "center bottom",
              duration: 0.45,
            },
            0
          );
        }

        timeline.to(
          reveals,
          {
            yPercent: 0,
            clipPath: "inset(0 0 0% 0)",
            stagger: 0.08,
            duration: 0.72,
          },
          0
        );

        if (media) {
          timeline.to(
            media,
            {
              scale: 1,
              clipPath: "inset(0% 0 0% 0 round 22px)",
              duration: 0.85,
            },
            0.08
          );
        }
      });
    }, root);

    return () => context.revert();
  }, [dependencyKey, rootRef]);
}
