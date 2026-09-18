"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIconStyle } from "@/context/IconStyleContext";
import TerminalM2Button from "./TerminalM2Button";

type Props = {
  className?: string;
  label?: string;
  onClick?: () => void;
  href?: string;
  /** Fills the square: the checkbox is on, or the route/theme is current. */
  active?: boolean;
  /** Type the label out instead of just setting it. */
  terminal?: boolean;
  /** Replaces the label entirely — a swatch, a mark, a nested control. */
  children?: ReactNode;
  hoverFill?: boolean;
  size?: "sm" | "md" | "lg" | "label" | "xl";
  /** Which side of the box the label sits on. Omitted (or "right") keeps the
   *  default — box first, label after it. "left" puts the label first and
   *  pushes the box out to the far end of the row. */
  labelSide?: "left" | "right";
  /** Swap the checkbox glyphs for another pair — e.g. a lozenge ◆/◇ for a
   *  marker that reads as a tag rather than a toggle. Both glyphs should share
   *  a width so the hover swap doesn't shift the row. */
  marks?: { active: string; inactive: string };
  /** Show only the mark — the `label` still names the control for
   *  screen readers but isn't drawn. */
  markOnly?: boolean;
  /** Text colour class for the control (e.g. `text-secondary`) — the mark
   *  and label both inherit it. Defaults to `text-primary`. */
  color?: string;
};

/** `size` is geometry only — box, gutter and gap. Whether a
 *  square shows at all is decided by `href`, not by the size. Height carries
 *  no vertical padding: the row is centred by items-center, and padding on one
 *  side only would pull it back off centre.
 *
 *  `label` is `lg`'s type at no size of its own — `h-auto px-0` — for a
 *  heading that sits in a layout's own grid rather than in a control row. */
export const SIZE_BOX = {
  sm: "h-auto items-center",
  md: "px-6 lg:px-3 h-12 lg:h-12 items-center justify-start",
  lg: "px-6 lg:px-3 h-16 lg:h-12 items-center justify-start",
  label: "h-3 px-0 justify-start items-center",
  xl: "px-6 lg:px-3 h-16 lg:h-12 items-center justify-start",
} as const;

/** Type scale. `sm` is a compact control — a filter chip, a dense row — so it
 *  drops to the small UI size rather than the display size the larger ones use. */
export const SIZE_TEXT = {
  sm: "text-sm leading-[1]",
  md: "text-base lg:text-lg lowercase",
  lg: "font-normal text-base lg:text-base lowercase",
  label: "font-normal text-base lg:text-base lowercase",
  xl: "font-normal lg:font-thin text-base lg:text-3xl lowercase",
} as const;

export const SIZE_GAP = {
  sm: "gap-x-2",
  md: "gap-x-3 lg:gap-x-3",
  lg: "gap-x-3 lg:gap-x-1.5",
  label: "gap-x-3 lg:gap-x-1.5",
  xl: "gap-x-3 lg:gap-x-3",
} as const;

/** The mark is a glyph now (■ / □ — U+25A0 / U+25A1), so its footprint is a
 *  font size rather than a box. Sized in `em` so it tracks the label: the
 *  glyph body renders at roughly 0.7em, so ~2.2em keeps it at least twice the
 *  label's height. It renders in `font-visual` and shares the label baseline. */
export const SIZE_CHECK = {
  sm: "text-[2.2em]",
  md: "text-[1em]",
  lg: "text-[0.7em]",
  label: "text-[0.7em]",
  xl: "text-[0.7em]",
} as const;

/** The checkbox marks, straight from the font: `filledbox` (U+25A0, &#9632;)
 *  when active, `uni25A1` (U+25A1, &#9633;) when not. */
export const MARK_ACTIVE = "■";
export const MARK_INACTIVE = "□";

/** The dot alternative — swapped in site-wide by the CMS's icon-style toggle. */
const MARK_ACTIVE_DOT = "●";
const MARK_INACTIVE_DOT = "○";

export type CheckButtonSize = "sm" | "md" | "lg" | "label" | "xl";

/** The square is the checkbox: primary when active, muted when not. The whole
 *  control is one hover target — `group` on the outer element means the square
 *  and the label light up together whichever one the pointer is over.
 *  Renders as a link with `href`, a button with `onClick`, and a plain span
 *  when it is only a marker. Links carry the square too — on a nav row it is
 *  what marks the current route. */
export default function CheckButton({
  className,
  label,
  onClick,
  size = "md",
  href,
  active = false,
  terminal = false,
  children,
  hoverFill = false,
  labelSide,
  marks,
  markOnly = false,
  color,
}: Props) {
  const iconStyle = useIconStyle();
  const markOn =
    marks?.active ?? (iconStyle === "dot" ? MARK_ACTIVE_DOT : MARK_ACTIVE);
  const markOff =
    marks?.inactive ??
    (iconStyle === "dot" ? MARK_INACTIVE_DOT : MARK_INACTIVE);
  const content = (
    <div
      className={cn(
        "flex font-visual  tracking-wide bg-transparent    ",
        SIZE_TEXT[size],
        hoverFill ? "hover:bg-primary hover:text-primary" : "",
        className,
        SIZE_BOX[size],
      )}
    >
      <div
        className={cn(
          // The square holds no text, so flexbox synthesises its baseline from
          // its bottom edge — it sits on the label's baseline the way a letter
          // does. This group is shrink-to-fit, so the outer items-center is
          // what centres the pair as a unit inside the button.
          "flex items-baseline",
          // "left" flips the pair so the label reads first and the box trails
          // it, spread to the row's two ends — the settings-row pattern. Takes
          // the full width to spread across.
          labelSide === "left"
            ? "flex-row-reverse justify-between w-full"
            : "justify-start",
          SIZE_GAP[size],
        )}
      >
        <span
          aria-hidden
          // No colour of its own — it inherits the control's text colour, so
          // passing e.g. `text-primary-foreground` in `className` tints the
          // mark along with the label.
          className={cn(
            "shrink-0 select-none  font-visual font-normal leading-none",
            SIZE_CHECK[size],
          )}
        >
          {/* Hovering anywhere in the control flips the fill: the empty box
              fills in, the filled box empties out. Both glyphs are the same
              width, so the swap doesn't shift the row. */}
          <span className="group-hover:hidden">
            {active ? markOn : markOff}
          </span>
          <span className="hidden group-hover:inline">
            {active ? markOff : markOn}
          </span>
        </span>
        {children ??
          (terminal ? (
            <TerminalM2Button
              className={className}
              text={label ?? ""}
              visible
              delay={0}
            />
          ) : markOnly ? null : (
            label
          ))}
      </div>
    </div>
  );

  const cls = cn(
    "group transition-colors",
    color
      ? [color, "hover:text-primary"]
      : active
        ? "text-primary"
        : "text-primary hover:text-primary/90",
    (href || onClick) && "cursor-pointer",
    className,
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={cls}>
        {content}
      </Link>
    );
  }

  if (!onClick) return <span className={cls}>{content}</span>;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      aria-label={label}
      onClick={onClick}
      className={cls}
    >
      {content}
    </button>
  );
}
