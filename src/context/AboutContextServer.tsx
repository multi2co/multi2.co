import React from "react";
import { sanityFetch } from "../../sanity/lib/client";
import { aboutQuery } from "../../sanity/lib/queries";
import { AboutProvider } from "./AboutContext";

type PortableTextBlock = { _type: string; children?: { text?: string }[] };

type AboutDoc = {
  aboutShort?: PortableTextBlock[];
  aboutLong?: PortableTextBlock[];
};

export async function AboutContextServer({
  children,
}: {
  children: React.ReactNode;
}) {
  let about: AboutDoc | null = null;
  try {
    about = await sanityFetch<AboutDoc | null>(aboutQuery);
  } catch (error) {
    // Sanity unreachable — render with no copy rather than crashing.
    console.error("AboutContextServer: Sanity fetch failed", error);
  }

  return (
    <AboutProvider aboutShort={about?.aboutShort} aboutLong={about?.aboutLong}>
      {children}
    </AboutProvider>
  );
}
