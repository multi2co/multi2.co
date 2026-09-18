"use client";

import { useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import { cn } from "@/lib/utils";
import { useReel } from "@/context/ReelContext";
import { useSound } from "@/context/SoundContext";

// Fallback footage for when the CMS has no showreel uploaded yet.
const FALLBACK_SRC =
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4";

/**
 * Full-height reel at the top of the home page. Scrolling past it reveals
 * the projects section underneath. The transport lives in MultiPlayer
 * (BottomNav) and talks to this through ReelContext.
 *
 * `src` comes from the `showreel` document in Sanity; the same file is used at
 * every width.
 */
export default function ShowReel({
  className = "",
  src,
}: {
  className?: string;
  src?: string;
}) {
  const {
    playing,
    setPlaying,
    setCurrentTime,
    setDuration,
    setReady,
    setReelEl,
    setPlayedThrough,
  } = useReel();
  const { muted, volume } = useSound();

  // the controls are inert while no reel is mounted, so flag it either way
  useEffect(() => {
    setReady(true);
    return () => setReady(false);
  }, [setReady]);

  // Driven imperatively rather than through ReactPlayer's `playing` prop:
  // play() rejects with NotAllowedError when autoplay is blocked, and that
  // rejection has to be caught and folded back into state or the UI claims
  // to be playing while the video sits paused.
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTimeRef = useRef(0);
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [playing, setPlaying]);

  return (
    <section
      ref={setReelEl}
      className={cn(
        "relative h-screen p-6 bg-secondary w-full overflow-hidden",
        className,
      )}
      aria-label="Showreel"
    >
      <ReactPlayer
        ref={videoRef}
        src={src || FALLBACK_SRC}
        // muted autoplay is the one form browsers permit without a gesture
        autoPlay
        muted={muted}
        volume={volume}
        loop
        playsInline
        // native media events pass straight through in react-player v3
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlayedThrough(true)}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          // `loop` restarts silently without firing `ended`, so a jump back
          // towards zero is what marks a completed pass
          if (t < lastTimeRef.current - 0.5) setPlayedThrough(true);
          lastTimeRef.current = t;
          setCurrentTime(t);
        }}
        onDurationChange={(e) => {
          const d = e.currentTarget.duration;
          setDuration(Number.isFinite(d) ? d : 0);
        }}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ width: "100%", height: "100%" }}
      />
    </section>
  );
}
