import type { ThemeId } from "@/context/ThemeContext";

export type DrawingLayer = {
  id: string;
  type: "drawing";
  src: string;
  /** Center position, as a fraction of the stage's width/height (0..1). */
  x: number;
  y: number;
  /** Size, as a fraction of the stage's width/height (0..1). */
  width: number;
  height: number;
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

export type ArtboardLayer = DrawingLayer | TextLayer;

export type AspectId = "square" | "portrait" | "story" | "landscape";

export type SavedArtwork = {
  id: string;
  createdAt: number;
  themeId: ThemeId;
  aspect: AspectId;
  layers: ArtboardLayer[];
  thumbnail: string;
};
