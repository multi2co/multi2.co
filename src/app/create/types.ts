import type { ThemeId } from "@/context/ThemeContext";
import type { IconStyle } from "@/context/IconStyleContext";

export type InkGrid = {
  cols: number;
  rows: number;
  iconStyle: IconStyle;
  /** Sparse: [cell index, density 0..1] pairs for every non-empty cell —
   *  the same raw grid the live canvas paints from, so a saved artwork can
   *  either resume live drawing or regenerate a true vector SVG. */
  cells: [number, number][];
};

export type TextLayer = {
  id: string;
  type: "text";
  text: string;
  x: number;
  y: number;
  color: string;
  /** Font size in stage px (the stage renders at STAGE_SIZES[aspect].h). */
  fontSize: number;
};

export type AspectId = "square" | "portrait" | "story" | "landscape";

export type SavedArtwork = {
  id: string;
  createdAt: number;
  themeId: ThemeId;
  aspect: AspectId;
  layers: TextLayer[];
  /** The artboard's own drawing — a flattened PNG, transparent elsewhere.
   *  Undefined if nothing was ever drawn. */
  drawing?: string;
  /** The live ink grid, when this artwork still has one — absent only for
   *  artworks saved before grids were persisted, which fall back to
   *  `drawing` as a raster-only backdrop. */
  ink?: InkGrid;
  thumbnail: string;
};
