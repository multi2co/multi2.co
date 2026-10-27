"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import CheckButton from "./CheckButton";

/** Full-screen "under construction" gate, switched on and off from Site
 *  Settings in the Studio. While on it shows on every load; the close button
 *  top-right dismisses it for the rest of the visit. */
export default function UnderConstruction() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const { underConstruction } = useSiteSettings();

  // Editors in Sanity Studio never need the gate.
  if (!underConstruction || !open || pathname?.startsWith("/studio"))
    return null;

  return (
    <div className="fixed top-0 left-0 h-dvh w-full z-[300]  flex-col items-start justify-center gap-y-6 py-12 px-6 text-left bg-background  flex">
      <CheckButton
        label="close"
        active
        size="label"
        color="text-primary"
        onClick={() => setOpen(false)}
        className="absolute top-6 right-6"
      />
      {/* Not headings: the gate shouldn't compete with the page's own h1. */}
      <p className="font-visual h1Text text-primary leading-[0.9]">
        under construction
      </p>
      <p className="font-visual h2Text text-primary">
        {"("}multi2.co coming soon{")"}
      </p>
    </div>
  );
}
