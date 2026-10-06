"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import TypedWord, { ERASING_INTERVAL } from "./TypedWord";

const WORDS = ["multi2", "multisquared"] as const;

/** How long each word stands before it's erased. */
const HOLD_MS = 2600;
/** The pause between one word erasing and the next typing in. */
const GAP_MS = 250;

/**
 * The home hero's wordmark: types "multi2", erases it, types "multisquared",
 * and round again. With reduced motion it's just "multisquared".
 */
export default function HeroWordmark({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reduce) return;
    if (visible) {
      const t = setTimeout(() => setVisible(false), HOLD_MS);
      return () => clearTimeout(t);
    }
    const eraseMs = WORDS[index].length * ERASING_INTERVAL * 1000;
    const t = setTimeout(() => {
      setIndex((i) => (i + 1) % WORDS.length);
      setVisible(true);
    }, eraseMs + GAP_MS);
    return () => clearTimeout(t);
  }, [visible, index, reduce]);

  if (reduce) return <h2 className={className}>multisquared</h2>;

  return (
    <h2 className={className} aria-label="multisquared">
      <TypedWord key={index} text={WORDS[index]} visible={visible} />
    </h2>
  );
}
