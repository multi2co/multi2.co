"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { GridItem } from "@/context/WorkContext";
import PixelFrame from "./PixelFrame";
import CheckButton from "./CheckButton";

const MotionLink = motion.create(Link);

/**
 * A project card for the home page's selected projects: a square image, then
 * the work's hero intro, its title and a "go to project" call to action.
 * Mobile stacks them; desktop puts the text in a column beside the image.
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

  return (
    <MotionLink
      {...reveal}
      href={`/projects/${project.slug}`}
      className={cn(
        "group relative w-full flex flex-col gap-6  lg:grid lg:grid-cols-6 lg:bg-background bg-transparent  pixelCorners  lg:items-stretch p-0 pb-3 lg:pb-0 lg:gap-6",
        className,
      )}
    >
      <PixelFrame
        src={project.coverUrl ?? project.url}
        mediaType={mediaType}
        videoMuted
        alt={project.alt}
        sizes="(max-width: 1024px) 100vw, 66vw"
        className="w-full aspect-square lg:min-w-0 lg:col-span-3"
      />

      {/* Intro, title, then (desktop only) the call to action — stacked under
          the image on mobile, in a column beside it on desktop. On mobile the
          whole card is the link. */}
      <div className="flex flex-col gap-6 px-6 lg:px-0 lg:pt-6 lg:col-span-3">
        {project.heroIntro && (
          <p className="pText text-primary lowercase">{project.heroIntro}</p>
        )}
        <h2 className="text-3xl lg:text-5xl font-visual text-primary lowercase font-thin">
          {project.title}
        </h2>
        <CheckButton
          label="go to project"
          size="xl"
          color="text-primary"
          className="hidden lg:flex px-0 lg:px-0"
          active
        />
      </div>
    </MotionLink>
  );
}
