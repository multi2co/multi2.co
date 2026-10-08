"use client";

import { motion } from "motion/react";

// Seconds per character. Exported so callers that need to time themselves
// against the animation (TypedRotator) can't drift out of sync with it.
export const TYPING_INTERVAL = 0.022;
export const ERASING_INTERVAL = 0.014;

const letterVariants = {
  visible: { display: "inline", opacity: 1, transition: { duration: 0 } },
  hidden: { display: "none", opacity: 0, transition: { duration: 0 } },
};

export default function TypedWord({
  text,
  visible = true,
  delay = 0,
  eraseDelay = 0,
  speed = 1,
  eraseSpeed,
  className,
  cursor,
  cursorClassName = "bg-current text-background",
}: {
  text: string;
  visible?: boolean;
  delay?: number;
  eraseDelay?: number;
  speed?: number;
  eraseSpeed?: number;
  className?: string;
  cursor?: boolean | string;
  /** Replaces the cursor's classes — the default knocks the glyph out of a
   *  filled block, so pass a plain colour to get a bare cursor instead. */
  cursorClassName?: string;
}) {
  const cursorChar = typeof cursor === "string" ? cursor : "_";
  const cursorDelay = delay / 1000 + text.length * TYPING_INTERVAL * speed;

  return (
    <motion.span
      className={className}
      aria-label={text}
      initial="hidden"
      animate={visible ? "visible" : "hidden"}
      variants={{
        visible: {
          transition: {
            staggerChildren: TYPING_INTERVAL * speed,
            delayChildren: delay / 1000,
          },
        },
        hidden: {
          transition: {
            staggerChildren: ERASING_INTERVAL * (eraseSpeed ?? speed),
            staggerDirection: -1,
            delayChildren: eraseDelay / 1000,
          },
        },
      }}
    >
      {/* Array.from splits by code point, so characters outside the BMP
          (e.g. 🄼🅄🄻🅃🄸) stay whole instead of breaking into surrogate halves. */}
      {Array.from(text).map((char, i) => (
        <motion.span key={i} variants={letterVariants}>
          {char}
        </motion.span>
      ))}
      {cursor && visible && (
        <motion.span
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0, 0] }}
          transition={{
            delay: cursorDelay,
            duration: 1,
            repeat: Infinity,
            times: [0, 0, 0.5, 0.5, 1],
          }}
          className={cursorClassName}
        >
          {cursorChar}
        </motion.span>
      )}
    </motion.span>
  );
}
