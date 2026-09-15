"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { downloadDataUrl, downloadText } from "./render";

const CELL = 8;

const SIZE_PRESETS = {
  square: { w: 800, h: 800, label: "square — 800×800" },
  landscape: { w: 1200, h: 800, label: "landscape — 1200×800" },
  portrait: { w: 800, h: 1200, label: "portrait — 800×1200" },
} as const;

type SizeKey = keyof typeof SIZE_PRESETS;

/** Standard 8×8 Bayer matrix, normalized to 0..1 thresholds. A cell only
 *  paints once its accumulated ink value clears its own threshold here — the
 *  halftone trick that lets a flat fill colour read as a gradient of
 *  density. */
const BAYER8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
].map((row) => row.map((v) => (v + 0.5) / 64));

type Props = {
  ink: string;
  bg: string;
  className?: string;
  onSendToArtboard: (dataUrl: string, width: number, height: number) => void;
};

/**
 * The dithered brush tool: drag to build up an "ink" value per grid cell,
 * which `paint` turns into a halftone by comparing each cell against the
 * Bayer matrix. Ported from the multidrawing.tsx sketch onto a plain 2D
 * canvas — no p5.js — so it's just another client component here.
 */
export default function MultidrawingCanvas({
  ink,
  bg,
  className,
  onSendToArtboard,
}: Props) {
  const [sizeKey, setSizeKey] = useState<SizeKey>("square");
  const [brush, setBrush] = useState(6);
  const [density, setDensity] = useState(0.1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Float32Array>(new Float32Array(0));
  const drawingRef = useRef(false);

  const dims = SIZE_PRESETS[sizeKey];
  const cols = dims.w / CELL;
  const rows = dims.h / CELL;

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = ink;
    const grid = gridRef.current;
    for (let gy = 0; gy < rows; gy++) {
      const bRow = BAYER8[gy % 8];
      const rowOffset = gy * cols;
      for (let gx = 0; gx < cols; gx++) {
        const v = grid[rowOffset + gx];
        if (v > 0 && v > bRow[gx % 8]) {
          ctx.fillRect(gx * CELL, gy * CELL, CELL, CELL);
        }
      }
    }
  }, [bg, ink, cols, rows]);

  // A new size means a new grid — the drawing doesn't carry across a resize.
  // Deliberately keyed on [cols, rows] alone: `paint` also changes identity
  // on every ink/bg switch, and keying this reset on `paint` too would wipe
  // the grid on a palette change instead of just recolouring it.
  useEffect(() => {
    gridRef.current = new Float32Array(cols * rows);
  }, [cols, rows]);

  // Repaints on every relevant change — a new grid above, or just a
  // recolour (ink/bg) with the drawing left intact.
  useEffect(() => {
    paint();
  }, [paint]);

  const addInk = useCallback(
    (px: number, py: number) => {
      const grid = gridRef.current;
      const gx0 = px / CELL;
      const gy0 = py / CELL;
      const r = brush;
      const minGx = Math.max(0, Math.floor(gx0 - r));
      const maxGx = Math.min(cols - 1, Math.ceil(gx0 + r));
      const minGy = Math.max(0, Math.floor(gy0 - r));
      const maxGy = Math.min(rows - 1, Math.ceil(gy0 + r));
      for (let gy = minGy; gy <= maxGy; gy++) {
        for (let gx = minGx; gx <= maxGx; gx++) {
          const cx = gx + 0.5;
          const cy = gy + 0.5;
          const d = Math.hypot(cx - gx0, cy - gy0);
          if (d > r) continue;
          const falloff = 1 - d / r;
          const idx = gy * cols + gx;
          grid[idx] = Math.min(1, grid[idx] + falloff * density);
        }
      }
    },
    [brush, density, cols, rows],
  );

  const posFromEvent = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    const pos = posFromEvent(e);
    if (!pos) return;
    drawingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    addInk(pos.x, pos.y);
    paint();
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const pos = posFromEvent(e);
    if (!pos) return;
    addInk(pos.x, pos.y);
    paint();
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  const clear = () => {
    gridRef.current.fill(0);
    paint();
  };

  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    downloadDataUrl(canvas.toDataURL("image/png"), "multi2-drawing.png");
  };

  const exportSVG = () => {
    const grid = gridRef.current;
    let rects = "";
    for (let gy = 0; gy < rows; gy++) {
      const bRow = BAYER8[gy % 8];
      const rowOffset = gy * cols;
      for (let gx = 0; gx < cols; gx++) {
        const v = grid[rowOffset + gx];
        if (v > 0 && v > bRow[gx % 8]) {
          rects += `<rect x="${gx * CELL}" y="${gy * CELL}" width="${CELL}" height="${CELL}" fill="${ink}"/>`;
        }
      }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dims.w}" height="${dims.h}" viewBox="0 0 ${dims.w} ${dims.h}"><rect width="100%" height="100%" fill="${bg}"/>${rects}</svg>`;
    downloadText(svg, "image/svg+xml", "multi2-drawing.svg");
  };

  const sendToArtboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSendToArtboard(canvas.toDataURL("image/png"), dims.w, dims.h);
  };

  return (
    <div className={cn("flex flex-col gap-y-4", className)}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Select value={sizeKey} onValueChange={(v) => setSizeKey(v as SizeKey)}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SIZE_PRESETS).map(([key, preset]) => (
              <SelectItem key={key} value={key} className="lowercase">
                {preset.label}
              </SelectItem>
            ))}
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

        <Button variant="ghost" size="sm" onClick={clear}>
          clear
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        width={dims.w}
        height={dims.h}
        className="max-w-full touch-none self-center border border-primary/40"
        style={{ width: "min(70vw, 55vh)", height: "auto" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />

      <div className="flex flex-wrap gap-x-3 gap-y-2">
        <Button variant="secondary" size="sm" onClick={exportPNG}>
          save png
        </Button>
        <Button variant="secondary" size="sm" onClick={exportSVG}>
          save svg
        </Button>
        <Button variant="default" size="sm" onClick={sendToArtboard}>
          export to artboard
        </Button>
      </div>
    </div>
  );
}
