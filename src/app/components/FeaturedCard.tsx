"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { GridItem } from "@/context/WorkContext";
import PixelFrame from "./PixelFrame";
import CheckButton from "./CheckButton";
import { useScrollInset } from "@/lib/useScrollInset";

const MotionLink = motion.create(Link);

/**
 * A project card for the home page's selected projects: the work's hero
 * intro, client and a "go to project" call to action, then its cover — 9:16
 * on mobile, 16:9 on desktop.
 *
 * With `revealOnView`, the card also scales up from 0.9 and fades in the
 * first time it scrolls into view.
 */
export default function FeaturedCard({
  project,
  revealOnView = false,
  className,
}: {
  project: GridItem;
  revealOnView?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();

  // The cover field is always a still image; it only wins over the work's own
  // media (which may be a video) when it's actually set.
  const usingCover = Boolean(project.coverUrl);
  const mediaType = usingCover ? "image" : (project.mediaType ?? "image");

  const reveal =
    revealOnView && !reduce
      ? {
          initial: { opacity: 0, scale: 1 },
          whileInView: { opacity: 1, scale: 1 },
          viewport: { once: true, margin: "0px 0px 0px 0px" },
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
        }
      : {};

  const href = `/projects/${project.slug}`;

  // The media's side margin grows from px-3 to px-6 as it scrolls away. The
  // list it sits in is already inset 24px, so the link pulls out by 12px
  // (`-mx-3`) and pads back in from 0 to 12.
  const mediaInset = useScrollInset<HTMLAnchorElement>(0, 12);

  // The text pins below the nav (`sticky top-16`, z-0) and the card's own
  // media (z-10) scrolls up over it, so the text reads as a background layer.
  // The card wrapper gives the sticky text room to travel — the full height
  // of text + media — and takes it away again when the card ends.
  return (
    <div className={cn("relative w-full flex flex-col gap-y-6", className)}>
      <MotionLink
        {...reveal}
        href={href}
        className="group sticky top-16 z-0 block w-full"
      >
        {/* Text row: stacked on mobile; on desktop its own 12-col grid laid
          over M2Nav's bar, so the call to action lines up under "connect"
          (col 10). The intro sits at col 1 and the client at col 7 (mobile
          runs the client inline before the intro instead). All on one row
          (`row-start-1`), sitting on the intro's last line
          (`items-baseline-last`). The buttons are `size="label"` like the
          bar's: `lg` adds its own `lg:px-3`, which `className` can't undo. */}
        <div className="flex flex-col gap-6 px-0  lg:px-3 lg:gap-x-3 lg:pt-6 lg:col-span-12 lg:grid lg:grid-cols-12 lg:items-baseline-last">
          <div className="flex flex-col gap-0 lg:pl-12 lg:pr-12 lg:row-start-1 lg:col-start-1 lg:col-span-6">
            {project.heroIntro && (
              <div className="text-3xl lg:text-4xl lg:indent-6 font-visual text-primary  font-thin leading-tight">
                {/* Mobile: the client leads, inline, with the intro running on
                    after it. Desktop has its own client cell at col 7 below.
                    (The spacing sits on a wrapper: CheckButton puts its
                    className on both its outer and inner box, so `mr-3` there
                    would apply twice.) */}
                {project.client && (
                  <span className="mr-3 lg:hidden">
                    <CheckButton
                      label={project.client}
                      size="label"
                      color="text-primary"
                      className="inline-flex"
                      active
                    />
                  </span>
                )}
                {project.heroIntro}
              </div>
            )}
          </div>
          {/* The client's own cell: desktop col 7, under M2Nav's "about".
              On mobile it only shows when there's no intro to lead. */}
          {project.client && (
            <CheckButton
              label={project.client}
              size="label"
              color="text-primary"
              className={cn(
                "lg:flex lg:row-start-1 lg:col-start-7 lg:col-span-2",
                project.heroIntro ? "hidden" : "flex",
              )}
              active
            />
          )}
          <CheckButton
            label="go to project"
            size="label"
            color="text-primary"
            className="hidden lg:flex lg:row-start-1 lg:col-start-10 lg:col-span-2 whitespace-nowrap"
            active
          />
        </div>
      </MotionLink>
      {/* Same destination as the text link above, so it's kept out of the
          tab order and the accessibility tree to avoid announcing it twice.
          `z-[95]` lifts it over the fixed nav (z-90) too, so as it scrolls up
          it covers the bar as well as the pinned text. */}
      <MotionLink
        ref={mediaInset.ref}
        style={mediaInset.style}
        href={href}
        tabIndex={-1}
        aria-hidden
        className="relative z-[95] block -mx-3"
      >
        {/* 9:16 full width on mobile, 16:9 at 75% width and centred on
            desktop — two frames, one per breakpoint,
          each with its own crop of the cover. The hidden one is never
          fetched: lazy images and VideoPlayer both wait until on screen. */}
        {/* Same motion as the home showreel: a slight rise into place, once,
            as it comes into view. */}
        <motion.div
          initial={reduce ? false : { y: 48 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <PixelFrame
            src={project.coverTallUrl ?? project.url}
            mediaType={mediaType}
            videoMuted
            videoAutoPlayOnTouch
            alt={project.alt}
            sizes="100vw"
            className="w-full aspect-[9/16] pixel-corners-2 lg:hidden"
          />
          <PixelFrame
            src={project.coverWideUrl ?? project.url}
            mediaType={mediaType}
            videoMuted
            videoAutoPlayOnTouch
            alt={project.alt}
            // Shown at 75% of the row on desktop — ask for that, not 100vw.
            sizes="75vw"
            className="hidden lg:block w-full lg:w-3/4 lg:mx-auto aspect-video lg:pixel-corners-2"
          />
        </motion.div>
      </MotionLink>
    </div>
  );
}
