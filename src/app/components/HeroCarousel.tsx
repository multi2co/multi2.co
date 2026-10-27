"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import VideoPlayer from "./VideoPlayer";

type HeroMedia = {
  type: "image" | "video";
  key: string;
  url: string;
  /** The editor's picked ratio — each slide renders in a box of exactly
   *  this ratio, as large as fits. */
  aspectRatio: number;
  description?: string;
};

/**
 * The project page lightbox: the work's media as a carousel. Each item is
 * shown in a box of its picked ratio, as large as fits, centred.
 *
 * No arrows: with a mouse, the cursor itself becomes a "1 of 3" counter, and
 * a click steps back on the left half, forward on the right (a drag doesn't
 * count, and clicks on a video go to its own controls). The arrow keys step
 * too. Touch has no cursor, so it swipes, with the counter shown in the
 * corner instead.
 *
 * `onSelect` reports the current index so the page can show that item's
 * caption, and `selected` is honoured back.
 */
export default function HeroCarousel({
  media,
  selected,
  onSelect,
}: {
  media: HeroMedia[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const areaRef = useRef<HTMLDivElement>(null);
  // Where the counter cursor sits, relative to the slide area; null while the
  // pointer is outside it (or isn't a mouse).
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  // Where the press started — a release that's travelled further than a few
  // px was a drag (Embla's swipe), not a click.
  const downAt = useRef<{ x: number; y: number } | null>(null);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const sync = () => onSelect(emblaApi.selectedScrollSnap());
    sync();
    emblaApi.on("select", sync);
    return () => {
      emblaApi.off("select", sync);
    };
  }, [emblaApi, onSelect]);

  // Follow `selected` when it's driven from outside, a jump with no
  // animation. The guard keeps this from fighting the `select` event above.
  useEffect(() => {
    if (!emblaApi) return;
    if (emblaApi.selectedScrollSnap() !== selected)
      emblaApi.scrollTo(selected, true);
  }, [emblaApi, selected]);

  // The arrow keys stand in for the old prev/next buttons.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") scrollPrev();
      if (e.key === "ArrowRight") scrollNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scrollPrev, scrollNext]);

  if (media.length === 0) return null;
  const multiple = media.length > 1;
  const counter = `${selected + 1} of ${media.length}`;

  return (
    <div className="relative h-full w-full">
      <div
        ref={areaRef}
        className={`h-full w-full overflow-hidden ${multiple ? "pointer-fine:cursor-none" : ""}`}
        onPointerMove={(e) => {
          if (!multiple || e.pointerType !== "mouse") return;
          const r = areaRef.current!.getBoundingClientRect();
          setCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
        }}
        onPointerLeave={() => setCursor(null)}
        onPointerDown={(e) => {
          downAt.current = { x: e.clientX, y: e.clientY };
        }}
        onClick={(e) => {
          const d = downAt.current;
          const dragged =
            d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6;
          if (!multiple || dragged) return;
          // A video's own controls keep their clicks.
          if ((e.target as HTMLElement).closest("video")) return;
          const r = areaRef.current!.getBoundingClientRect();
          if (e.clientX - r.left < r.width / 2) scrollPrev();
          else scrollNext();
        }}
      >
        <div ref={emblaRef} className="h-full w-full">
          <div className="flex h-full">
            {media.map((item, i) => (
              // `container-type: size` lets the box size itself against the
              // slide in both directions: as wide as fits, unless that would
              // be too tall, in which case as tall as fits.
              <div
                key={item.key}
                className="flex-none w-full h-full flex items-center justify-center [container-type:size]"
              >
                <div
                  className="relative overflow-hidden pixelCorners"
                  style={{
                    aspectRatio: item.aspectRatio,
                    width: `min(100cqw, calc(100cqh * ${item.aspectRatio}))`,
                  }}
                >
                  {item.type === "video" ? (
                    <VideoPlayer
                      src={item.url}
                      controls
                      className="object-cover"
                    />
                  ) : (
                    <Image
                      src={item.url}
                      alt=""
                      fill
                      priority={i === 0}
                      className="object-cover"
                      sizes="100vw"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {multiple && (
        <>
          {/* Mouse: the counter rides the pointer in place of the cursor. */}
          {cursor && (
            <span
              aria-hidden
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap h4BtnText text-primary"
              style={{ left: cursor.x, top: cursor.y }}
            >
              {counter}
            </span>
          )}
          {/* Touch (no cursor) gets it in the corner; screen readers always
              hear it. */}
          <span
            aria-live="polite"
            className="absolute bottom-3 lg:bottom-6 right-3 lg:right-6 z-10 h4BtnText text-primary pointer-fine:sr-only"
          >
            {counter}
          </span>
        </>
      )}
    </div>
  );
}
