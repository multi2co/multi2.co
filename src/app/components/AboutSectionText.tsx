"use client";

import { useEffect, useState } from "react";
import { usePresence } from "motion/react";
import { useUI } from "@/context/UIContext";
import { useAbout } from "@/context/AboutContext";
import { cn } from "@/lib/utils";
import CheckButton from "./CheckButton";

const TYPING_MS_PER_CHAR = 22;
const ERASING_MS_PER_CHAR = 14;
const ERASE_SPEED = 0.2;

/**
 * The "our story" copy. Reads the About entry — `short` by default (the home
 * page block); the /about page passes `long`. `text` still overrides the
 * fetched copy when a caller wants to supply its own.
 */
export default function AboutSectionText({
  variant = "short",
  text,
  className,
  columns = false,
  label,
  href,
}: {
  /** Which About field to pull the story from. */
  variant?: "short" | "long";
  text?: string;
  /** Overrides the standalone-page padding/scroll when embedded in a column. */
  className?: string;
  /** Lays the first two paragraphs out side by side — col 4 / col 7 of the
   *  parent's 12-col grid — instead of one running block. The home page's
   *  "our story" block uses this; /about keeps the single flowing block. */
  columns?: boolean;
  /** Renders a CheckButton at col 1, alongside the columned paragraphs —
   *  the "our story" mark, sharing their grid instead of LandningBlock's
   *  separate label slot so it can't drift off their baseline. Only
   *  meaningful with `columns`. */
  label?: string;
  href?: string;
}) {
  const { notifyContentDone } = useUI();
  const body = useAbout(variant);

  const resolvedText = text ?? body ?? undefined;

  const [isPresent, safeToRemove] = usePresence();
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    setTextVisible(true);
  }, []);

  useEffect(() => {
    if (!textVisible) return;
    const doneMs = (resolvedText?.length ?? 0) * TYPING_MS_PER_CHAR;
    const t = setTimeout(notifyContentDone, doneMs);
    return () => clearTimeout(t);
  }, [textVisible, resolvedText, notifyContentDone]);

  useEffect(() => {
    if (isPresent) return;
    setTextVisible(false);
    const totalChars = resolvedText?.length ?? 0;
    const eraseMs = totalChars * ERASING_MS_PER_CHAR * ERASE_SPEED + 100;
    const t = setTimeout(safeToRemove, eraseMs);
    return () => clearTimeout(t);
  }, [isPresent, safeToRemove, resolvedText]);

  if (columns) {
    // No wrapping div here: the parent (LandningBlock's content slot) is the
    // grid this paragraph — and the label, when given one — place directly
    // into, as siblings sharing one baseline instead of two components each
    // reporting their own up through a separate grid item.
    return (
      <div
        className={cn(
          " bg-background text-secondary relative isolate w-full col-span-12 flex flex-col lg:grid grid-cols-12 items-baseline gap-y-0 justify-start h-auto ",
          className,
        )}
      >
        {label && (
          <div className="relative z-10 col-span-2 lg:col-start-1 lg:col-span-3 lg:row-start-1 gap-y-0 leading-loose space-y-0 flex items-baseline justify-start">
            <CheckButton
              label={label}
              href={href}
              size="lg"
              color="text-primary"
              active
            />
          </div>
        )}
        {/* One <p> per paragraph, each starting at col 4 and spanning eight
            on desktop — the first on the label's row. Only the paragraphs
            after the first indent their opening line by one column: on
            desktop that's 1 of the paragraph's 8 columns (12.5% of its border
            box, i.e. of its content box plus lg:px-3's 1.5rem — hence the
            extra 0.1875rem, 1/8 × 1.5rem); on mobile, a third of the
            paragraph, which has no horizontal padding there. */}
        {resolvedText?.split("\n\n").map((paragraph, i) => (
          <p
            key={i}
            className={cn(
              "col-span-3 pText font-visual font-thin tracking-normal leading-tight px-0  lg:px-3 whitespace-pre-line text-primary",
              "lg:col-start-4 lg:col-span-8",
              i === 0
                ? "lg:row-start-1"
                : "indent-[33.333%] lg:indent-[calc(12.5%+0.1875rem)]",
            )}
          >
            {paragraph}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        " flex flex-col  items-start justify-start text-primary space-y-0 lg:space-y-0   pb-3 px-3 lg:px-0   gap-y-6 w-full  ",
        className,
      )}
    >
      {resolvedText?.split("\n\n").map((paragraph, i) => (
        // Split into its own <p> per paragraph rather than one block of raw
        // "\n\n" text: `whitespace-pre-line` would keep the blank line those
        // produce no matter what the wrapper's own `space-y` is set to, since
        // that gap lives inside the single <p>'s content, not between two
        // siblings the wrapper could actually close up.
        <p
          key={i}
          className="indent-[calc(33.3vw-1rem)]  lg:indent-12 pText  px-3 lg:px-3  lg:mb-0 lowercase  lg:max-w-2xl whitespace-pre-line "
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
