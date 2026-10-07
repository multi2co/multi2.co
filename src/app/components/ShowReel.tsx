"use client";

import { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { cn } from "@/lib/utils";
import { useSound } from "@/context/SoundContext";

/**
 * Full-height reel at the top of the home page. Scrolling past it reveals
 * the projects section underneath.
 *
 * `src` comes from the `showreel` document in Sanity; the same file is used at
 * every width. With no reel uploaded, the section just shows its background.
 */
export default function ShowReel({
  className = "",
  src,
}: {
  className?: string;
  src?: string;
}) {
  const { playbackMuted: muted, volume } = useSound();
  const [playing, setPlaying] = useState(true);

  // Driven imperatively rather than through ReactPlayer's `playing` prop:
  // play() rejects with NotAllowedError when autoplay is blocked, and that
  // rejection has to be caught and folded back into state or the UI claims
  // to be playing while the video sits paused.
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [playing]);

  return (
    <section
      className={cn(
        "relative h-screen p-6 bg-secondary w-full overflow-hidden",
        className,
      )}
      aria-label="Showreel"
    >
      {src && (
        <ReactPlayer
          ref={videoRef}
          src={src}
          // muted autoplay is the one form browsers permit without a gesture
          autoPlay
          muted={muted}
          volume={volume}
          loop
          playsInline
          // native media events pass straight through in react-player v3
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </section>
  );
}
