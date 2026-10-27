"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import Image, { getImageProps } from "next/image";
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
} from "motion/react";
import { useScrollInset } from "@/lib/useScrollInset";
import { cn } from "@/lib/utils";
import { useUI } from "@/context/UIContext";
import LandningBlock from "@/app/components/LandningBlock";
import CheckButton from "@/app/components/CheckButton";
import HeroCarousel from "@/app/components/HeroCarousel";
import VideoPlayer from "@/app/components/VideoPlayer";
import BottomNav from "@/app/components/BottomNav";
import Footer from "@/app/components/Footer";
import { getCategoryLabel } from "@/lib/categories";

/** One gallery item. `aspectRatio` is the ratio the editor picked in the CMS
 *  — every item is rendered in a box of exactly that ratio. */
export type ProjectMedia = {
  type: "image" | "video";
  key: string;
  url: string;
  aspectRatio: number;
  /** Alt text from the CMS, for images. */
  alt?: string;
  description?: string;
};

/** One credit line — "Creative Director: David Andersson" — split into its role
 *  and its name on the first `:` / `–` / `—`. A line with no delimiter is all
 *  role. */
function parseCredit(line: string): { role: string; name: string } {
  const match = line.match(/^(.*?)\s*[:–—]\s*(.*)$/);
  return match
    ? { role: match[1].trim(), name: match[2].trim() }
    : { role: line.trim(), name: "" };
}

/** The hero cover as one art-directed <picture>: the 16:9 image on desktop,
 *  the 9:16 one on mobile, so the browser only downloads the one it shows. */
function HeroCover({ mobile, wide }: { mobile: string; wide?: string }) {
  const common = { alt: "", fill: true, priority: true };
  const { props: img } = getImageProps({
    ...common,
    src: mobile,
    sizes: "100vw",
  });
  const wideSrcSet =
    wide && wide !== mobile
      ? getImageProps({ ...common, src: wide, sizes: "100vw" }).props.srcSet
      : undefined;
  return (
    <picture>
      {wideSrcSet && (
        <source media="(min-width: 1024px)" srcSet={wideSrcSet} sizes="100vw" />
      )}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img {...img} className="object-cover" />
    </picture>
  );
}

/**
 * One gallery item, treated like a home-page featured card's media: full
 * width on mobile, 75% and centred on desktop, in a notched frame; it rises
 * slightly into place as it comes into view (as the home showreel does on
 * load), and its side
 * margin grows from px-3 to px-6 as it scrolls away. Every item renders at
 * its own ratio from the start.
 */
/** The gallery's zoom stops — figures per row. The zoom button steps
 *  through them and wraps back to 1, like the /projects grid zoom. */
const GALLERY_COL_STEPS = [1, 2, 3, 4] as const;

function GalleryFigure({
  item,
  index,
  title,
  onOpen,
  cols,
}: {
  item: ProjectMedia;
  index: number;
  title: string;
  onOpen: () => void;
  /** How many figures share a row (the page's zoom). Past 1 the figure fills
   *  its grid cell instead of the centred 75% column. */
  cols: number;
}) {
  const compact = cols > 1;
  const reduce = useReducedMotion();
  // The gallery is inset 24px; pull out by 12 (`-mx-3`) and pad back 0 → 12.
  const inset = useScrollInset<HTMLDivElement>(0, 12);
  const label = `open fig.${index + 1} full screen`;

  return (
    // `layout` animates each figure between sizes as the zoom changes, like
    // the /projects grid.
    <motion.figure layout className="w-full flex flex-col gap-3">
      <motion.div
        ref={inset.ref}
        // The scroll-driven side inset only suits the single column; in the
        // grid it would push into the neighbouring cells.
        style={compact ? undefined : inset.style}
        className={compact ? "" : "-mx-3 lg:mx-0"}
      >
        <motion.div
          // Same motion as the home showreel: a slight rise into place,
          // once, as it comes into view.
          initial={reduce ? false : { y: 48 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <div
            style={{ aspectRatio: item.aspectRatio }}
            role="button"
            tabIndex={0}
            aria-label={label}
            onClick={onOpen}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen();
              }
            }}
            className="pixel-corners-2 relative w-full overflow-hidden cursor-zoom-in"
          >
            {item.type === "video" ? (
              <VideoPlayer src={item.url} className="object-cover" />
            ) : (
              <Image
                src={item.url}
                alt={
                  item.alt ?? item.description ?? `${title}, fig. ${index + 1}`
                }
                fill
                className="object-cover"
                sizes={
                  compact
                    ? `(max-width: 1024px) 100vw, ${Math.ceil(100 / cols)}vw`
                    : "(max-width: 1024px) 100vw, 75vw"
                }
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.figure>
  );
}

function ProjectPageInner({
  client,
  title,
  year,
  description,
  credits,
  categories,
  media,
  coverUrl,
  coverUrlWide,
  showGallery,
  galleryColumns,
}: {
  client?: string;
  title: string;
  year?: number;
  description?: string;
  credits?: string;
  categories: string[];
  media: ProjectMedia[];
  coverUrl?: string;
  coverUrlWide?: string;
  showGallery: boolean;
  /** The editor's "Gallery images per row" (Studio); empty → 2. */
  galleryColumns?: number;
}) {
  // Which carousel slide is showing — drives the caption below the hero and is
  // shared with the full-screen lightbox so the two carousels stay in step.
  const [activeSlide, setActiveSlide] = useState(0);

  const reduceMotion = useReducedMotion();
  const [lightbox, setLightbox] = useState(false);
  // The zoom button only shows while the gallery is on screen — from when it
  // reaches the lower part of the viewport until it scrolls up past the top.
  const galleryRef = useRef<HTMLDivElement>(null);
  const galleryInView = useInView(galleryRef, {
    // Ignore the top 20% too, so it goes once the gallery is scrolled up
    // behind the nav (the page can't always scroll it fully away).
    margin: "-20% 0px -25% 0px",
  });
  // The gallery's zoom: figures per row on desktop, starting from the
  // editor's pick (2 when unset) and stepped by the zoom button. Mobile is
  // always one per row.
  const [galleryCols, setGalleryCols] = useState<number>(
    (GALLERY_COL_STEPS as readonly number[]).includes(galleryColumns ?? 0)
      ? galleryColumns!
      : 2,
  );

  // The description/credits block pins 64px down (under the nav); one taller
  // than the space below that pins by its bottom edge instead.
  const textRef = useRef<HTMLDivElement>(null);
  const [stickyTop, setStickyTop] = useState(64);
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const update = () =>
      setStickyTop(Math.min(64, window.innerHeight - el.offsetHeight));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Lock the page and close on Escape while the lightbox is up.
  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox]);

  // The hero is the first video if there is one, else the work's cover (1:1
  // on mobile, 16:9 on desktop), falling back to the first media item.
  const heroVideo = media.find((m) => m.type === "video");

  // Tell the nav whether there's anything to hear: its sound toggle only
  // shows on project pages that have a video. Cleared on the way out.
  const { setPageHasVideo } = useUI();
  const hasVideo = Boolean(heroVideo);
  useEffect(() => {
    setPageHasVideo(hasVideo);
    return () => setPageHasVideo(false);
  }, [hasVideo, setPageHasVideo]);
  const heroStill = coverUrl ?? coverUrlWide ?? media[0]?.url;

  // The gallery carousel further down runs the whole media list; the cover is
  // the fallback when a work has no media of its own yet.
  const slides: ProjectMedia[] =
    media.length > 0
      ? media
      : coverUrl
        ? [{ type: "image", key: "cover", url: coverUrl, aspectRatio: 9 / 16 }]
        : [];

  return (
    // Same rhythm as the home page: every section is spaced by this one gap
    // (gap-y-12), none by margins of its own. `mt-48` is the drop below the
    // nav, not a section gap.
    <div className="relative w-full px-0 mt-48 flex flex-col gap-y-12">
      {/* Title row, then the hero — one wrapper, so the pinned title lets go
          once the hero has passed. Like the home page's featured cards: the
          title pins under the nav and the hero scrolls up over it (and over
          the nav, z-[95]). */}
      <div className="relative">
        <div className="sticky top-16 z-0 grid grid-cols-3 lg:grid-cols-12 mb-3 lg:mb-0 items-baseline px-3">
          {client && (
            <div className="hidden lg:flex col-start-1 col-span-1 lg:col-start-1 lg:col-span-3  px-0">
              <CheckButton
                size="lg"
                label={client}
                color="text-primary"
                active
              />
            </div>
          )}
          <h1 className="h2Text col-start-2 lg:col-start-4 col-span-3 lg:col-span-8 text-primary lowercase tracking-tight lg:px-3 ">
            {title}
          </h1>
        </div>

        {/* Hero: slides up from below on load, already at its final shape —
          9:16 full width on mobile, 16:9 full width on desktop. */}
        <div className="relative z-[95] px-3 lg:px-6 lg:mt-3 w-full">
          <motion.div
            initial={reduceMotion ? false : { y: "40vh" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="w-full aspect-[9/16] lg:aspect-video"
          >
            <LandningBlock
              // Solid until its media paints, so the title behind never shows
              // through.
              bg="bg-secondary text-primary"
              className="h-full w-full pixelCorners pixel-corners-2 items-start lg:px-3"
              labelClassName="col-start-1  col-span-3 px-3 lg:col-start-2 lg:col-span-3 "
              background={
                heroVideo ? (
                  <div className=" relative h-full w-full">
                    <VideoPlayer
                      src={heroVideo.url}
                      className="h-full w-full"
                    />
                  </div>
                ) : heroStill ? (
                  <div className=" relative h-full w-full">
                    <HeroCover mobile={heroStill} wide={coverUrlWide} />
                  </div>
                ) : undefined
              }
            />
          </motion.div>
        </div>
      </div>

      {/* Description + credits, then the gallery — one wrapper, so the pinned
          text lets go once the gallery has passed. Like the home page's
          featured cards: the text pins under the nav and the gallery images
          scroll up over it (and over the nav, z-[95]). */}
      <div className="relative flex flex-col gap-y-12">
        <motion.div
          ref={textRef}
          // Pinned below the nav; a block taller than the screen pins by its
          // bottom edge instead, so the credits can be read before the images
          // cover it.
          style={{ top: stickyTop }}
          className="sticky z-0 w-full px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="grid grid-cols-3 lg:grid-cols-12 gap-y-12 gap-x-6 items-start text-primary">
            <div className="col-start-1 col-span-3 lg:col-start-4 lg:col-span-7 flex flex-col gap-y-6 px-0 lg:px-0 lowercase">
              {description ? (
                <p className="pText">{description}</p>
              ) : (
                <p className="pText">
                  A bold visual concept rooted in craft and intention. Shot on
                  location, refined in post. Every frame built around a singular
                  idea — to make the ordinary feel inevitable. A bold visual
                  concept rooted in craft and intention. Shot on location,
                  refined in post. Every frame built around a singular idea — to
                  make the ordinary feel inevitable.
                </p>
              )}
            </div>

            <dl className="col-start-1 col-span-3 lg:col-start-4 lg:col-span-8 flex flex-col lg:grid lg:grid-cols-8 gap-x-6 gap-y-3 lg:gap-y-2 px-0 lg:px-0 h4BtnText lowercase text-primary [&>dt:not(:first-child)]:mt-3 lg:[&>dt:not(:first-child)]:mt-0">
              <dt className="font-normal lowercase lg:col-span-2">project</dt>
              <dd className="m-0 lg:col-span-6 uppercase font-normal">
                {title}
              </dd>
              {client && (
                <>
                  <dt className="font-normal lowercase lg:col-span-2">
                    client
                  </dt>
                  <dd className="m-0 lg:col-span-6   uppercase">{client}</dd>
                </>
              )}
              {year && (
                <>
                  <dt className="font-normal lg:col-span-2">year</dt>
                  <dd className="m-0 lg:col-span-6 font-normal">{year}</dd>
                </>
              )}
              {categories.length > 0 && (
                <>
                  <dt className="font-normal lg:col-span-2">categories</dt>
                  <dd className="m-0 lg:col-span-6 flex flex-col font-normal uppercase">
                    {categories.map((c) => (
                      <span key={c}>{getCategoryLabel(c)}</span>
                    ))}
                  </dd>
                </>
              )}
              {credits &&
                credits
                  .split("\n")
                  .filter(Boolean)
                  .map((line, i) => {
                    const { role, name } = parseCredit(line);
                    return (
                      <Fragment key={i}>
                        <dt className="font-normal lowercase lg:col-span-2">
                          {role}
                        </dt>
                        <dd className="m-0 lg:col-span-6 uppercase font-normal">
                          {name}
                        </dd>
                      </Fragment>
                    );
                  })}
            </dl>
          </div>
        </motion.div>

        {/* Gallery: the work's media stacked in the order the editor set in the
          Studio, each at the ratio it was uploaded at, its figure caption
          below — treated like the home page's featured cards (see
          GalleryFigure). Clicking one opens the full-screen carousel there. */}
        {showGallery && slides.length > 0 && (
          <div
            ref={galleryRef}
            // One per row: the stacked, centred column. More: on desktop a
            // grid with one-square gaps both ways, like /projects — mobile
            // stays one per row. The column count rides in as a CSS
            // variable so the server HTML matches at every width.
            className={cn(
              // Desktop: spans the nav's cols 2–11, like the /projects grid
              // — each side's padding is the bar's 0.75rem inset + 1/12 of
              // its inner width.
              "relative z-[95] px-6 lg:px-[calc(0.75rem+(100%-1.5rem)/12)]",
              galleryCols === 1
                ? "flex flex-col gap-y-(--pixel-corner)"
                : "grid grid-cols-1 gap-(--pixel-corner) lg:grid-cols-[repeat(var(--gallery-cols),minmax(0,1fr))]",
            )}
            style={
              galleryCols === 1
                ? undefined
                : ({ "--gallery-cols": galleryCols } as React.CSSProperties)
            }
          >
            {slides.map((item, i) => (
              <GalleryFigure
                key={item.key}
                item={item}
                index={i}
                title={title}
                cols={galleryCols}
                onOpen={() => {
                  setActiveSlide(i);
                  setLightbox(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="w-full">
        <BottomNav />
      </div>

      <Footer />

      {/* The gallery's zoom (desktop only — mobile is always one per row):
          next to the nav's sound toggle at the bottom, its left edge on the
          nav's col 7, so its square lines up under "about"
          (col 7 starts at 0.75rem + 6/12 of the bar's inner width, less this
          button's own lg:px-3). Same z as the sound toggle; hidden while the
          lightbox is up, and only while the gallery is on screen. */}
      <AnimatePresence>
        {showGallery && slides.length > 1 && !lightbox && galleryInView && (
          <motion.div
            key="gallery-zoom"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto fixed z-[250] hidden lg:block lg:bottom-3 lg:left-[calc((100vw-1.5rem)*0.5)]"
          >
            <CheckButton
              className="font-visual whitespace-nowrap"
              size="lg"
              label={`zoom: ${galleryCols} per row`}
              active
              color="text-primary"
              onClick={() =>
                setGalleryCols(
                  (c) =>
                    GALLERY_COL_STEPS[
                      (GALLERY_COL_STEPS.indexOf(
                        c as (typeof GALLERY_COL_STEPS)[number],
                      ) +
                        1) %
                        GALLERY_COL_STEPS.length
                    ],
                )
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen lightbox — the media as a carousel, opened on whichever
          grid item was clicked. */}
      <AnimatePresence>
        {lightbox && slides.length > 0 && (
          // The media gets the full height, less 24px top and bottom
          // (py-6); the close button floats over the top-right corner
          // instead of taking a row of its own.
          <motion.div
            className="fixed inset-0 z-[100] flex flex-col bg-background px-3 py-6 lg:px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute top-0 right-0 z-20">
              <CheckButton
                onClick={() => setLightbox(false)}
                label="close"
                size="lg"
                color="text-primary"
              />
            </div>
            <div className="relative min-h-0 w-full flex-1">
              <HeroCarousel
                media={slides}
                selected={activeSlide}
                onSelect={setActiveSlide}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProjectPageClient(props: {
  title: string;
  client?: string;
  slug: string;
  description?: string;
  credits?: string;
  categories: string[];
  year?: number;
  media: ProjectMedia[];
  coverUrl?: string;
  coverUrlWide?: string;
  showGallery: boolean;
  galleryColumns?: number;
}) {
  return <ProjectPageInner {...props} />;
}
