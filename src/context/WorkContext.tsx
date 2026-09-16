"use client";

import { createContext, useContext, type ReactNode } from "react";

export type GridItem = {
  key: string;
  url: string;
  /** What `url` (and `coverUrl`, when present) actually is. Omitted means
   *  "image" — every item predating video support in the grid stays that. */
  mediaType?: "image" | "video";
  alt: string;
  slug: string;
  title: string;
  client?: string;
  year?: number;
  createdAt?: string;
  credits?: unknown;
  description?: string;
  categories: string[];
  aspectRatio: number;
  /** The work's own square cover — a different asset from the media
   *  images, so `url` is not a stand-in for it. */
  coverUrl?: string;
  /** "Featured on homepage" toggle in the CMS — drives the selected-projects
   *  block on the landing page. */
  featured?: boolean;
  isPrimary: boolean;
  projectImages: { key: string; url: string; aspectRatio: number }[];
};

type WorkContextType = {
  items: GridItem[];
  categories: string[];
};

const WorkContext = createContext<WorkContextType>({ items: [], categories: [] });

export function WorkProvider({
  items,
  categories,
  children,
}: WorkContextType & { children: ReactNode }) {
  return (
    <WorkContext.Provider value={{ items, categories }}>
      {children}
    </WorkContext.Provider>
  );
}

export function useWork() {
  return useContext(WorkContext);
}
