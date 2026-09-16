"use client";

import Image, { type ImageProps } from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { usePixelCorners } from "@/app/hooks/usePixelCorners";
import { cn } from "@/lib/utils";
import VideoPlayer from "./VideoPlayer";

type Props = ImageProps & {
  /** Sizing for the frame: aspect ratio, width, margins — whatever the layout
   *  needs. The image fills it. */
  className?: string;
  /** Passed to the inner <Image>; defaults to `object-cover`. */
  imageClassName?: string;
  /** Ease the picture back from a slight zoom the first time the frame scrolls
   *  into view. Clipped by the frame, so it reads as a settle, not a jump. */
  revealOnView?: boolean;
  /** Seconds to delay that reveal — for staggering a row of frames. */
  revealDelay?: number;
  /** "video" plays `src` with VideoPlayer instead of rendering it as an
   *  <Image> — same frame, same corner clipping. */
  mediaType?: "image" | "video";
};

/**
 * An image in a pixel-notched box — the same corner treatment the buttons and
 * landing blocks get. The `.pixelCorners` mask and `overflow-hidden` sit on the
 * frame, so the picture is clipped to the notched shape. Give the frame its
 * size (an aspect ratio or explicit dimensions); the `fill` image takes the
 * rest.
 */
export default function PixelFrame({
  className,
  imageClassName,
  alt,
  revealOnView = false,
  revealDelay = 0,
  mediaType = "image",
  ...image
}: Props) {
  const ref = usePixelCorners<HTMLDivElement>();
  const reduce = useReducedMotion();

  const img =
    mediaType === "video" ? (
      <VideoPlayer
        src={image.src as string}
        className={cn("object-cover", imageClassName)}
      />
    ) : (
      <Image
        alt={alt}
        fill
        className={cn("object-cover", imageClassName)}
        {...image}
      />
    );

  return (
    <div
      ref={ref}
      className={cn("pixelCorners relative overflow-hidden", className)}
    >
      {revealOnView && !reduce ? (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.09, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "0px 0px -12% 0px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: revealDelay }}
        >
          {img}
        </motion.div>
      ) : (
        img
      )}
    </div>
  );
}
