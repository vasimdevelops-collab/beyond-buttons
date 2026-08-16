import { useCallback, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

function getLandingY() {
  if (typeof window === "undefined") return 28;
  if (window.innerWidth <= 480) return 22;
  if (window.innerWidth <= 768) return 24;
  return 28;
}

function getBounceRise() {
  if (typeof window === "undefined") return 9;
  if (window.innerWidth <= 480) return 5;
  if (window.innerWidth <= 768) return 6.5;
  return 9;
}

// The B glyph is the identical artwork in both source files — measured
// directly from the PNGs (never re-generated, just read pixel-for-pixel):
//   logo.png  577x433 — glyph spans x:209-377, y:66-226
//   B.png     558x447 — glyph spans x:62-453,  y:52-424
// These ratios let the standalone B.png dock exactly onto the logo's own
// B, so the two never render as separate/duplicate marks.
const LOGO_B_CENTER_X = 293 / 577;
const LOGO_B_CENTER_Y = 146 / 577;
const LOGO_B_WIDTH = 169 / 577;
const B_GLYPH_CENTER_X = 257.5 / 558;
const B_GLYPH_CENTER_Y = 238 / 558;
const B_GLYPH_WIDTH = 391 / 558;

function getBDockTarget(logoEl) {
  if (!logoEl || typeof window === "undefined") return { x: 0, y: 0, width: 0 };
  const rect = logoEl.getBoundingClientRect();
  const glyphCenterX = rect.left + rect.width * LOGO_B_CENTER_X;
  const glyphCenterY = rect.top + rect.width * LOGO_B_CENTER_Y;
  const glyphWidth = rect.width * LOGO_B_WIDTH;
  const boxWidth = glyphWidth / B_GLYPH_WIDTH;
  const boxLeft = glyphCenterX - boxWidth * B_GLYPH_CENTER_X;
  const boxTop = glyphCenterY - boxWidth * B_GLYPH_CENTER_Y;
  return {
    x: boxLeft - (window.innerWidth / 2 - boxWidth / 2),
    y: boxTop,
    width: boxWidth,
  };
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function shakeCamera(camera, intensity = 5) {
  if (!camera) return;
  gsap
    .timeline()
    .to(camera, { x: intensity, y: intensity * 0.4, duration: 0.045, ease: "power1.out" })
    .to(camera, { x: -intensity * 0.7, y: -intensity * 0.3, duration: 0.06, ease: "power1.inOut" })
    .to(camera, { x: intensity * 0.35, y: intensity * 0.15, duration: 0.06, ease: "power1.inOut" })
    .to(camera, { x: 0, y: 0, duration: 0.09, ease: "power2.out" });
}

export default function useIntroTimeline(root, { impactRef, trailRef, onFinish } = {}) {
  const exitPlayingRef = useRef(false);
  const mainTlRef = useRef(null);
  const reducedMotionRef = useRef(false);

  useLayoutEffect(() => {
    if (!root.current) return undefined;

    const reducedMotion = prefersReducedMotion();
    reducedMotionRef.current = reducedMotion;

    const ctx = gsap.context(() => {
      const camera = root.current.querySelector(".intro-camera");
      const blackScreen = root.current.querySelector(".intro-black-screen");
      const wardrobe = root.current.querySelector(".intro-wardrobe");
      const impactGlow = root.current.querySelector(".intro-impact-glow");
      const bWrap = root.current.querySelector(".intro-b-wrap");
      const bMark = root.current.querySelector(".intro-b-mark");
      const bShine = root.current.querySelector(".intro-b-shine");
      const logo = root.current.querySelector(".intro-logo");
      const copyLines = root.current.querySelectorAll(".intro-copy > *");
      const headlineLines = root.current.querySelectorAll(".intro-copy__line");
      const title = root.current.querySelector(".intro-copy__title");
      const enterBtn = root.current.querySelector(".intro-enter-btn");
      const content = root.current.querySelector(".intro-content");

      const landingY = getLandingY();
      const restingShadow = "drop-shadow(0 0 28px rgba(212,175,55,0.55))";
      const baseShadow = "drop-shadow(0 0 24px rgba(212,175,55,0.45))";

      // This pass is B + background only: logo/text/button stay hidden and untouched.
      gsap.set(blackScreen, { autoAlpha: 1 });
      gsap.set(wardrobe, { autoAlpha: 1, clipPath: "inset(0% 0% 100% 0%)" });
      gsap.set(impactGlow, { autoAlpha: 0, scale: 0.4, transformOrigin: "50% 50%" });
      gsap.set(camera, { x: 0, y: 0 });
      // Content wrapper itself stays visible; each child (logo/copy/button)
      // independently controls its own autoAlpha so only the logo can fade in.
      gsap.set(content, { autoAlpha: 1 });
      gsap.set(logo, { autoAlpha: 0 });
      gsap.set(copyLines, { autoAlpha: 0 });
      gsap.set(title, { y: 18 });
      gsap.set(enterBtn, { autoAlpha: 0 });
      gsap.set(bShine, { autoAlpha: 0, x: "-180%" });

      gsap.set(bWrap, {
        left: "50%",
        xPercent: -50,
        x: 0,
        y: reducedMotion ? `${landingY}vh` : "-120vh",
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        autoAlpha: 1,
        transformOrigin: "50% 100%",
      });
      gsap.set(bMark, { filter: reducedMotion ? restingShadow : baseShadow });

      // Reduced motion: settle instantly, no fall/bounce, no animated reveal.
      if (reducedMotion) {
        gsap.set(blackScreen, { autoAlpha: 0 });
        gsap.set(wardrobe, { clipPath: "inset(0% 0% 0% 0%)" });
        gsap.set(logo, { autoAlpha: 1 });
        gsap.set(headlineLines, { autoAlpha: 1 });
        gsap.set(title, { autoAlpha: 1, y: 0 });
        gsap.set(enterBtn, { autoAlpha: 1 });
        // Dock the B onto the logo's own B glyph instantly — never a second B.
        const dock = getBDockTarget(logo);
        gsap.set(bWrap, { x: dock.x, y: dock.y });
        gsap.set(bMark, { width: dock.width });
        return;
      }

      const bounceRise = getBounceRise();

      const tl = gsap.timeline();
      mainTlRef.current = tl;

      tl
        // Black screen hold
        .to({}, { duration: 0.8 })

        // FALL — heavy gravity acceleration with stretch (sells the weight)
        .to(bWrap, {
          y: `${landingY}vh`,
          duration: 0.95,
          ease: "power4.in",
          onUpdate: function updateFall() {
            const p = this.progress();
            const blur =
              p < 0.8
                ? Math.round(p * 7 * 10) / 10
                : Math.round((1 - p) * 16 * 10) / 10;
            gsap.set(bMark, { filter: `blur(${blur}px) ${baseShadow}` });
            gsap.set(bWrap, {
              scaleY: 1 + p * 0.14,
              scaleX: 1 - p * 0.08,
            });
          },
        })

        // IMPACT — ground contact squash (heavy metal weight)
        .to(bWrap, {
          scaleX: 1.24,
          scaleY: 0.72,
          duration: 0.09,
          ease: "power2.out",
        })

        .add("impact")

        // Small impact reaction — gold flash, subtle camera shake, small dust burst
        .call(
          () => {
            shakeCamera(camera, 5);

            const rect = bMark.getBoundingClientRect();
            impactRef?.current?.burst(
              rect.left + rect.width / 2,
              rect.bottom - rect.height * 0.08,
              window.innerWidth <= 480 ? 10 : 16
            );
          },
          null,
          "impact"
        )
        .to(impactGlow, { autoAlpha: 1, scale: 1.1, duration: 0.12, ease: "power2.out" }, "impact")
        .to(impactGlow, { autoAlpha: 0, scale: 1.4, duration: 0.4, ease: "power2.in" }, "impact+=0.12")

        // Black screen snaps away (no fade) so the wardrobe wipe becomes visible
        .set(blackScreen, { autoAlpha: 0 }, "impact+=0.08")

        // Background reveal — top-to-bottom clip-path wipe only, no fade, no scale
        .to(
          wardrobe,
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.3,
            ease: "power2.inOut",
          },
          "impact+=0.08"
        )

        // BOUNCE — single natural hop off the ground, no elastic wobble
        .to(
          bWrap,
          {
            y: `${landingY - bounceRise}vh`,
            scaleX: 0.94,
            scaleY: 1.1,
            duration: 0.3,
            ease: "power2.out",
          },
          "impact+=0.02"
        )

        // SETTLE — gravity pulls it back down
        .to(
          bWrap,
          {
            y: `${landingY}vh`,
            scaleX: 1.05,
            scaleY: 0.96,
            duration: 0.26,
            ease: "power2.in",
          },
          "impact+=0.32"
        )

        // Recover to rest shape — timeline stops here, nothing else plays
        .to(
          bWrap,
          {
            scaleX: 1,
            scaleY: 1,
            duration: 0.22,
            ease: "power3.out",
          },
          "impact+=0.58"
        )

        .to(bMark, { filter: restingShadow, duration: 0.3 }, "impact+=0.8")

        // DOCK — the resting B glides and shrinks onto the logo's own B glyph,
        // so when the logo appears it looks like one unified mark, never two.
        .to(
          bWrap,
          {
            x: () => getBDockTarget(logo).x,
            y: () => getBDockTarget(logo).y,
            duration: 1,
            ease: "power3.inOut",
          },
          "impact+=1.1"
        )
        .to(
          bMark,
          {
            width: () => getBDockTarget(logo).width,
            duration: 1,
            ease: "power3.inOut",
          },
          "impact+=1.1"
        )

        // Logo fade-in — the B is already docked in place underneath it
        .to(logo, { autoAlpha: 1, duration: 1, ease: "power2.out" }, "impact+=2.3")

        // Reveal the two headline lines only — title/subtitle/button stay hidden
        .to(headlineLines, {
          autoAlpha: 1,
          duration: 0.7,
          stagger: 0.18,
          ease: "power2.out",
        })

        // Luxury fade — slow, refined rise-and-fade for the title, nothing else
        .to(
          title,
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.6,
            ease: "power2.out",
          },
          "+=0.25"
        )

        // Reveal ENTER NOW — nothing else (shifted ~1s earlier in the timeline)
        .to(enterBtn, { autoAlpha: 1, duration: 0.8, ease: "power2.out" }, "-=0.8");
    }, root);

    return () => ctx.revert();
  }, [root, impactRef]);

  const playExit = useCallback(() => {
    if (exitPlayingRef.current || !root.current) return;
    exitPlayingRef.current = true;

    mainTlRef.current?.kill();

    gsap.context(() => {
      const camera = root.current.querySelector(".intro-camera");
      const wardrobe = root.current.querySelector(".intro-wardrobe");
      const bWrap = root.current.querySelector(".intro-b-wrap");
      const bMark = root.current.querySelector(".intro-b-mark");
      const logo = root.current.querySelector(".intro-logo");
      const copyLines = root.current.querySelectorAll(".intro-copy > *");
      const enterBtn = root.current.querySelector(".intro-enter-btn");
      const impactGlow = root.current.querySelector(".intro-impact-glow");
      const content = root.current.querySelector(".intro-content");

      // ─────────────────────────────────────────────
      // REDUCED MOTION — simple cross-fade exit
      // ─────────────────────────────────────────────
      if (reducedMotionRef.current) {
        gsap
          .timeline({
            onComplete: () => {
              gsap.set(root.current, { autoAlpha: 0, pointerEvents: "none" });
              onFinish?.();
            },
          })
          .to([logo, ...copyLines, enterBtn, wardrobe, content, bWrap], {
            autoAlpha: 0,
            duration: 0.4,
            ease: "power1.inOut",
          })
          .to(root.current, { autoAlpha: 0, duration: 0.3, ease: "power1.inOut" }, "-=0.1");
        return;
      }

      // Measure the B live — it is currently docked onto the logo at its
      // small, logo-matched size, so the roll distance/hop must be derived
      // from its real on-screen box rather than a hardcoded rest size.
      const startRect = bWrap.getBoundingClientRect();
      const exitDistance = window.innerWidth - startRect.left + startRect.width + 40;
      const hop =
        window.innerWidth <= 480 ? 16 : window.innerWidth <= 768 ? 22 : 30;
      let trailInterval = null;

      const exitTl = gsap.timeline({
        onComplete: () => {
          clearInterval(trailInterval);
          trailRef?.current?.stop();
          gsap.set(root.current, { autoAlpha: 0, pointerEvents: "none" });
          onFinish?.();
        },
      });

      exitTl
        // Everything fades away — including the flat logo artwork — leaving
        // only the real, already-docked B in place to carry on alone.
        .to([logo, ...copyLines, enterBtn], {
          autoAlpha: 0,
          y: -16,
          duration: 0.45,
          stagger: 0.04,
          ease: "power2.in",
        })
        .to(
          [wardrobe, content, impactGlow],
          {
            autoAlpha: 0,
            duration: 0.55,
            ease: "power2.inOut",
          },
          "<0.05"
        )
        .add("roll")
        // Pivot from its center from here on, so it tumbles like a rolling
        // object instead of swinging from the base anchor used for the bounce.
        .set(bWrap, { transformOrigin: "50% 50%" }, "roll")
        .call(
          () => {
            trailInterval = setInterval(() => {
              const rect = bMark.getBoundingClientRect();
              trailRef?.current?.emitTrail(
                rect.left + rect.width * 0.55,
                rect.top + rect.height * 0.65,
                window.innerWidth <= 768 ? 1 : 2
              );
            }, 45);
          },
          null,
          "roll"
        )
        // Small upward hop — the B breaking free of the logo
        .to(bWrap, { y: `-=${hop}`, duration: 0.22, ease: "power2.out" }, "roll")
        .to(bWrap, { y: `+=${hop}`, duration: 0.32, ease: "power1.in" }, "roll+=0.22")
        // Rolls smoothly toward the right edge, rotating the whole way
        .to(
          bWrap,
          {
            x: `+=${exitDistance}`,
            rotation: 680,
            duration: 1.9,
            ease: "power2.inOut",
            onUpdate: function updateRollBlur() {
              const p = this.progress();
              const blur = p > 0.08 && p < 0.85 ? 2 : 0;
              gsap.set(bMark, {
                filter: `blur(${blur}px) drop-shadow(0 0 24px rgba(212,175,55,0.6))`,
              });
            },
          },
          "roll"
        )
        .to(
          camera,
          {
            x: window.innerWidth <= 768 ? 24 : 40,
            duration: 1.9,
            ease: "power1.inOut",
          },
          "roll"
        )
        .to(
          root.current,
          {
            autoAlpha: 0,
            duration: 0.35,
            ease: "power2.in",
          },
          "-=0.25"
        );
    }, root);
  }, [root, trailRef, onFinish]);

  return { playExit };
}
