"use client";

import { useCallback, useEffect, useState } from "react";
import { ARTWORKS_STORAGE_KEY, MAX_SAVED_ARTWORKS } from "./constants";
import type { SavedArtwork } from "./types";

/** Persists finished artboards to localStorage — no Sanity write. One owner
 *  for the list so the gallery strip and the save action stay in step. */
export function useSavedArtworks() {
  const [artworks, setArtworks] = useState<SavedArtwork[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ARTWORKS_STORAGE_KEY);
      if (raw) setArtworks(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = useCallback((next: SavedArtwork[]) => {
    setArtworks(next);
    try {
      localStorage.setItem(ARTWORKS_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const save = useCallback(
    (artwork: Omit<SavedArtwork, "id" | "createdAt">) => {
      const entry: SavedArtwork = {
        ...artwork,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      persist([entry, ...artworks].slice(0, MAX_SAVED_ARTWORKS));
      return entry;
    },
    [artworks, persist],
  );

  const remove = useCallback(
    (id: string) => persist(artworks.filter((a) => a.id !== id)),
    [artworks, persist],
  );

  return { artworks, save, remove };
}
