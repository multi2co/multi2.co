"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/** Shared easing — a soft settle, no overshoot. Matches the site's "subtle and
 *  purposeful" motion brief. */
const EASE = [0.22, 1, 0.36, 1] as const;

/** The viewport trigger: fire once, a little before the block is fully on
 *  screen so it's already settled by the time the reader reaches it. */
const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Travel distance in px. */
  y?: number;
  /** Starting scale, eased to 1 alongside the fade/lift — a slight zoom-in as
   *  the block settles into place, subtler than RevealImage's. */
  scale?: number;
  /** Seconds to wait before starting — for staggering siblings. */
  delay?: number;
  duration?: number;
  /** The notched-corner mask, same treatment as PixelFrame/LandningBlock. */
  pixelCorners?: boolean;
  /** Pins the block at the top of the viewport once scrolling reaches it, so
   *  the next `Reveal` after it scrolls up and stacks on top — a deck of
   *  cards rather than a plain scroll. Off by default: most `Reveal` callers
   *  just want the fade-and-lift. */
  sticky?: boolean;
  /** Sticky offset from the viewport top, in px. Only matters when `sticky`
   *  is set. */
  stickyTop?: number;
};

/**
 * Fades and lifts its children into place the first time they scroll into view.
 * Wraps them in a plain `div` (so it can be a grid/flex item like any other),
 * and steps aside entirely when the visitor prefers reduced motion.
 */
export function Reveal({
  children,
  className,
  id,
  y = 24,
  scale = 0.97,
  delay = 0,
  duration = 0.6,
  pixelCorners = false,
  sticky = false,
  stickyTop = 0,
}: RevealProps) {
  const reduce = useReducedMotion();
  const classes = cn(
    pixelCorners && "pixelCorners relative overflow-hidden",
    sticky && "sticky",
    className,
  );
  const style = sticky ? { top: stickyTop } : undefined;

  if (reduce)
    return (
      <div id={id} className={classes} style={style}>
        {children}
      </div>
    );

  return (
    <motion.div
      id={id}
      className={classes}
      style={style}
      initial={{ opacity: 0, y, scale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={VIEWPORT}
      transition={{ duration, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

type RevealImageProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/**
 * For media: clips its children and eases them back from a slight zoom as they
 * enter view, so images settle rather than snap. The child should fill this
 * box (an `absolute inset-0` layer or a sized element).
 */
export function RevealImage({ children, className, delay = 0 }: RevealImageProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={cn("overflow-hidden", className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      initial={{ opacity: 0, scale: 1.09 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
