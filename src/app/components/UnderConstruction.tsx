"use client";

import { useEffect, useState } from "react";
import { THEMES, useTheme } from "@/context/ThemeContext";
import CheckButton from "./CheckButton";
import ColorButton from "./ColorButton";

/** Dismissal sticks across reloads (bump the suffix to re-show it to everyone). */
const STORAGE_KEY = "multi2-under-construction-dismissed-v2";

export default function UnderConstruction() {
  const { theme, cycleTheme } = useTheme();
  const [dismissed, setDismissed] = useState(false);
  // Hold the gate closed until we've read localStorage, so returning visitors
  // don't get a flash of the overlay before the effect clears it.
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setDismissed(true);
    } catch {}
    setChecked(true);
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  }

  if (!checked || dismissed) return null;

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div className="fixed top-0 left-0 h-dvh w-full z-[300] flex flex-col items-start justify-center gap-y-6 py-12 px-6 text-left bg-background ">
      <CheckButton
        label="close"
        active
        size="label"
        color="text-secondary"
        onClick={dismiss}
        className="absolute top-6 left-6"
      />
      <ColorButton
        label={current.label}
        active
        onClick={cycleTheme}
        className="absolute top-6 right-6 w-auto h-auto px-0"
      />
      <h1 className="font-visual h1Text text-primary leading-[0.9]  ">
        under construction
      </h1>
      <h2 className="font-visual h2Text text-primary   ">
        {"("}multi2.co coming soon{")"}
      </h2>
    </div>
  );
}
