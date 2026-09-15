"use client";

import { cn } from "@/lib/utils";
import { THEMES, type ThemeId } from "@/context/ThemeContext";

const SWATCH_CLASS =
  "-my-px flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center border border-transparent p-0 font-visual text-2xl leading-none";

/**
 * The artwork's own colour combination — same swatch-row language as the
 * site-wide ThemeToggle, but scoped to /create's local state rather than the
 * `<html>` class: the drawing tool and text layers read `ink` off whichever
 * swatch is active here, independent of the visitor's own site theme.
 */
export default function PaletteSwitcher({
  value,
  onChange,
  className,
}: {
  value: ThemeId;
  onChange: (id: ThemeId) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Artwork colour"
      className={cn("flex items-center gap-x-1", className)}
    >
      {THEMES.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t.label}
            onClick={() => onChange(t.id)}
            className={cn(
              SWATCH_CLASS,
              t.swatch,
              active ? "border-current" : "opacity-40 hover:opacity-100",
            )}
          >
            ■
          </button>
        );
      })}
    </div>
  );
}
