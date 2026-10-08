"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
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
 *  cards would otherwise download and decode every clip at once.
 *
 *  Only project pages autoplay. Everywhere else (the archive grid, the home
 *  page's featured cards) a video sits on its first frame and plays while
 *  the pointer is over it. */
/** Third-party players without their tracking cookies: YouTube is played
 *  from its youtube-nocookie domain, and Vimeo gets `dnt` (do not track). */
const NO_TRACKING_CONFIG = { vimeo: { dnt: true } };
function toNoCookieSrc(src: string) {
  const id = src.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/,
  )?.[1];
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : src;
}

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
  const { playbackMuted: soundMuted, volume } = useSound();
  const muted = mutedProp ?? soundMuted;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "200px" });

  const hoverOnly = !(usePathname()?.startsWith("/projects/") ?? false);
  const [hovered, setHovered] = useState(false);
  // Driven imperatively: play() rejects when the browser blocks it, and that
  // rejection has to be caught rather than left unhandled.
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!hoverOnly) return;
    const el = videoRef.current;
    if (!el) return;
    if (hovered) el.play()?.catch(() => {});
    else el.pause();
  }, [hovered, hoverOnly, inView]);

  return (
    <div
      ref={ref}
      className="h-full w-full"
      {...(hoverOnly
        ? {
            onPointerEnter: () => setHovered(true),
            onPointerLeave: () => setHovered(false),
          }
        : {})}
    >
      {inView && (
        <ReactPlayer
          ref={videoRef}
          src={toNoCookieSrc(src)}
          config={NO_TRACKING_CONFIG}
          autoPlay={!hoverOnly}
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
