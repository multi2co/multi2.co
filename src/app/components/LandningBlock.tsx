"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePixelCorners } from "@/app/hooks/usePixelCorners";
import CheckButton from "./CheckButton";

type Props = {
  /** Background and its paired text colour, e.g. "bg-secondary text-primary". */
  bg?: string;
  /** The block's CheckButton. Omit for an unlabelled block such as the hero. */
  label?: string;
  /** Where the label links. Without it the label is a plain marker. */
  href?: string;
  /** Height, padding and row alignment — whatever this block needs on top of
   *  the shared grid. */
  className?: string;
  /** Overrides the label wrapper's column placement. The default is column one;
   *  pass matching `col-start-*` / `col-span-*` to move it. */
  labelClassName?: string;
  /** Overrides the content wrapper's column placement. The default starts it at
   *  column four, on the label's baseline. */
  contentClassName?: string;
  /** An absolutely-positioned layer behind the label and content — e.g. a hero
   *  image that bleeds to the block's edges while the label keeps to the grid.
   *  Clipped to the same notched-corner shape as the block. */
  background?: ReactNode;
  children?: ReactNode;
};

/** The one section shape the landing page is built from: a twelve-column grid
 *  (three on mobile) with the label in column one and the content starting at
 *  column four, the two sharing a baseline. Only the background, the label and
 *  the contents change between blocks.
 *
 *  Children are wrapped in a cell rather than dropped straight into the grid, so
 *  a block's contents can carry whatever inner grid they like without having to
 *  be aware of this one. */
export default function LandningBlock({
  bg = "bg-background text-primary",
  label,
  href,
  className,
  labelClassName,
  contentClassName,
  background,
  children,
}: Props) {
  // Notches the block's four corners, scaled to its size — same treatment the
  // buttons get, so the sections read as part of the same family.
  const pixelRef = usePixelCorners<HTMLElement>();

  return (
    <section
      ref={pixelRef}
      className={cn(
        "relative z-10 w-full grid grid-cols-3 lg:grid-cols-12 items-baseline gap-y-12 lg:gap-y-6   ",
        bg,
        className,
      )}
    >
      {background && (
        <div className="absolute inset-0 z-0 overflow-hidden">{background}</div>
      )}
      {label && (
        // The placement sits on a wrapper rather than on CheckButton:
        // CheckButton puts its className on both its outer link and its inner
        // box, so column classes passed straight in would move the inner box
        // out of place too.
        <div
          className={cn(
            "relative z-10 flex items-baseline justify-start px-0 lg:px-0",
            labelClassName ??
              "col-start-1 col-span-3 lg:col-start-1 lg:col-span-3 ",
          )}
        >
          <CheckButton
            label={label}
            href={href}
            size="lg"
            color="text-secondary"
            active
          />
        </div>
      )}
      {children && (
        <div
          className={cn(
            "relative z-10 w-full",
            contentClassName ??
              "col-start-1 col-span-3 lg:col-start-4 lg:col-span-9 lowercase",
          )}
        >
          {children}
        </div>
      )}
    </section>
  );
}
