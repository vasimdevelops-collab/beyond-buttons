"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "bb-theme";

function isValidTheme(value) {
  return value === "dark" || value === "light";
}

function readCurrentTheme() {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  return isValidTheme(attr) ? attr : "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => readCurrentTheme());

  const applyTheme = useCallback((next) => {
    if (!isValidTheme(next)) return;
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private browsing, etc.) — theme still
      // applies for the current session, it just won't persist.
    }
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme(theme === "dark" ? "light" : "dark");
  }, [applyTheme, theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setThemeState(mediaQuery.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
