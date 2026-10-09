"use client";

import { useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import TypedWord from "./TypedWord";

/**
 * Text that types itself out, once, the first time it scrolls into view — the
 * same letter-by-letter reveal as the nav's terminal button. The full text is
 * laid out invisibly underneath, so the block holds its final size from the
 * start (nothing below it shifts as it types) and the words are in the page
 * for search engines and screen readers. Reduced motion shows it at once.
 */
export default function TypeInView({
  text,
  as: Tag = "p",
  className,
}: {
  text: string;
  as?: "p" | "span" | "h2" | "h3";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });

  if (reduce) return <Tag className={className}>{text}</Tag>;

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={className}
    >
      {/* Its own positioning box, inside any padding the caller gives the
          tag, so the typed copy lands exactly on the invisible one. */}
      <span className="relative block">
        <span className="invisible">{text}</span>
        <span aria-hidden className="absolute inset-0">
          <TypedWord text={text} visible={inView} />
        </span>
      </span>
    </Tag>
  );
}
