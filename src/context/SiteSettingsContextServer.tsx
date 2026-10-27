import React from "react";
import { sanityFetch } from "../../sanity/lib/client";
import { siteSettingsQuery } from "../../sanity/lib/queries";
import { SiteSettingsProvider, type SiteSettings } from "./SiteSettingsContext";

export async function SiteSettingsContextServer({
  children,
}: {
  children: React.ReactNode;
}) {
  let settings: Partial<SiteSettings> | null = null;
  try {
    settings = await sanityFetch<Partial<SiteSettings> | null>(
      siteSettingsQuery,
      {},
      { tags: ["siteSettings"] },
    );
  } catch (error) {
    // Sanity unreachable — every switch falls back to off.
    console.error("SiteSettingsContextServer: Sanity fetch failed", error);
  }

  return (
    <SiteSettingsProvider settings={settings}>{children}</SiteSettingsProvider>
  );
}
