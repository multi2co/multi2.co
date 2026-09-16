"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { cn } from "@/lib/utils";
import type { IconStyle } from "@/context/IconStyleContext";
import { BAYER8, CELL } from "./dither";
import type { InkGrid, TextLayer } from "./types";

export type ArtboardHandle = {
  /** The current drawing flattened to one PNG (backdrop + live ink),
   *  transparent elsewhere — undefined if nothing's ever been drawn. */
  exportDrawing: () => Promise<string | undefined>;
  /** The live ink grid, sparse — undefined if nothing's been drawn since the
   *  last load/clear. Lets a save regenerate a true vector SVG later. */
  exportInk: () => InkGrid | undefined;
  /** Restores a saved drawing. An `ink` grid is preferred — it's restored
   *  exactly, so drawing can carry on where it left off. Falling back to
   *  `backdrop` (a flattened raster) is only for artworks saved before ink
   *  grids were persisted; live ink still starts fresh on top of it. Pass
   *  neither to clear. */
  loadDrawing: (data: { backdrop?: string; ink?: InkGrid }) => void;
  /** Clears both the backdrop and any live ink. */
  clearDrawing: () => void;
};

type Props = {
  layers: TextLayer[];
  ink: string;
  iconStyle: IconStyle;
  brush: number;
  density: number;
  width: number;
  height: number;
  className?: string;
  onMoveLayer: (id: string, x: number, y: number) => void;
  onRemoveLayer: (id: string) => void;
};

/**
 * The centered stage — a live drawing canvas (the same dithered halftone
 * brush the standalone tool used to own) with text layers positioned on top.
 * Layer positions are stored as fractions of (width, height) — the logical
 * export resolution — so they stay correct whether the stage renders at phone
 * width or a wide desktop viewport. Text layers author their size in the same
 * logical px, so a `scale` read off the stage's actual rendered height
 * converts that back to real on-screen px.
 */
const Artboard = forwardRef<ArtboardHandle, Props>(function Artboard(
  {
    layers,
    ink,
    iconStyle,
    brush,
    density,
    width,
    height,
    className,
    onMoveLayer,
    onRemoveLayer,
  },
  ref,
) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Float32Array>(new Float32Array(0));
  const drawingRef = useRef(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [backdrop, setBackdrop] = useState<string | undefined>();

  const cols = width / CELL;
  const rows = height / CELL;

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.height / height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  // Just the ink — the backdrop (a loaded save, or nothing) is a separate
  // <img> underneath, so a repaint here never erases it.
  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = ink;
    const grid = gridRef.current;
    for (let gy = 0; gy < rows; gy++) {
      const bRow = BAYER8[gy % 8];
      const rowOffset = gy * cols;
      for (let gx = 0; gx < cols; gx++) {
        const v = grid[rowOffset + gx];
        if (v > 0 && v > bRow[gx % 8]) {
          if (iconStyle === "dot") {
            ctx.beginPath();
            ctx.arc(
              gx * CELL + CELL / 2,
              gy * CELL + CELL / 2,
              CELL / 2,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          } else {
            ctx.fillRect(gx * CELL, gy * CELL, CELL, CELL);
          }
        }
      }
    }
  }, [ink, iconStyle, cols, rows]);

  // A new stage size means a new grid — the live ink doesn't carry across an
  // aspect change (the backdrop, being a plain image, just rescales).
  // Deliberately keyed on [cols, rows] alone: `paint` also changes identity
  // on every ink/icon-style switch, and keying this reset on `paint` too
  // would wipe the grid on a recolour instead of just repainting it.
  useEffect(() => {
    gridRef.current = new Float32Array(cols * rows);
  }, [cols, rows]);

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

  const posFromCanvasEvent = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const handleCanvasPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    const pos = posFromCanvasEvent(e);
    if (!pos) return;
    drawingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    addInk(pos.x, pos.y);
    paint();
  };

  const handleCanvasPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const pos = posFromCanvasEvent(e);
    if (!pos) return;
    addInk(pos.x, pos.y);
    paint();
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  useImperativeHandle(
    ref,
    () => ({
      exportDrawing: async () => {
        const canvas = canvasRef.current;
        if (!canvas) return backdrop;
        if (!backdrop) return canvas.toDataURL("image/png");
        // Flatten backdrop + live ink into one image so a save only ever
        // carries a single drawing forward.
        const flat = document.createElement("canvas");
        flat.width = canvas.width;
        flat.height = canvas.height;
        const ctx = flat.getContext("2d");
        if (!ctx) return canvas.toDataURL("image/png");
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = backdrop;
        });
        ctx.drawImage(img, 0, 0, flat.width, flat.height);
        ctx.drawImage(canvas, 0, 0);
        return flat.toDataURL("image/png");
      },
      exportInk: () => {
        const grid = gridRef.current;
        const cells: [number, number][] = [];
        for (let i = 0; i < grid.length; i++) {
          if (grid[i] > 0) cells.push([i, Math.round(grid[i] * 1000) / 1000]);
        }
        if (cells.length === 0) return undefined;
        return { cols, rows, iconStyle, cells };
      },
      loadDrawing: ({ backdrop: nextBackdrop, ink } = {}) => {
        if (ink && ink.cols === cols && ink.rows === rows) {
          const grid = new Float32Array(cols * rows);
          for (const [i, v] of ink.cells) grid[i] = v;
          gridRef.current = grid;
          setBackdrop(undefined);
        } else {
          // No grid (a pre-migration save), or it doesn't match this stage's
          // current resolution — fall back to a flattened backdrop; live ink
          // still starts fresh on top of it.
          setBackdrop(nextBackdrop);
          gridRef.current = new Float32Array(cols * rows);
        }
        paint();
      },
      clearDrawing: () => {
        setBackdrop(undefined);
        gridRef.current = new Float32Array(cols * rows);
        paint();
      },
    }),
    [backdrop, cols, rows, iconStyle, paint],
  );

  const handleLayerPointerDown = (id: string) => (e: PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingId(id);
  };

  const handleStagePointerMove = (e: PointerEvent) => {
    if (!draggingId) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    onMoveLayer(draggingId, x, y);
  };

  const stopLayerDrag = () => setDraggingId(null);

  return (
    <div
      ref={stageRef}
      className={cn(
        "pixelCorners relative w-full overflow-hidden select-none bg-background p-3",
        className,
      )}
      style={{ aspectRatio: `${width} / ${height}` }}
      onPointerMove={handleStagePointerMove}
      onPointerUp={stopLayerDrag}
      onPointerLeave={stopLayerDrag}
    >
      {backdrop && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backdrop}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      )}

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 h-full w-full touch-none"
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />

      {layers.map((layer) => (
        <div
          key={layer.id}
          className="group absolute cursor-move touch-none"
          style={{
            left: `${layer.x * 100}%`,
            top: `${layer.y * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
          onPointerDown={handleLayerPointerDown(layer.id)}
        >
          <span
            className="block whitespace-nowrap font-visual font-thin"
            style={{
              color: layer.color,
              fontSize: `${layer.fontSize * scale}px`,
            }}
          >
            {layer.text}
          </span>
          <button
            type="button"
            aria-label="Remove layer"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveLayer(layer.id);
            }}
            className="absolute -top-2 -right-2 hidden h-5 w-5 items-center justify-center border border-primary bg-background text-xs leading-none text-primary group-hover:flex"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
});

export default Artboard;
