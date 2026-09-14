"use client";

import { createContext, useContext, type ReactNode } from "react";

type PortableTextBlock = { _type: string; children?: { text?: string }[] };

type AboutContextType = {
  aboutShort: string | null;
  aboutLong: string | null;
};

const AboutContext = createContext<AboutContextType>({
  aboutShort: null,
  aboutLong: null,
});

function blocksToString(blocks?: PortableTextBlock[]): string | null {
  if (!blocks) return null;
  return (
    blocks
      .map((block) => (block.children ?? []).map((c) => c.text ?? "").join(""))
      .filter(Boolean)
      .join("\n\n") || null
  );
}

export function AboutProvider({
  aboutShort,
  aboutLong,
  children,
}: {
  aboutShort?: PortableTextBlock[];
  aboutLong?: PortableTextBlock[];
  children: ReactNode;
}) {
  return (
    <AboutContext.Provider
      value={{
        aboutShort: blocksToString(aboutShort),
        aboutLong: blocksToString(aboutLong),
      }}
    >
      {children}
    </AboutContext.Provider>
  );
}

/** The "our story" copy — `short` for the home page block, `long` for /about. */
export function useAbout(variant: "short" | "long" = "short"): string | null {
  const { aboutShort, aboutLong } = useContext(AboutContext);
  return variant === "long" ? aboutLong : aboutShort;
}
