"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import gsap from "gsap";

import { useTheme } from "./ThemeProvider";

// track(44) - thumb(18) - inset(2 each side) = 22px of horizontal travel
const THUMB_TRAVEL = 22;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const [hasHydrated, setHasHydrated] = useState(false);
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  const sunRef = useRef(null);
  const moonRef = useRef(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasHydrated(true);
  }, []);

  useLayoutEffect(() => {
    const isDark = theme === "dark";
    const animate = hasMountedRef.current && !prefersReducedMotion();
    const method = animate ? "to" : "set";
    const duration = animate ? 0.5 : 0;

    gsap[method](thumbRef.current, {
      x: isDark ? THUMB_TRAVEL : 0,
      duration,
      ease: "back.out(1.7)",
    });
    gsap[method](trackRef.current, {
      backgroundColor: isDark ? "rgba(201, 169, 110, 0.14)" : "rgba(169, 124, 46, 0.12)",
      borderColor: isDark ? "rgba(201, 169, 110, 0.4)" : "rgba(169, 124, 46, 0.5)",
      duration,
      ease: "power2.out",
    });
    gsap[method](sunRef.current, {
      opacity: isDark ? 0.4 : 1,
      color: isDark ? "#8c8c8c" : "#a97c2e",
      duration,
      ease: "power2.out",
    });
    gsap[method](moonRef.current, {
      opacity: isDark ? 1 : 0.4,
      color: isDark ? "#c9a96e" : "#8c8c8c",
      duration,
      ease: "power2.out",
    });

    hasMountedRef.current = true;
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-pressed={hasHydrated ? isDark : false}
      aria-label={hasHydrated ? `Switch to ${isDark ? "light" : "dark"} mode` : "Toggle theme"}
      suppressHydrationWarning
    >
      <span className="theme-toggle__track" ref={trackRef}>
        <Sun
          ref={sunRef}
          className="theme-toggle__icon theme-toggle__icon--sun"
          size={12}
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <Moon
          ref={moonRef}
          className="theme-toggle__icon theme-toggle__icon--moon"
          size={12}
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <span className="theme-toggle__thumb" ref={thumbRef} aria-hidden="true" />
      </span>
    </button>
  );
}
