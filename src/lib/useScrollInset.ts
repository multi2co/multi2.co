"use client";

import { useRef } from "react";
import {
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

/** Side padding that grows as an element scrolls up and out of view — from
 *  `from` px while its top is at (or below) the viewport top, to `to` px once
 *  its bottom has passed it. Put `ref` on the element and spread `style` onto
 *  a motion element (the same one or a child). Reduced motion keeps `from`. */
export function useScrollInset<T extends HTMLElement>(
  from: number,
  to: number,
) {
  const ref = useRef<T>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const inset = useTransform(scrollYProgress, [0, 1], [from, to]);
  const style: { paddingInline: number | MotionValue<number> } = {
    paddingInline: reduce ? from : inset,
  };
  return { ref, style };
}
