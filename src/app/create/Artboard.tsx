"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import type { ArtboardLayer } from "./types";

type Props = {
  layers: ArtboardLayer[];
  bg: string;
  width: number;
  height: number;
  className?: string;
  onMoveLayer: (id: string, x: number, y: number) => void;
  onRemoveLayer: (id: string) => void;
};

/**
 * The centered stage. Layer positions are stored as fractions of (width,
 * height) — the logical export resolution — so they stay correct whether the
 * stage renders at phone width or a wide desktop viewport. Text layers author
 * their size in the same logical px, so a `scale` read off the stage's actual
 * rendered height converts that back to real on-screen px.
 */
export default function Artboard({
  layers,
  bg,
  width,
  height,
  className,
  onMoveLayer,
  onRemoveLayer,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.height / height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

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

  const stopDragging = () => setDraggingId(null);

  return (
    <div
      ref={stageRef}
      className={cn(
        "pixelCornersBorder relative w-full overflow-hidden select-none",
        className,
      )}
      style={{ backgroundColor: bg, aspectRatio: `${width} / ${height}` }}
      onPointerMove={handleStagePointerMove}
      onPointerUp={stopDragging}
      onPointerLeave={stopDragging}
    >
      {layers.map((layer) => (
        <div
          key={layer.id}
          className="group absolute cursor-move touch-none"
          style={
            layer.type === "drawing"
              ? {
                  left: `${layer.x * 100}%`,
                  top: `${layer.y * 100}%`,
                  width: `${layer.width * 100}%`,
                  height: `${layer.height * 100}%`,
                  transform: "translate(-50%, -50%)",
                }
              : {
                  left: `${layer.x * 100}%`,
                  top: `${layer.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                }
          }
          onPointerDown={handleLayerPointerDown(layer.id)}
        >
          {layer.type === "drawing" ? (
            // A data URL from the drawing tool — next/image gains nothing here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={layer.src}
              alt=""
              className="h-full w-full object-contain"
              draggable={false}
            />
          ) : (
            <span
              className="block whitespace-nowrap font-visual"
              style={{ color: layer.color, fontSize: `${layer.fontSize * scale}px` }}
            >
              {layer.text}
            </span>
          )}
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
}
