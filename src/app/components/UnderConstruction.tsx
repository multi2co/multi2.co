"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import CheckButton from "./CheckButton";

/** Full-screen "under construction" gate. Shows on every load; the close
 *  button top-right dismisses it for the rest of the visit. */
export default function UnderConstruction() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  // Editors in Sanity Studio never need the gate.
  if (!open || pathname?.startsWith("/studio")) return null;

  return (
    <div className="fixed top-0 left-0 h-dvh w-full z-[300]  flex-col items-start justify-center gap-y-6 py-12 px-6 text-left bg-background flex">
      <CheckButton
        label="close"
        active
        size="label"
        color="text-primary"
        onClick={() => setOpen(false)}
        className="absolute top-6 right-6"
      />
      <h1 className="font-visual h1Text text-primary leading-[0.9]">
        under construction
      </h1>
      <h2 className="font-visual h2Text text-primary">
        {"("}multi2.co coming soon{")"}
      </h2>
    </div>
  );
}
