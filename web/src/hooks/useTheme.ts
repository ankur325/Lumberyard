import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "lumberyard-theme";

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // localStorage may be unavailable (private mode); fall through.
  }
  // Honor the class the no-flash script in index.html may have already set.
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

/** Tracks the active theme, persists it, and toggles the `.light` class on <html>. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore persistence failures.
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, setTheme, toggle };
}
