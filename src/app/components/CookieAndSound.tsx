"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSound } from "@/context/SoundContext";
import { cn } from "@/lib/utils";
import CheckButton from "./CheckButton";

/** How long the visitor gets to look at the page before we ask anything. */
const PROMPT_DELAY_MS = 6000;

/** localStorage that can't throw — private mode, disabled storage, SSR. A
 *  failed write is surfaced rather than swallowed so a broken persist doesn't
 *  go unnoticed. */
const consentStore = {
  get(key: string): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
      if (window.localStorage.getItem(key) !== value) {
        console.warn(`[consent] "${key}" did not persist to localStorage`);
      }
    } catch (err) {
      console.warn(`[consent] could not write "${key}" to localStorage`, err);
    }
  },
};

/** Dev override: keep the box on screen no matter what — no delay, stored
 *  consent ignored, and answering loops back to the first question instead of
 *  dismissing it. Set to false to restore the real flow. */
const ALWAYS_SHOW = false;

type Step = "idle" | "cookie" | "sound" | "volume";

/**
 * The consent flow, rendered as a box that matches the hero's Connect box.
 * Cookies first, then sound; `onDone` fires once nothing is left to ask —
 * including for returning visitors, who are never prompted at all.
 */
export default function CookieAndSound({
  onDone,
  className,
}: {
  /** Must be stable (useCallback) — it is an effect dependency. */
  onDone?: (soundAccepted: boolean) => void;
  className?: string;
}) {
  const [step, setStep] = useState<Step>("idle");
  const { muted, toggleMute, setMuted, markConsentSettled } = useSound();
  // The projects page (settings sheet) and the homepage (hero corner) carry
  // their own sound toggle, so the standing corner toggle stands down there.
  const pathname = usePathname();
  const hasOwnSoundToggle =
    (pathname?.startsWith("/projects") ?? false) || pathname === "/";
  // The prompt only ever asks on the home page — a visitor landing straight
  // on a project, the about page, or Sanity Studio shouldn't be greeted with
  // it.
  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) {
      setStep("idle");
      return;
    }

    // Still report in, so whatever waits on consent (the Connect box, the
    // player) settles as usual while the box stays up.
    if (ALWAYS_SHOW) {
      setStep("cookie");
      onDone?.(false);
      return;
    }

    const cookie = consentStore.get("cookie-consent");
    const sound = consentStore.get("sound-consent");

    // Returning visitors have nothing left to answer, so settle immediately
    // rather than after the delay — the Connect box waits on this. Always
    // report `false`: unmuting on load needs a gesture, and without one the
    // browser rejects play() with NotAllowedError. They still get the volume
    // toggle, which is how they supply that gesture.
    if (cookie === "declined" || sound) {
      setStep("volume");
      markConsentSettled();
      onDone?.(false);
      return;
    }

    const t = setTimeout(
      () => setStep(cookie ? "sound" : "cookie"),
      PROMPT_DELAY_MS,
    );
    return () => clearTimeout(t);
  }, [onDone, markConsentSettled, isHome]);

  function acceptCookies() {
    consentStore.set("cookie-consent", "accepted");
    setStep("sound");
  }

  // Either answer leaves the volume control in its place: "yes" unmutes and
  // offers Mute, "no" stays muted and offers Unmute.
  function answerSound(accepted: boolean) {
    consentStore.set("sound-consent", accepted ? "accepted" : "declined");
    setMuted(!accepted);
    setStep("volume");
    markConsentSettled();
    onDone?.(accepted);
  }

  // Same surface, type and button metrics as the hero's Connect box. No
  // `w-full` on the copy — in this flex row it would stretch and push the
  // buttons to the far edge, which is what justify-start is trying to avoid.
  const copy =
    "  text-sm font-visual lowercase tracking-wide text-primary-foreground    lg:max-w-lg lg:whitespace-nowrap";

  return (
    <AnimatePresence mode="wait">
      {isHome &&
        step !== "idle" &&
        !(step === "volume" && hasOwnSoundToggle) && (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "fixed z-90 bottom-3 right-3 left-3  lg:right-6 lg:left-auto   w-auto lg:w-min  px-6 py-6 lg:px-6 flex flex-col lg:flex-wrap h-auto    gap-3 items-baseline justify-end  lg:items-baseline     ",

              step === "volume"
                ? "justify-between border bg-primary border-primary-1 w-auto lg:w-xs   "
                : "justify-end lg:justify-end border  bg-primary w-auto lg:w-sm border-primary   ",
              className,
            )}
          >
            {step === "cookie" ? (
              <>
                <p className={copy}>
                  this site uses cookies to improve your experience.
                </p>
                <div className="grid grid-cols-3    gap-3 justify-start w-full  ">
                  <Button
                    variant="link"
                    className=" border-none underline underline-offset-6 px-0 w-full col-span-1 text-primary-foreground font-normal"
                    asChild
                  >
                    <Link href="/https://gdpr-info.eu/" target="_blank">
                      learn more
                    </Link>
                  </Button>
                  <Button
                    variant="secondary"
                    className="  font-normal w-full col-span-2 shadow-md"
                    onClick={() => acceptCookies()}
                  >
                    accept
                  </Button>
                </div>
              </>
            ) : step === "sound" ? (
              <>
                <p className={copy}>Enable sound?</p>
                <div className="grid grid-cols-3    gap-3 justify-start w-full   ">
                  <Button
                    variant="link"
                    size="sm"
                    className=" col-span-1 border-none underline underline-offset-6 px-0 text-primary-foreground font-normal"
                    onClick={() => answerSound(false)}
                  >
                    No
                  </Button>
                  <Button
                    variant="secondary"
                    className="col-span-2"
                    size="sm"
                    onClick={() => answerSound(true)}
                  >
                    Yes
                  </Button>
                </div>
              </>
            ) : (
              /* Answered: nothing left to say, just the volume toggle. It takes
               the full width and spreads label-left / box-right so the row's
               justify-between has something to act on. */
              <div className="flex w-full items-center gap-3">
                <CheckButton
                  className="w-full"
                  labelSide="left"
                  size="lg"
                  label={muted ? "sound off" : "sound on"}
                  active={!muted}
                  onClick={toggleMute}
                />
              </div>
            )}
          </motion.div>
        )}
    </AnimatePresence>
  );
}
