"use client";

import { createContext, useContext, type ReactNode } from "react";

/** The CMS's Site Settings switches, read anywhere in the client tree. */
export type SiteSettings = {
  /** The "multisquared" wordmark over the home showreel. */
  showHeroWordmark: boolean;
  /** The full-screen "under construction" gate. */
  underConstruction: boolean;
};

const DEFAULTS: SiteSettings = {
  showHeroWordmark: false,
  underConstruction: false,
};

const SiteSettingsContext = createContext<SiteSettings>(DEFAULTS);

export function SiteSettingsProvider({
  settings,
  children,
}: {
  settings?: Partial<SiteSettings> | null;
  children: ReactNode;
}) {
  return (
    <SiteSettingsContext.Provider
      value={{
        showHeroWordmark: settings?.showHeroWordmark ?? false,
        underConstruction: settings?.underConstruction ?? false,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}
