"use client";

import { useRef } from "react";
import { useServerInsertedHTML } from "next/navigation";

const THEME_INIT_SCRIPT = `
  (function() {
    try {
      var stored = localStorage.getItem("bb-theme");
      var theme = stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
      document.documentElement.setAttribute("data-theme", theme);
    } catch (e) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  })();
`;

export function ThemeInit() {
  const injected = useRef(false);

  useServerInsertedHTML(() => {
    if (injected.current) return;
    injected.current = true;
    return (
      <script
        id="theme-init"
        dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
      />
    );
  });

  return null;
}