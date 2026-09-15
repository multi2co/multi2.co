"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useSound } from "@/context/SoundContext";
import { useUI } from "@/context/UIContext";
import { useBusyCursor } from "@/context/CursorContext";
import { THEMES, useTheme } from "@/context/ThemeContext";
import { useIconStyle } from "@/context/IconStyleContext";
import CheckButton from "./CheckButton";
import CheckToggle from "./CheckToggle";
import ColorButton from "./ColorButton";
import TerminalM2Button from "./TerminalM2Button";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/connect", label: "Connect" },
  { href: "/studio", label: "Log In" },
] as const;

/** Routes that never call notifyContentDone (e.g. /studio) still have to settle. */
const READY_FALLBACK_MS = 2500;

/** How long the square field takes to stagger itself in on load. The page holds
 *  its own reveal until this is up, so the field always comes in first. */
const NAVFIELD_REVEAL_MS = 1500;

/** How far down the page counts as "the reader has moved on". */
const SCROLLED_PX = 40;

/** The house easing, shared by the two entrances. */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** `NavField` and `NavBar` are separate overlays stacked on the same
 *  click-through layer: the bar is the top control row, the field is a set of
 *  square rows pinned down the rest of the height. On mobile the rows sit on
 *  the quarters (starting at `top-1/4`); on `lg` only the midpoint row shows.
 *
 *  The field is tied to scrolling: at rest the squares are `opacity-0`; while
 *  the page is being scrolled they come up to full opacity, row by row / square
 *  by square, then fade back once scrolling stops. Each square also turns 90°
 *  on every edge — a scroll starting and a scroll stopping — so it always lands
 *  square. The `rotate` value rides in as `custom`; the parents only sequence,
 *  every animated value is on a child. */
const FIELD_ROWS = [
  "top-1/4 lg:hidden",
  "top-1/2",
  "top-3/4 lg:hidden",
] as const;
/** The projects page keeps the same mobile quarters but swaps `lg` to two rows
 *  on the thirds. Desktop rows lead so their stagger isn't held behind the
 *  hidden mobile ones. */
const FIELD_ROWS_PROJECTS = [
  "hidden lg:grid top-[33.3vh]",
  "hidden lg:grid top-[66.6vh]",
  "top-1/4 lg:hidden",
  "top-1/2 lg:hidden",
  "top-3/4 lg:hidden",
] as const;
const FIELD_STAGGER = {
  rest: {},
  active: { transition: { staggerChildren: 0.22 } },
} as const;
const ROW_STAGGER = {
  rest: {},
  active: { transition: { staggerChildren: 0.09 } },
} as const;
const FIELD_CELL = {
  rest: (rotate: number) => ({
    opacity: 0,
    rotate,
    transition: { duration: 0.45, ease: EASE },
  }),
  active: (rotate: number) => ({
    opacity: 1,
    rotate,
    transition: { duration: 0.4, ease: EASE },
  }),
};
const BAR_STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.12 } },
} as const;
const BAR_ITEM = {
  hidden: { opacity: 0, y: -8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
} as const;

/** The square rows — 3 cells each on mobile; 4 on `lg`, or 6 on `lg` on the
 *  projects page. Each glyph is the CheckButton mark so the field tracks the
 *  palette. `active` drives the whole field between `rest` (faded out) and
 *  `active` (full opacity), staggered row by row and square by square; `rotate`
 *  (a multiple of 90°) rides in as `custom`. `aria-hidden` and click-through. */
function NavField({ active, rotate }: { active: boolean; rotate: number }) {
  // On the projects page the field is a 6-col grid with two `lg` rows on the
  // thirds; everywhere else it's 4-col with one row at the midpoint.
  const projects = usePathname() === "/projects";
  const rows: readonly string[] = projects ? FIELD_ROWS_PROJECTS : FIELD_ROWS;
  const iconStyle = useIconStyle();
  const mark = iconStyle === "dot" ? "●" : "■";

  return (
    <motion.div
      aria-hidden
      custom={rotate}
      variants={FIELD_STAGGER}
      initial="rest"
      animate={active ? "active" : "rest"}
      className="pointer-events-none absolute inset-0 overflow-hidden font-visual text-base text-primary lg:text-base"
    >
      {rows.map((pos, r) => (
        <motion.div
          key={r}
          custom={rotate}
          variants={ROW_STAGGER}
          className={cn(
            "absolute inset-x-0 grid grid-cols-3 px-6 lg:p-3  gap-x-12 lg:gap-x-3",
            pos,
            projects ? "lg:grid-cols-6" : "lg:grid-cols-4",
          )}
        >
          {Array.from({ length: 6 }, (_, i) => (
            // `inline-block` + `justify-self-start` shrink each cell to the
            // glyph itself, so `rotate` spins the square about its own centre
            // instead of swinging it around a stretched grid cell. Cells 0–2
            // always show; 3 shows from `lg`; 4–5 only on the 6-col projects row.
            <motion.span
              key={i}
              custom={rotate}
              variants={FIELD_CELL}
              className={cn(
                "inline-block justify-self-start text-[0.7em] leading-none",
                i >= 3 &&
                  (projects || i === 3 ? "hidden lg:inline-block" : "hidden"),
              )}
            >
              {mark}
            </motion.span>
          ))}
        </motion.div>
      ))}
    </motion.div>
  );
}

/** The top control row — its own overlay, sitting above `NavField` on the
 *  click-through layer. `grid-cols-3` on mobile; always `grid-cols-12` on `lg`
 *  (wordmark · menu · sound · dark + palette at cols 1 / 4 / 7 / 10) so the
 *  controls hold their positions whatever the field grid does underneath.
 *  Opening the drawer fills it with `bg-primary` so the panel below reads as
 *  one surface. */
function NavBar({
  open,
  onToggleOpen,
  menuLabel,
  menuLoading,
  cycleMenuLabel,
  muted,
  onToggleMute,
  dark,
  onToggleDark,
  themeLabel,
  onCycleTheme,
}: {
  open: boolean;
  onToggleOpen: () => void;
  menuLabel: string;
  menuLoading: boolean;
  cycleMenuLabel: boolean;
  muted: boolean;
  onToggleMute: () => void;
  dark: boolean;
  onToggleDark: () => void;
  themeLabel: string;
  onCycleTheme: () => void;
}) {
  return (
    <motion.div
      {...(open ? { "data-cursor-invert": "" } : {})}
      variants={BAR_STAGGER}
      initial="hidden"
      animate="show"
      className={cn(
        "pointer-events-auto grid h-16 grid-cols-3 gap-x-0 items-baseline px-0 transition-colors lg:h-12 lg:grid-cols-12",
        open
          ? "bg-primary text-primary-foreground [&_*]:!text-primary-foreground"
          : "bg-transparent text-primary",
      )}
    >
      {/* Mobile: one combined button — types "menu"/"close" and cycles the
          wordmark once scrolled. The label rides in as a child because
          CheckButton's `terminal` flag can't pass loading state through. */}
      <motion.div variants={BAR_ITEM} className="col-span-1 lg:hidden">
        <CheckButton
          className="flex font-visual w-full"
          size="lg"
          href="/"
          label={menuLabel}
          active
          onClick={onToggleOpen}
        >
          <TerminalM2Button
            className="tracking-wide"
            key={menuLabel}
            text={open ? "close" : "menu"}
            visible
            delay={0}
            loading={menuLoading}
            loadingText="loading"
            phrases={cycleMenuLabel ? ["loading", "multi2.co"] : []}
            loop={cycleMenuLabel}
            trigger={cycleMenuLabel ? "scrolled" : "idle"}
          />
        </CheckButton>
      </motion.div>

      {/* Mobile: the sound toggle in the spare third column, pushed right. */}

      <motion.div
        variants={BAR_ITEM}
        className="col-start-3 flex justify-start  lg:hidden"
      >
        <CheckButton
          className="font-visual justify-start"
          size="lg"
          label="sound"
          active
          onClick={onToggleMute}
        />
      </motion.div>

      {/* Desktop col 1: the wordmark; clicking it scrolls back to top. */}
      <motion.div
        variants={BAR_ITEM}
        className="hidden lg:block lg:col-start-1 lg:col-span-3"
      >
        <CheckButton
          className="font-visual w-full"
          size="lg"
          href="/"
          label="multisquared"
          active
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <TerminalM2Button
            className="tracking-wide"
            key={menuLoading ? "loading" : "wordmark"}
            text="multisquared"
            visible
            delay={0}
            // Once the reader has scrolled, the button keeps cycling between
            // "loading" and the wordmark so the bar still says who it is.
            phrases={cycleMenuLabel ? ["loading", "multi2.co"] : []}
            loop={cycleMenuLabel}
            trigger={cycleMenuLabel ? "scrolled" : "idle"}
          />
        </CheckButton>
      </motion.div>

      {/* Desktop col 4: a plain menu/close toggle for the drawer. */}

      <motion.div
        variants={BAR_ITEM}
        className="hidden lg:block lg:col-start-4 lg:col-span-2"
      >
        <CheckButton
          className="font-visual w-full"
          size="lg"
          label={open ? "close" : "menu"}
          active
          onClick={onToggleOpen}
        />
      </motion.div>
      <motion.div
        variants={BAR_ITEM}
        className="hidden lg:block lg:col-start-7 lg:col-span-2"
      >
        <CheckButton
          className="font-visual w-full"
          size="label"
          label={muted ? "sound off" : "sound on"}
          active
          onClick={onToggleMute}
        />
      </motion.div>

      {/* Desktop col 7: the sound toggle. */}

      {/* Desktop col 10: the dark toggle and the palette swatch, far right. */}

      {/* Light/dark toggle — fixed to the viewport's top-right corner rather
          than riding a grid column, so it stays put whatever the rest of the
          bar does. */}
      <motion.div
        variants={BAR_ITEM}
        className="hidden lg:block lg:col-start-10 lg:col-span-2"
      >
        <CheckButton
          className="font-visual"
          size="lg"
          label={dark ? "dark" : "light"}
          active
          onClick={onToggleDark}
        />
      </motion.div>
    </motion.div>
  );
}

/** Home only matches exactly; the rest keep their mark on child routes too,
 *  so /projects/[slug] still reads as projects. */
function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavVertical({
  onNavigate,
  onCycleTheme,
  themeLabel,
  dark,
  onToggleDark,
}: {
  onNavigate: (href: string) => void;
  onCycleTheme: () => void;
  themeLabel: string;
  dark: boolean;
  onToggleDark: () => void;
}) {
  const pathname = usePathname();

  return (
    <motion.div
      data-cursor-invert
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`p-0 space-y-0 w-full lg:w-full bg-primary pb-3 [&_*]:!text-primary-foreground flex flex-col h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-3rem)] pr-0 lg:pr-6 pixelCornersBottom lg:[mask-border:none] lg:[-webkit-mask-box-image:none]`}
    >
      <nav className="hidden lg:flex w-full flex-col items-start gap-y-0 flex-1 min-h-0 p-0  ">
        {NAV_ITEMS.map((item) => (
          <CheckButton
            className=" text-primary pb-0 font-visual     w-full"
            size="lg"
            key={item.href}
            label={item.label}
            href={item.href}
            active={isActive(pathname, item.href)}
            onClick={() => onNavigate(item.href)}
          />
        ))}
      </nav>
      <nav className="flex lg:hidden  w-full flex-col gap-y-0 px-0  ">
        {NAV_ITEMS.map((item) => (
          <CheckButton
            className="f  lowercase pb-0"
            size="lg"
            key={item.href}
            label={item.label}
            href={item.href}
            active={isActive(pathname, item.href)}
            onClick={() => onNavigate(item.href)}
          />
        ))}
      </nav>

      {/* The palette picker — one click cycles to the next palette, the split
          disc turning a quarter with it. Matches the top bar's swatch button;
          here in the drawer it carries the palette name too. */}

      {/* The wordmark, same as the footer's — `mt-auto` drops it to the
          bottom-left of the drawer whatever's above it. */}
      <h1 className="mt-auto self-start text-left font-visual font-thin text-7xl lg:text-[8rem] leading-none lowercase mb-0 px-6 lg:px-3">
        multi2.co
      </h1>
    </motion.div>
  );
}

export default function M2Nav() {
  const pathname = usePathname();
  const { contentDoneKey, setNavLoading } = useUI();
  const { muted, toggleMute } = useSound();
  const { theme, cycleTheme, dark, toggleDark } = useTheme();
  const currentTheme = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  // The column is opened from the menu button at every width.
  const [open, setOpen] = useState(false);

  // "loading…" covers two things: the page's own intro typing hasn't finished
  // yet, and a route change is in flight.
  const [ready, setReady] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const loading = !ready || navigating;
  // The nav already knows when the site is busy; the cursor cycles on the
  // same signal.
  useBusyCursor(loading);

  // A committed route change ends the pending navigation and puts the label
  // back into the waiting state until the new page reports in. M2Nav lives in
  // the layout, so the panels would otherwise survive the tap that dismissed
  // them.
  useEffect(() => {
    setNavigating(false);
    setReady(false);
    setOpen(false);
    const t = setTimeout(() => setReady(true), READY_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [pathname]);

  // Scrolling is its own answer to "is the page still loading?" — once the
  // reader has moved off the top the bar goes back to its own name, whether or
  // not the route ever reported in. Scoped to the label: `loading` still drives
  // the busy cursor until the page actually settles. Re-armed per route, and
  // read once on mount so a restored scroll position counts too.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    setScrolled(false);
    const onScroll = () => {
      if (window.scrollY > SCROLLED_PX) setScrolled(true);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // A separate, momentary read of the same event: true while scroll events are
  // still firing, back to false ~160ms after they stop. The floating square
  // field rides this — turned and visible mid-scroll, faded out at rest.
  const [scrolling, setScrolling] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      setScrolling(true);
      clearTimeout(t);
      t = setTimeout(() => setScrolling(false), 160);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Every edge of `scrolling` — a scroll starting, a scroll stopping — turns the
  // field another 90°, so the squares always land square, never on a diagonal.
  // Skipped on the first run so mount doesn't count as an edge.
  const [fieldTurn, setFieldTurn] = useState(0);
  const fieldTurnMounted = useRef(false);
  useEffect(() => {
    if (!fieldTurnMounted.current) {
      fieldTurnMounted.current = true;
      return;
    }
    setFieldTurn((n) => n + 1);
  }, [scrolling]);

  // The field stagger-reveals itself once on first load. `fieldShown` is that
  // reveal window; while it's up the page keeps its own content held back, so
  // the field always finishes before the page starts coming in top-to-bottom.
  const [fieldShown, setFieldShown] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setFieldShown(false), NAVFIELD_REVEAL_MS);
    return () => clearTimeout(t);
  }, []);

  // Home/About/Connect bump this once their content has finished typing.
  useEffect(() => {
    if (contentDoneKey > 0) setReady(true);
  }, [contentDoneKey]);

  // "loading" wins over both: the bar reports the site's state before it
  // reports the menu's.
  const menuLoading = loading && !scrolled;

  // Published so pages hold their reveal behind the bar AND behind the field's
  // stagger-in — the field goes first, then the page.
  useEffect(() => {
    setNavLoading(menuLoading || fieldShown);
  }, [menuLoading, fieldShown, setNavLoading]);

  const menuLabel = menuLoading ? "loading" : open ? "close" : "multisquared";

  // Past the top of the page, the closed menu button alternates "menu" and the
  // wordmark rather than sitting on one.
  const cycleMenuLabel = scrolled && !open && !menuLoading;

  function handleNavigate(href: string) {
    setOpen(false);
    if (href !== pathname) setNavigating(true);
  }

  // The nav is hidden on /studio — a focused, full-viewport tool with its own
  // chrome.
  if (pathname?.startsWith("/studio")) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-90 h-screen w-full">
      {/* The square field: stagger-reveals on load, holds while the page is
          still loading, then fades until the reader scrolls (a quarter turn
          further along on each scroll start and stop). */}
      <NavField
        active={scrolling || fieldShown || menuLoading}
        rotate={fieldTurn * 90}
      />

      <div className="relative">
        <NavBar
          open={open}
          onToggleOpen={() => setOpen((o) => !o)}
          menuLabel={menuLabel}
          menuLoading={menuLoading}
          cycleMenuLabel={cycleMenuLabel}
          muted={muted}
          onToggleMute={toggleMute}
          dark={dark}
          onToggleDark={toggleDark}
          themeLabel={currentTheme.label}
          onCycleTheme={cycleTheme}
        />

        {/* The panel unfolds as a drawer — the wrapper animates its height so
            the menu slides down from under the row, and NavVertical eases in
            behind it. Mirrors the bottom drawer on /projects. */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="nav-drawer"
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="pointer-events-auto overflow-hidden"
            >
              <NavVertical
                onNavigate={handleNavigate}
                onCycleTheme={cycleTheme}
                themeLabel={currentTheme.label}
                dark={dark}
                onToggleDark={toggleDark}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
