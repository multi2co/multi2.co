import React from "react";
import { sanityFetch } from "../../sanity/lib/client";
import { siteSettingsQuery } from "../../sanity/lib/queries";
import { IconStyleProvider, type IconStyle } from "./IconStyleContext";

type SiteSettingsDoc = { iconStyle?: IconStyle };

export async function IconStyleContextServer({
  children,
}: {
  children: React.ReactNode;
}) {
  let settings: SiteSettingsDoc | null = null;
  try {
    settings = await sanityFetch<SiteSettingsDoc | null>(siteSettingsQuery);
  } catch (error) {
    // Sanity unreachable — fall back to the default square mark.
    console.error("IconStyleContextServer: Sanity fetch failed", error);
  }

  return (
    <IconStyleProvider iconStyle={settings?.iconStyle}>
      {children}
    </IconStyleProvider>
  );
}
