"use client";

import { useRef } from "react";
import ReactPlayer from "react-player";
import { useInView } from "motion/react";
import { cn } from "@/lib/utils";
import { useSound } from "@/context/SoundContext";

/** Plays a project's video media — a direct upload or a YouTube/Vimeo URL;
 *  ReactPlayer tells the two apart from the URL itself. Volume follows the
 *  site-wide sound toggle by default, so a caller with `controls` (the
 *  lightbox) behaves like every other video on the site (ShowReel included)
 *  rather than being hard-muted, and its native volume control still lets a
 *  visitor unmute just that video without touching the site-wide toggle.
 *
 *  Passing `muted` forces this instance regardless of the toggle — only
 *  ShowReel is meant to carry the site's one audio track; every other
 *  passive background video (the home page's selected-project cards) stays
 *  silent even once a visitor has turned sound on.
 *
 *  The player only exists while it's on (or near) screen: a grid of video
 *  cards would otherwise download and decode every clip at once. */
export default function VideoPlayer({
  src,
  className,
  controls = false,
  muted: mutedProp,
}: {
  src: string;
  className?: string;
  controls?: boolean;
  muted?: boolean;
}) {
  const { muted: soundMuted, volume } = useSound();
  const muted = mutedProp ?? soundMuted;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "200px" });

  return (
    <div ref={ref} className="h-full w-full">
      {inView && (
        <ReactPlayer
          src={src}
          autoPlay
          loop={!controls}
          controls={controls}
          muted={muted}
          volume={volume}
          playsInline
          className={cn("object-cover", className)}
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
}
