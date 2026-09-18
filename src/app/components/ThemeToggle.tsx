"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { THEMES, useTheme } from "@/context/ThemeContext";
import { useIconStyle } from "@/context/IconStyleContext";

/** The two glyph pairs a CheckButton can draw, keyed by the CMS's icon-style
 *  toggle — kept here rather than imported so this stays a plain glyph
 *  choice, not a dependency on CheckButton's internals. */
const MARKS = {
  square: { active: "■", inactive: "■" },
  dot: { active: "●", inactive: "●" },
} as const;

const SWATCH_CLASS =
  "-my-px flex h-3 w-3  shrink-0 cursor-pointer items-center justify-center border p-0 font-visual text-xl  leading-none";

/**
 * The floating palette picker — one swatch per THEME, fixed to the viewport's
 * right edge and vertically centred, each drawn in that palette's own primary
 * colour so every option reads at a glance. A click selects that theme
 * directly. Same control at every breakpoint — no separate mobile treatment.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, selectTheme } = useTheme();
  const iconStyle = useIconStyle();
  const marks = MARKS[iconStyle];
  const pathname = usePathname();

  // /create has its own scoped palette switcher for the artwork itself —
  // the site-wide picker would be a second, conflicting colour control there.
  if (pathname?.startsWith("/create")) return null;

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "fixed top-1/2 right-0 lg:right-0 z-[90] flex -translate-y-1/2 flex-col gap-y-1",
        className,
      )}
    >
      {THEMES.map((t) => {
        const active = t.id === theme;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t.label}
            onClick={() => selectTheme(t.id)}
            className={cn(
              SWATCH_CLASS,
              "border-transparent bg-red-500",
              t.swatch,
            )}
          >
            {active ? marks.active : marks.inactive}
          </button>
        );
      })}
    </div>
  );
}
