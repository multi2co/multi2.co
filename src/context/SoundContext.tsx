"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

/** Routes where sound is always off — only project pages carry a sound toggle. */
const SILENT_ROUTES = new Set(["/", "/projects"]);

/** How long sound takes to fade in on unmute, and out on mute. */
const FADE_MS = 700;

type SoundContextType = {
  /** Site-wide mute. Starts on: browsers only permit muted autoplay. Always
   *  true on the home and projects pages, and reset on every route change. */
  muted: boolean;
  setMuted: (v: boolean) => void;
  toggleMute: () => void;
  /** What players should actually do — unlike `muted` (the toggle's state,
   *  which flips at once), this stays false until a fade-out has finished. */
  playbackMuted: boolean;
  /** 0–1 output level for players: fades up from 0 on unmute and back down
   *  on mute. Muting keeps the set level to come back to. */
  volume: number;
  setVolume: (v: number) => void;
};

const SoundContext = createContext<SoundContextType | null>(null);

/**
 * Output level for the whole site, not just the reel — any component that
 * plays audio reads it from here. Sits above ReelProvider so the reel is one
 * consumer among others rather than the owner.
 */
export function SoundProvider({ children }: { children: ReactNode }) {
  // `muted` is what the toggle shows; `playbackMuted` is what the players
  // get, held off during a fade-out so the fade is audible. `level` is the
  // faded output; `volumeRef` the level a fade-in heads for.
  const [muted, setMutedState] = useState(true);
  const [playbackMuted, setPlaybackMuted] = useState(true);
  const [level, setLevel] = useState(0);
  const levelRef = useRef(0);
  const volumeRef = useRef(1);
  const mutedRef = useRef(true);
  const rafRef = useRef<number | null>(null);
  const pathname = usePathname();
  const silent = SILENT_ROUTES.has(pathname ?? "");

  const stopFade = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const fadeTo = useCallback(
    (to: number, done?: () => void) => {
      stopFade();
      const from = levelRef.current;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / FADE_MS);
        const v = from + (to - from) * t;
        levelRef.current = v;
        setLevel(v);
        if (t < 1) rafRef.current = requestAnimationFrame(step);
        else {
          rafRef.current = null;
          done?.();
        }
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [stopFade],
  );

  const setMuted = useCallback(
    (m: boolean) => {
      if (m === mutedRef.current) return;
      mutedRef.current = m;
      setMutedState(m);
      if (m) {
        fadeTo(0, () => setPlaybackMuted(true));
      } else {
        setPlaybackMuted(false);
        fadeTo(volumeRef.current);
      }
    },
    [fadeTo],
  );

  const toggleMute = useCallback(() => setMuted(!mutedRef.current), [setMuted]);

  // Every page starts silent — at once, no fade; a project page only plays
  // sound once the visitor turns it on there.
  useEffect(() => {
    stopFade();
    mutedRef.current = true;
    levelRef.current = 0;
    setMutedState(true);
    setPlaybackMuted(true);
    setLevel(0);
  }, [pathname, stopFade]);

  useEffect(() => stopFade, [stopFade]);


  // Raising the level is itself an unmute — otherwise dragging the slider up
  // does nothing audible and reads as broken. A drag sets the level directly
  // rather than fading.
  const setVolume = useCallback(
    (v: number) => {
      const next = Math.min(1, Math.max(0, v));
      volumeRef.current = next;
      stopFade();
      levelRef.current = next;
      setLevel(next);
      if (next > 0) {
        mutedRef.current = false;
        setMutedState(false);
        setPlaybackMuted(false);
      }
    },
    [stopFade],
  );

  return (
    <SoundContext.Provider
      value={{
        muted: silent || muted,
        playbackMuted: silent || playbackMuted,
        setMuted,
        toggleMute,
        volume: level,
        setVolume,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used inside SoundProvider");
  return ctx;
}
