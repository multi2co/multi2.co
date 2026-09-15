"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/** One row per palette: the colour its mark is drawn in, and the class
 *  globals.css hangs the palette off. The swatch is a literal colour rather
 *  than text-primary — a token-based one would restyle itself on every theme
 *  change, so the red mark would look blue in the blue theme. Written out in
 *  full because Tailwind only emits classes it can find as complete strings in
 *  the source.
 *
 *  `ink` / `bg` are the same palette's light-mode `--primary` /tool that draws
 *  outside the cascade — a `<canvas>` fillStyle or an exported SVG can't read
 *  `html.multi2_*`'s CSS variables, so /create's drawing tool takes its colour
 *  straight from these literals instead of duplicating a second colour list. */
export const THEMES = [
  {
    id: "red",
    label: "Red",
    className: "multi2_red",
    swatch: "text-[oklch(0.628_0.2577_29.2339)]",
    ink: "oklch(0.628 0.2577 29.2339)",
    bg: "oklch(0.943 0.0286 29.23)",
  },
  {
    id: "blue",
    label: "Blue",
    className: "multi2_blue",
    swatch: "text-[oklch(0.452_0.3132_264.05)]",
    ink: "oklch(0.452 0.3132 264.05)",
    bg: "oklch(0.943 0.0286 264.05)",
  },
  {
    id: "green",
    label: "Green",
    className: "multi2_green",
    // The one palette whose primary is the dark half rather than the saturated
    // one — taking the bright green here would paint the mark in this theme's
    // own background colour.
    swatch: "text-[oklch(0.285_0.097_142.5)]",
    ink: "oklch(0.285 0.097 142.5)",
    bg: "oklch(0.8664 0.2948 142.5)",
  },
  {
    id: "pink",
    label: "Pink",
    className: "multi2_pink",
    swatch: "text-[oklch(0.7017_0.3225_328.36)]",
    ink: "oklch(0.7017 0.3225 328.36)",
    bg: "oklch(0.943 0.0286 328.36)",
  },
  {
    id: "teal",
    label: "Teal",
    className: "multi2_teal",
    swatch: "text-[oklch(0.5431_0.0927_194.77)]",
    ink: "oklch(0.5431 0.0927 194.77)",
    bg: "oklch(0.965 0.0516 196.33)",
  },
  {
    id: "bw",
    label: "B/W",
    className: "multi2_bw",
    swatch: "text-[oklch(0_0_0)]",
    ink: "oklch(0 0 0)",
    bg: "oklch(1 0 0)",
  },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

/** The bare :root is already the red palette, so nothing is set until asked. */
const DEFAULT_THEME: ThemeId = "red";

const THEME_STORAGE_KEY = "multi2-theme";

/** Dark mode rides alongside the palette: `multi2_dark` is added next to the
 *  `multi2_*` class, and globals.css has a two-class block per palette that
 *  inverts it. Light is the site default — the class is off unless the
 *  visitor has explicitly switched it on (stored value `"1"`). */
const DARK_STORAGE_KEY = "multi2-dark";
const DARK_CLASS = "multi2_dark";
const DARK_DEFAULT = false;

type ThemeContextType = {
  theme: ThemeId;
  selectTheme: (id: ThemeId) => void;
  cycleTheme: () => void;
  dark: boolean;
  toggleDark: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

/** One owner for the palette + dark-mode state, so every control that reads it
 *  (the nav, the under-construction gate) stays in step with the class actually
 *  on `<html>`. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [dark, setDark] = useState(DARK_DEFAULT);

  // Source of truth is the saved choice; the <html> class is just how it's
  // applied. Fall back to whatever class is already on <html> (the pre-paint
  // script), then to red.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {}
    const fromStore = THEMES.find((t) => t.id === stored)?.id;
    const fromClass = THEMES.find((t) =>
      document.documentElement.classList.contains(t.className),
    )?.id;
    const next = fromStore ?? fromClass ?? DEFAULT_THEME;
    for (const t of THEMES) {
      document.documentElement.classList.toggle(t.className, t.id === next);
    }
    setTheme(next);

    let storedDark: string | null = null;
    try {
      storedDark = localStorage.getItem(DARK_STORAGE_KEY);
    } catch {}
    // Default-off: light unless the visitor explicitly turned dark on.
    const isDark = storedDark === "1" ? true : DARK_DEFAULT;
    document.documentElement.classList.toggle(DARK_CLASS, isDark);
    setDark(isDark);
  }, []);

  // Every class is set explicitly rather than just adding the new one: the
  // palettes are exclusive, and a leftover class would win on cascade order.
  const selectTheme = useCallback((next: ThemeId) => {
    for (const t of THEMES) {
      document.documentElement.classList.toggle(t.className, t.id === next);
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
    setTheme(next);
  }, []);

  const cycleTheme = useCallback(() => {
    setTheme((current) => {
      const i = THEMES.findIndex((t) => t.id === current);
      const next = THEMES[(i + 1) % THEMES.length].id;
      for (const t of THEMES) {
        document.documentElement.classList.toggle(t.className, t.id === next);
      }
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  const toggleDark = useCallback(() => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle(DARK_CLASS, next);
      try {
        localStorage.setItem(DARK_STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, selectTheme, cycleTheme, dark, toggleDark }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
