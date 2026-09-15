"use client";

import { useCallback, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import CheckButton from "@/app/components/CheckButton";
import { THEMES, type ThemeId } from "@/context/ThemeContext";
import Artboard from "./Artboard";
import MultidrawingCanvas from "./MultidrawingCanvas";
import TextTool from "./TextTool";
import PaletteSwitcher from "./PaletteSwitcher";
import SavedArtworks from "./SavedArtworks";
import { useSavedArtworks } from "./useSavedArtworks";
import { renderArtboard, downloadDataUrl, makeThumbnail } from "./render";
import { STAGE_SIZES } from "./constants";
import type { ArtboardLayer, AspectId, SavedArtwork } from "./types";

export default function CreatePage() {
  const [themeId, setThemeId] = useState<ThemeId>("red");
  const [aspect, setAspect] = useState<AspectId>("square");
  const [layers, setLayers] = useState<ArtboardLayer[]>([]);
  const [drawingOpen, setDrawingOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);

  const { artworks, save, remove } = useSavedArtworks();

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const stage = STAGE_SIZES[aspect];

  const addDrawingLayer = useCallback(
    (src: string, w: number, h: number) => {
      const width = 0.6;
      const height = width * (h / w) * (stage.w / stage.h);
      setLayers((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "drawing",
          src,
          x: 0.5,
          y: 0.5,
          width,
          height,
        },
      ]);
      setDrawingOpen(false);
    },
    [stage.w, stage.h],
  );

  const addTextLayer = useCallback(
    (text: string, fontSize: number) => {
      setLayers((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "text",
          text,
          x: 0.5,
          y: 0.5,
          color: theme.ink,
          fontSize,
        },
      ]);
      setTextOpen(false);
    },
    [theme.ink],
  );

  const moveLayer = useCallback((id: string, x: number, y: number) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, x, y } : l)));
  }, []);

  const removeLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clearArtboard = useCallback(() => setLayers([]), []);

  const downloadArtboardPNG = useCallback(async () => {
    const canvas = await renderArtboard(layers, theme.bg, stage.w, stage.h);
    downloadDataUrl(canvas.toDataURL("image/png"), "multi2-artboard.png");
  }, [layers, theme.bg, stage.w, stage.h]);

  const saveArtwork = useCallback(async () => {
    const canvas = await renderArtboard(layers, theme.bg, stage.w, stage.h);
    const thumbnail = await makeThumbnail(canvas);
    save({ themeId, aspect, layers, thumbnail });
  }, [layers, theme.bg, stage.w, stage.h, themeId, aspect, save]);

  const loadArtwork = useCallback((artwork: SavedArtwork) => {
    setThemeId(artwork.themeId);
    setAspect(artwork.aspect);
    setLayers(artwork.layers);
  }, []);

  const canExport = layers.length > 0;

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-start justify-start gap-y-8 px-3 py-16 lg:px-6">
      <div className="fixed top-0 left-0 z-40 flex w-full flex-wrap items-center justify-center gap-x-8 gap-y-3">
        <CheckButton
          label="multidrawing"
          size="md"
          active={drawingOpen}
          onClick={() => setDrawingOpen((v) => !v)}
        />
        <CheckButton
          label="text"
          size="md"
          active={textOpen}
          onClick={() => setTextOpen((v) => !v)}
        />

        <PaletteSwitcher value={themeId} onChange={setThemeId} />

        <Select value={aspect} onValueChange={(v) => setAspect(v as AspectId)}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STAGE_SIZES).map(([key, preset]) => (
              <SelectItem key={key} value={key} className="lowercase">
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-full max-w-2xl flex-col items-center gap-y-8">
        <Artboard
          layers={layers}
          bg={theme.bg}
          width={stage.w}
          height={stage.h}
          onMoveLayer={moveLayer}
          onRemoveLayer={removeLayer}
          className="max-w-[min(88vw,60dvh)]"
        />

        {drawingOpen && (
          <MultidrawingCanvas
            ink={theme.ink}
            bg={theme.bg}
            onSendToArtboard={addDrawingLayer}
            className="w-full items-center"
          />
        )}

        {textOpen && (
          <TextTool
            color={theme.ink}
            onAdd={addTextLayer}
            className="justify-center"
          />
        )}

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearArtboard}
            disabled={!canExport}
          >
            clear artboard
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={downloadArtboardPNG}
            disabled={!canExport}
          >
            download png
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={saveArtwork}
            disabled={!canExport}
          >
            save artwork
          </Button>
        </div>

        <SavedArtworks
          artworks={artworks}
          onLoad={loadArtwork}
          onRemove={remove}
          className="w-full"
        />
      </div>
    </div>
  );
}
