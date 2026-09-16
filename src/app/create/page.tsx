"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import CheckButton from "@/app/components/CheckButton";
import { THEMES, type ThemeId } from "@/context/ThemeContext";
import type { IconStyle } from "@/context/IconStyleContext";
import Artboard, { type ArtboardHandle } from "./Artboard";
import TextTool from "./TextTool";
import PaletteSwitcher from "./PaletteSwitcher";
import SavedArtworks from "./SavedArtworks";
import { useSavedArtworks } from "./useSavedArtworks";
import {
  renderArtboard,
  renderArtworkSVG,
  downloadDataUrl,
  downloadText,
  copyTextToClipboard,
  makeThumbnail,
} from "./render";
import { STAGE_SIZES } from "./constants";
import type { AspectId, SavedArtwork, TextLayer } from "./types";

export default function CreatePage() {
  const [themeId, setThemeId] = useState<ThemeId>("red");
  const [aspect, setAspect] = useState<AspectId>("square");
  const [layers, setLayers] = useState<TextLayer[]>([]);
  const [brushOpen, setBrushOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [iconStyle, setIconStyle] = useState<IconStyle>("square");
  const [brush, setBrush] = useState(6);
  const [density, setDensity] = useState(0.1);

  const artboardRef = useRef<ArtboardHandle>(null);
  // Restoring a loaded artwork's drawing has to wait until Artboard has
  // re-rendered at that artwork's own aspect — otherwise its grid (sized for
  // the old aspect) won't line up. `loadTick` always changes on a load, so
  // this fires exactly once per load even when the aspect happens to match.
  const pendingLoadRef = useRef<SavedArtwork | null>(null);
  const [loadTick, setLoadTick] = useState(0);
  const { artworks, save, remove } = useSavedArtworks();

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const stage = STAGE_SIZES[aspect];

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

  const clearArtboard = useCallback(() => {
    setLayers([]);
    artboardRef.current?.clearDrawing();
  }, []);

  const downloadArtboardPNG = useCallback(async () => {
    const drawing = await artboardRef.current?.exportDrawing();
    const canvas = await renderArtboard(
      layers,
      drawing,
      theme.bg,
      stage.w,
      stage.h,
    );
    downloadDataUrl(canvas.toDataURL("image/png"), "multi2-artboard.png");
  }, [layers, theme.bg, stage.w, stage.h]);

  const downloadArtboardSVG = useCallback(() => {
    const svg = renderArtworkSVG({
      themeId,
      layers,
      ink: artboardRef.current?.exportInk(),
      w: stage.w,
      h: stage.h,
    });
    downloadText(svg, "image/svg+xml", "multi2-artboard.svg");
  }, [themeId, layers, stage.w, stage.h]);

  const copyArtboardSVG = useCallback(async () => {
    const svg = renderArtworkSVG({
      themeId,
      layers,
      ink: artboardRef.current?.exportInk(),
      w: stage.w,
      h: stage.h,
    });
    const copied = await copyTextToClipboard(svg);
    if (!copied) window.alert("Couldn't copy — your browser blocked it.");
  }, [themeId, layers, stage.w, stage.h]);

  const saveArtwork = useCallback(async () => {
    const ink = artboardRef.current?.exportInk();
    const drawing = await artboardRef.current?.exportDrawing();
    const canvas = await renderArtboard(
      layers,
      drawing,
      theme.bg,
      stage.w,
      stage.h,
    );
    const thumbnail = await makeThumbnail(canvas);
    save({ themeId, aspect, layers, drawing, ink, thumbnail });
  }, [layers, theme.bg, stage.w, stage.h, themeId, aspect, save]);

  const loadArtwork = useCallback((artwork: SavedArtwork) => {
    pendingLoadRef.current = artwork;
    setThemeId(artwork.themeId);
    setAspect(artwork.aspect);
    setLayers(artwork.layers);
    if (artwork.ink) setIconStyle(artwork.ink.iconStyle);
    setLoadTick((t) => t + 1);
  }, []);

  // Runs after the aspect/theme/layers state above has committed and Artboard
  // has re-rendered at the loaded artwork's own resolution — see the
  // `pendingLoadRef` comment.
  useEffect(() => {
    const artwork = pendingLoadRef.current;
    if (!artwork) return;
    pendingLoadRef.current = null;
    artboardRef.current?.loadDrawing({
      backdrop: artwork.drawing,
      ink: artwork.ink,
    });
  }, [loadTick]);

  const exportSavedArtworkSVG = useCallback((artwork: SavedArtwork) => {
    const savedStage = STAGE_SIZES[artwork.aspect];
    const svg = renderArtworkSVG({
      themeId: artwork.themeId,
      layers: artwork.layers,
      ink: artwork.ink,
      drawing: artwork.drawing,
      w: savedStage.w,
      h: savedStage.h,
    });
    downloadText(svg, "image/svg+xml", "multi2-artboard.svg");
  }, []);

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-primary-foreground gap-y-8 px-3 py-16 lg:px-6">
      <div className="fixed top-8 left-0 z-40 grid grid-cols-4 w-full items-center justify-center pb-0 ">
        <span className="col-span-1">
          <CheckButton
            label="brush"
            size="lg"
            active={brushOpen}
            onClick={() => setBrushOpen((v) => !v)}
          />
        </span>
        <span className="col-span-1">
          <CheckButton
            label="text"
            size="lg"
            active={textOpen}
            onClick={() => setTextOpen((v) => !v)}
          />
        </span>
        <span className="col-span-1">
          <PaletteSwitcher value={themeId} onChange={setThemeId} />
        </span>
        <span className="col-span-1">
          <Select
            value={aspect}
            onValueChange={(v) => setAspect(v as AspectId)}
          >
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
        </span>
      </div>
      <div className="flex w-full h-full items-center justify-center ">
        <Artboard
          ref={artboardRef}
          layers={layers}
          ink={theme.ink}
          iconStyle={iconStyle}
          brush={brush}
          density={density}
          width={stage.w}
          height={stage.h}
          onMoveLayer={moveLayer}
          onRemoveLayer={removeLayer}
          className="max-w-[min(88vw,60dvh)]"
        />

        {brushOpen && (
          <div className="fixed top-16 left-0 z-40 w-md flex flex-col items-start justify-start gap-x-6 gap-y-3 p-6 bg-background">
            <Select
              value={iconStyle}
              onValueChange={(v) => setIconStyle(v as IconStyle)}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="square" className="lowercase">
                  filled square
                </SelectItem>
                <SelectItem value="dot" className="lowercase">
                  filled dot
                </SelectItem>
              </SelectContent>
            </Select>

            <label className="flex items-center gap-x-3 text-sm font-visual lowercase text-primary">
              brush
              <Slider
                className="w-24"
                min={1}
                max={12}
                step={0.5}
                value={[brush]}
                onValueChange={([v]) => setBrush(v)}
              />
            </label>

            <label className="flex items-center gap-x-3 text-sm font-visual lowercase text-primary">
              density
              <Slider
                className="w-24"
                min={0.02}
                max={0.5}
                step={0.01}
                value={[density]}
                onValueChange={([v]) => setDensity(v)}
              />
            </label>
          </div>
        )}

        {textOpen && (
          <TextTool
            color={theme.ink}
            onAdd={addTextLayer}
            className="justify-center"
          />
        )}
      </div>
      <div className="fixed bottom-0 left-0 z-40 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 w-full">
        <Button variant="ghost" size="sm" onClick={clearArtboard}>
          clear artboard
        </Button>
        <Button variant="secondary" size="sm" onClick={downloadArtboardPNG}>
          download png
        </Button>
        <Button variant="secondary" size="sm" onClick={downloadArtboardSVG}>
          download svg
        </Button>
        <Button variant="ghost" size="sm" onClick={copyArtboardSVG}>
          copy svg
        </Button>
        <Button variant="default" size="sm" onClick={saveArtwork}>
          save artwork
        </Button>
      </div>

      <SavedArtworks
        artworks={artworks}
        onLoad={loadArtwork}
        onRemove={remove}
        onExportSVG={exportSavedArtworkSVG}
        className="w-full"
      />
    </div>
  );
}
