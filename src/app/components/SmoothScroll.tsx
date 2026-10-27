"use client";

import type { ReactNode } from "react";
import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const pathname = usePathname();

  if (reduce || pathname?.startsWith("/studio")) return <>{children}</>;

  return (
    <ReactLenis
      root
      options={{
        duration: 1.1,
        // Gentle exponential ease-out — quick to respond, soft to land.
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        touchMultiplier: 1.6,
      }}
    >
      {children}
    </ReactLenis>
  );
}
