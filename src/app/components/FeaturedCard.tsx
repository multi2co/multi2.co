"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { GridItem } from "@/context/WorkContext";
import PixelFrame from "./PixelFrame";
import CheckButton from "./CheckButton";

const MotionLink = motion.create(Link);

/**
 * A project card for the home page's selected projects (two-up on desktop).
 *
 * The grid span is the caller's — pass it through `className`; the card itself
 * only claims a single cell (`col-span-1`).
 *
 * With `captionBelow`, the client and title sit in a caption under the image
 * (client in `pText`, title in `h4BtnText`). Without it — the treatment the
 * home page uses — the client sits below the image as a CheckButton marker on
 * mobile, and on desktop a caption column to the left of the image holds the
 * client at the top and the project's categories at the bottom, all as
 * CheckButton markers.
 *
 * With `revealOnView`, the card also scales up from 0.9 and fades in the first
 * time it scrolls into view.
 */
export default function FeaturedCard({
  project,
  revealOnView = false,
  captionBelow = false,
  className,
}: {
  project: GridItem;
  revealOnView?: boolean;
  captionBelow?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();

  const reveal =
    revealOnView && !reduce
      ? {
          initial: { opacity: 0, scale: 1 },
          whileInView: { opacity: 1, scale: 1 },
          viewport: { once: true, margin: "0px 0px 0px 0px" },
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
        }
      : {};

  return (
    <MotionLink
      {...reveal}
      href={`/projects/${project.slug}`}
      className={cn(
        "col-span-1 group  relative w-full mb-0 lg:mb-0",
        captionBelow
          ? "flex flex-col gap-0 lg:gap-0"
          : "grid grid-cols-3 lg:flex lg:flex-row lg:items-stretch gap-0 lg:gap-0",
        className,
      )}
    >
      <div
        className={cn(
          "relative w-full pl-3",
          !captionBelow && "col-span-3 lg:flex-1 lg:min-w-0",
        )}
      >
        <PixelFrame
          src={project.coverUrl ?? project.url}
          alt={project.alt}
          sizes={
            captionBelow
              ? "(max-width: 1024px) 100vw, 25vw"
              : "(max-width: 1024px) 100vw, 33vw"
          }
          className="w-full aspect-square "
        />
      </div>

      {!captionBelow && (
        /* Desktop: caption column to the left of the image — client at the top,
           the project's categories listed at the bottom, level with the image
           edge. None are links; the whole card already is, and each CheckButton
           flips its fill on card hover via `group`. */
        <div className="hidden lg:flex lg:flex-col lg:w-1/2 justify-between lg:shrink-0 gap-2">
          {project.client && (
            <CheckButton
              size="lg"
              label={project.client}
              active
              className="h4BtnText"
            />
          )}
        </div>
      )}
      {project.client && !captionBelow && (
        /* Mobile: client name as a checkbox marker below the card. */
        <div className="lg:hidden col-span-3">
          <CheckButton
            size="lg"
            label={project.client}
            active
            className="h2Text"
          />
        </div>
      )}

      {captionBelow && (
        /* The caption sits under the image: client above, title below. */
        <div className="w-full flex flex-col gap-0 lg:gap-0">
          <CheckButton
            size="lg"
            label={project.client}
            active
            className="h4BtnText"
          />
        </div>
      )}
    </MotionLink>
  );
}
