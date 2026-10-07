"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import VideoPlayer from "./VideoPlayer";
import CheckButton from "./CheckButton";

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
 * shown in a box of its picked ratio, as large as fits, pinned top-left.
 * Prev/next are CheckButtons pinned to the vertical centre of each edge; a "1
 * / 3" counter sits bottom-right. `onSelect` reports the current index so the
 * page can show that item's caption, and `selected` is honoured back — so a
 * second instance (the lightbox) stays in step. Passing `onOpen` makes the
 * slide area click to open that lightbox.
 */
export default function HeroCarousel({
  media,
  selected,
  onSelect,
  onOpen,
}: {
  media: HeroMedia[];
  selected: number;
  onSelect: (index: number) => void;
  onOpen?: () => void;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

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

  // Follow `selected` when it's driven from outside (the other instance), a
  // jump with no animation. The guard keeps this from fighting the `select`
  // event above.
  useEffect(() => {
    if (!emblaApi) return;
    if (emblaApi.selectedScrollSnap() !== selected)
      emblaApi.scrollTo(selected, true);
  }, [emblaApi, selected]);

  if (media.length === 0) return null;

  return (
    <div className="relative h-full w-full">
      <div
        className={`h-full w-full overflow-hidden ${onOpen ? "cursor-zoom-in" : ""}`}
        ref={emblaRef}
        {...(onOpen
          ? {
              onClick: onOpen,
              role: "button",
              "aria-label": "open full screen",
            }
          : {})}
      >
        <div className="flex h-full">
          {media.map((item, i) => (
            // `container-type: size` lets the box size itself against the
            // slide in both directions: as wide as fits, unless that would be
            // too tall, in which case as tall as fits.
            <div
              key={item.key}
              className="flex-none w-full h-full flex items-start justify-start [container-type:size]"
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

      {media.length > 1 && (
        <>
          <div className="absolute left-3 lg:left-6 top-1/2 -translate-y-1/2 z-10">
            <CheckButton
              onClick={scrollPrev}
              label="previous"
              markOnly
              marks={{ active: "←", inactive: "←" }}
              size="label"
              color="text-primary"
            />
          </div>

          <div className="absolute right-3 lg:right-6 top-1/2 -translate-y-1/2 z-10">
            <CheckButton
              onClick={scrollNext}
              label="next"
              markOnly
              marks={{ active: "→", inactive: "→" }}
              size="label"
              color="text-primary"
            />
          </div>

          <span className="absolute bottom-3 lg:bottom-6 right-3 lg:right-6 z-10 h4BtnText text-primary">
            {selected + 1} / {media.length}
          </span>
        </>
      )}
    </div>
  );
}
