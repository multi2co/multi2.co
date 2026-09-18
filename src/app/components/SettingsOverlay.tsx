"use client";

import { motion } from "motion/react";
import { useSound } from "@/context/SoundContext";
import { cn } from "@/lib/utils";
import CheckButton from "./CheckButton";
import { ViewToggleButtons } from "./ViewToggles";

/** The projects settings panel: the sound toggle and the view toggles
 *  (thumbnails / list / zoom). Positioning is the caller's — M2Nav hangs it off
 *  the desktop "settings" button, FilterOverlay drops it into the mobile
 *  full-screen sheet. */
export default function SettingsOverlay({ className }: { className?: string }) {
  const { muted, toggleMute } = useSound();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn("flex flex-col gap-0", className)}
    >
      <ViewToggleButtons className="lg:col-span-4" />
      {!muted && (
        <div className="lg:hidden grid grid-cols-3   space-x-0 pr-0 mb-12">
          <CheckButton
            className=""
            size="lg"
            label={muted ? "Sound Off" : "Sound On"}
            active={!muted}
            color="text-secondary"
            onClick={toggleMute}
          />
        </div>
      )}
    </motion.div>
  );
}
