"use client";

import { cn } from "@/lib/utils";
import type { SavedArtwork } from "./types";

type Props = {
  artworks: SavedArtwork[];
  className?: string;
  onLoad: (artwork: SavedArtwork) => void;
  onRemove: (id: string) => void;
  onExportSVG: (artwork: SavedArtwork) => void;
};

/** A horizontal strip of saved artboards — load one back for further
 *  editing, drop it, or pull its SVG straight out without loading it first.
 *  Everything here lives in localStorage only. */
export default function SavedArtworks({
  artworks,
  className,
  onLoad,
  onRemove,
  onExportSVG,
}: Props) {
  if (artworks.length === 0) return null;

  return (
    <div className={cn("flex gap-x-3 overflow-x-auto pb-1", className)}>
      {artworks.map((artwork) => (
        <div key={artwork.id} className="group relative shrink-0">
          <button
            type="button"
            onClick={() => onLoad(artwork)}
            className="block h-20 w-20 cursor-pointer overflow-hidden border border-primary/30 bg-transparent"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artwork.thumbnail}
              alt="Saved artwork"
              className="h-full w-full object-cover"
            />
          </button>
          <button
            type="button"
            aria-label="Delete saved artwork"
            onClick={() => onRemove(artwork.id)}
            className="absolute -top-2 -right-2 hidden h-5 w-5 items-center justify-center border border-primary bg-background text-xs leading-none text-primary group-hover:flex"
          >
            ×
          </button>
          <button
            type="button"
            onClick={() => onExportSVG(artwork)}
            className="absolute inset-x-0 bottom-0 hidden h-5 items-center justify-center bg-background text-[10px] leading-none text-primary group-hover:flex"
          >
            svg
          </button>
        </div>
      ))}
    </div>
  );
}
