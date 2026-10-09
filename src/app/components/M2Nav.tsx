"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useSound } from "@/context/SoundContext";
import { useUI } from "@/context/UIContext";
import { THEMES, useTheme } from "@/context/ThemeContext";
import { useIconStyle } from "@/context/IconStyleContext";
import CheckButton from "./CheckButton";
import TerminalM2Button from "./TerminalM2Button";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/connect", label: "Connect" },
  { href: "/studio", label: "Log In" },
] as const;

/** What the desktop bar links to directly — it has no menu drawer. */
const DESKTOP_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
] as const;

/** Routes that never call notifyContentDone (e.g. /studio) still have to settle. */
const READY_FALLBACK_MS = 2500;

/** How long the square field takes to stagger itself in on load. The page holds
 *  its own reveal until this is up, so the field always comes in first. */
const NAVFIELD_REVEAL_MS = 1500;

/** What the wordmark button cycles through once the page is scrolled, after
 *  resting on "multi²" — the same set on mobile and desktop. */
const WORDMARK_PHRASES = ["(multisquared)", "/ˈmʌl.ti.skweəd/", "multi2.co"];

/** If the home hero never reports in, the bar comes in anyway after this. */
const BAR_FALLBACK_MS = 3000;

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
function NavField({
  active,
  rotate,
  onDark,
}: {
  active: boolean;
  rotate: number;
  onDark: boolean;
}) {
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
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden font-visual text-base lg:text-base transition-colors",
        onDark ? "text-secondary" : "text-primary",
      )}
    >
      {rows.map((pos, r) => (
        <motion.div
          key={r}
          custom={rotate}
          variants={ROW_STAGGER}
          className={cn(
            "absolute inset-x-0 grid grid-cols-3 px-6 lg:p-6  gap-x-12 lg:gap-x-3",
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
 *  (wordmark · – · projects · about · connect · dark at cols
 *  1–2 / 3 / 4 / 7 / 10 / 12; on project pages light/dark moves to col 3
 *  and sound takes col 12) so the
 *  controls hold their positions whatever the field grid does underneath.
 *  Opening the drawer fills it with `bg-primary` so the panel below reads as
 *  one surface. */
function NavBar({
  open,
  onToggleOpen,
  menuLoading,
  cycleMenuLabel,
  muted,
  onToggleMute,
  showSound,
  onConnect,
  dark,
  onToggleDark,
  themeLabel,
  onCycleTheme,
  onDark,
  revealed,
  onNavigate,
}: {
  revealed: boolean;
  onNavigate: (href: string) => void;
  open: boolean;
  onToggleOpen: () => void;
  menuLoading: boolean;
  cycleMenuLabel: boolean;
  muted: boolean;
  onToggleMute: () => void;
  showSound: boolean;
  onConnect?: () => void;
  dark: boolean;
  onToggleDark: () => void;
  themeLabel: string;
  onCycleTheme: () => void;
  onDark: boolean;
}) {
  // Over the connect/footer dark zone (bg-primary) the bar's own text has to
  // flip to secondary to stay legible — same swap CheckButton's `color` prop
  // drives on every other button, just scroll-position-triggered here instead
  // of static. The open drawer's `!text-primary-foreground` override still
  // wins regardless, since it's `!important` and applies after.
  const barColor = onDark ? "text-secondary" : "text-primary";

  return (
    <motion.div
      {...(open ? { "data-cursor-invert": "" } : {})}
      variants={BAR_STAGGER}
      initial="hidden"
      animate={revealed ? "show" : "hidden"}
      className={cn(
        "pointer-events-auto grid h-16 grid-cols-3 gap-x-0 lg:p-3 items-start lg:items-baseline transition-colors lg:h-16 lg:grid-cols-12",
        open
          ? "bg-primary text-primary-foreground [&_*]:!text-primary-foreground"
          : cn("bg-transparent", barColor),
      )}
    >
      {/* Mobile cols 1–2: the wordmark, same as desktop — rests on "multi²",
          cycles the tagline and the rest once scrolled. Wraps rather than
          running into col 3. The label sits in a one-line-tall box (`h-5`,
          one `leading-tight` line) and extra lines hang below it, so the
          first line, the square and the bar never move as it wraps.
          Clicking it scrolls back to top. */}
      <motion.div variants={BAR_ITEM} className="col-span-2 lg:hidden">
        <CheckButton
          className="font-visual w-full leading-tight"
          size="lg"
          href="/"
          label="multi²"
          active
          color={barColor}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <span className="block h-5 min-w-0 leading-tight">
            <TerminalM2Button
              className="tracking-wide"
              key={menuLoading ? "loading" : "wordmark"}
              text="multi²"
              visible
              delay={0}
              phrases={cycleMenuLabel ? WORDMARK_PHRASES : []}
              loop={cycleMenuLabel}
              trigger={cycleMenuLabel ? "scrolled" : "idle"}
            />
          </span>
        </CheckButton>
      </motion.div>

      {/* Mobile col 3: the menu/close toggle. On project pages the sound
          toggle lives in the drawer instead. */}
      <motion.div
        variants={BAR_ITEM}
        className="col-start-3 flex justify-start lg:hidden"
      >
        <CheckButton
          className="font-visual justify-start"
          size="lg"
          label={open ? "close" : "menu"}
          active
          color={barColor}
          onClick={onToggleOpen}
        />
      </motion.div>

      {/* Desktop cols 1–2: the wordmark; clicking it scrolls back to top. */}
      <motion.div
        variants={BAR_ITEM}
        className="hidden lg:block lg:col-start-1 lg:col-span-2 min-w-0 overflow-hidden"
      >
        <CheckButton
          className="font-visual w-full"
          size="lg"
          href="/"
          label="multi²"
          active
          color={barColor}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          {/* Clipped to cols 1–2 so no phrase runs into the links. */}
          <span className="block min-w-0 truncate">
            <TerminalM2Button
              className="tracking-wide whitespace-nowrap"
              key={menuLoading ? "loading" : "wordmark"}
              text="multi²"
              visible
              delay={0}
              // Rests on "multi²"; once the reader has scrolled it cycles the
              // name, its pronunciation and the domain, then
              // back, so the bar still says who it is.
              phrases={cycleMenuLabel ? WORDMARK_PHRASES : []}
              loop={cycleMenuLabel}
              trigger={cycleMenuLabel ? "scrolled" : "idle"}
            />
          </span>
        </CheckButton>
      </motion.div>

      {/* Desktop col 3: the light/dark toggle on project pages, where the
          sound toggle takes its far-right slot. */}
      {showSound && (
        <motion.div
          variants={BAR_ITEM}
          className="hidden lg:block lg:col-start-3 lg:col-span-2"
        >
          <CheckButton
            className="font-visual w-full"
            size="label"
            label={dark ? "dark" : "light"}
            active
            color={barColor}
            onClick={onToggleDark}
          />
        </motion.div>
      )}

      {/* Desktop cols 4 / 7: the page links — no drawer on desktop. */}
      {DESKTOP_LINKS.map((item, i) => (
        <motion.div
          key={item.href}
          variants={BAR_ITEM}
          className={cn(
            "hidden lg:block lg:col-span-2",
            i === 0 ? "lg:col-start-4" : "lg:col-start-7",
          )}
        >
          <CheckButton
            className="font-visual w-full"
            size="label"
            label={item.label}
            href={item.href}
            active
            color={barColor}
            onClick={() => onNavigate(item.href)}
          />
        </motion.div>
      ))}

      {/* Desktop col 10: "connect" — scrolls to the connect section on home,
          the connect page from anywhere else. */}
      <motion.div
        variants={BAR_ITEM}
        className="hidden lg:block lg:col-start-10 lg:col-span-2"
      >
        <CheckButton
          className="font-visual w-full"
          size="label"
          label="connect"
          href={onConnect ? undefined : "/connect"}
          active
          color={barColor}
          onClick={onConnect ?? (() => onNavigate("/connect"))}
        />
      </motion.div>

      {/* Desktop col 12, pushed to the far right: the sound toggle on project
          pages, the light/dark toggle everywhere else. */}
      <motion.div
        variants={BAR_ITEM}
        className="hidden lg:flex lg:col-start-12 lg:col-span-1 lg:justify-end"
      >
        {showSound ? (
          <CheckButton
            className="font-visual whitespace-nowrap"
            size="lg"
            label={muted ? "sound off" : "sound on"}
            active
            color={barColor}
            onClick={onToggleMute}
          />
        ) : (
          <CheckButton
            className="font-visual"
            size="lg"
            label={dark ? "dark" : "light"}
            active
            color={barColor}
            onClick={onToggleDark}
          />
        )}
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
  showSound,
  muted,
  onToggleMute,
}: {
  showSound: boolean;
  muted: boolean;
  onToggleMute: () => void;
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
      className={`p-0 space-y-0 lg:p-3 w-full lg:w-full bg-primary pb-3 [&_*]:!text-primary-foreground flex flex-col h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-3rem)] pr-0 lg:pr-6 pixelCornersBottom lg:[mask-border:none] lg:[-webkit-mask-box-image:none]`}
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
        {/* Mobile has no room for it in the bar, so on project pages the
            sound toggle sits here. */}
        {showSound && (
          <CheckButton
            checkbox
            className="lowercase pb-0 mt-6"
            size="lg"
            label={muted ? "sound off" : "sound on"}
            active={!muted}
            onClick={onToggleMute}
          />
        )}
      </nav>

      {/* The palette picker — one click cycles to the next palette, the split
          disc turning a quarter with it. Matches the top bar's swatch button;
          here in the drawer it carries the palette name too. */}

      {/* The wordmark, same as the footer's — `mt-auto` drops it to the
          bottom-left of the drawer whatever's above it. */}
      <p className="mt-auto self-start text-left font-visual font-thin text-7xl lg:text-[8rem] leading-none lowercase mb-0 px-6 lg:px-3 lg:pb-3">
        multi2.co
      </p>
    </motion.div>
  );
}

export default function M2Nav() {
  const pathname = usePathname();
  const { contentDoneKey, heroOpen } = useUI();
  const { muted, toggleMute } = useSound();
  const { theme, cycleTheme, dark, toggleDark } = useTheme();
  const currentTheme = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  // The column is opened from the menu button — mobile only; desktop links
  // straight from the bar.
  const [open, setOpen] = useState(false);

  // Desktop has no close button, so widening past `lg` shuts the drawer.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // "loading…" covers two things: the page's own intro typing hasn't finished
  // yet, and a route change is in flight.
  const [ready, setReady] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const loading = !ready || navigating;

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
  // not the route ever reported in. Re-armed per route, and
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

  // Swaps the bar/field from primary to secondary text while `#connect-zone`
  // (the Connect-through-BottomNav stretch, bg-primary) is scrolled under the
  // bar, back to primary once `#footer-section` (bg-secondary) covers it. Both
  // sections are `sticky top-0` — the home page's scroll-stacking cards — so
  // once connect-zone is stuck it stays "intersecting" the thin observed line
  // even after footer visually covers it; footer's own hit is what forces the
  // bar back to primary, rather than connect-zone naturally exiting. The thin
  // `-100%` rootMargin collapses the observed area to a single line at the
  // bar's own height, so intersection flips right as a section's edge passes
  // under it rather than whenever any part is visible.
  //
  // Elsewhere (no `#connect-zone`) the bar just stays primary.
  const [connectHit, setConnectHit] = useState(false);
  const [footerHit, setFooterHit] = useState(false);
  const onDark = connectHit && !footerHit;
  useEffect(() => {
    setConnectHit(false);
    setFooterHit(false);
    const zone = document.getElementById("connect-zone");
    const footer = document.getElementById("footer-section");
    const opts: IntersectionObserverInit = {
      rootMargin: "-64px 0px -100% 0px",
      threshold: 0,
    };
    const observers: IntersectionObserver[] = [];
    if (zone) {
      const zoneObserver = new IntersectionObserver(
        ([entry]) => setConnectHit(entry.isIntersecting),
        opts,
      );
      zoneObserver.observe(zone);
      observers.push(zoneObserver);
    }
    if (footer) {
      const footerObserver = new IntersectionObserver(
        ([entry]) => setFooterHit(entry.isIntersecting),
        opts,
      );
      footerObserver.observe(footer);
      observers.push(footerObserver);
    }
    return () => observers.forEach((o) => o.disconnect());
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
  // reveal window.
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

  // Past the top of the page, the closed menu button alternates "menu" and the
  // wordmark rather than sitting on one.
  const cycleMenuLabel = scrolled && !open && !menuLoading;

  // On a first load of home the links hold back until the hero has opened
  // out from square to 16:9, then stagger in. Once in, they stay in — a later
  // client-side visit home doesn't hide them again.
  const [barRevealed, setBarRevealed] = useState(false);
  const revealBar = barRevealed || pathname !== "/" || heroOpen;
  useEffect(() => {
    if (revealBar) setBarRevealed(true);
  }, [revealBar]);
  useEffect(() => {
    const t = setTimeout(() => setBarRevealed(true), BAR_FALLBACK_MS);
    return () => clearTimeout(t);
  }, []);

  // Sound only has a toggle on project pages — it's always off on home and
  // the archive. Everywhere else that slot is "connect": a scroll down to the
  // connect section on home, the connect page from anywhere else.
  const onProjectPage = pathname?.startsWith("/projects/") ?? false;
  const scrollToConnect =
    pathname === "/"
      ? () => {
          const el = document.getElementById("connect");
          if (!el) return;
          const top = el.getBoundingClientRect().top + window.scrollY - 64;
          window.scrollTo({ top, behavior: "smooth" });
        }
      : undefined;

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
        onDark={onDark}
      />

      <div className="relative">
        <NavBar
          revealed={revealBar}
          open={open}
          onDark={onDark}
          onToggleOpen={() => setOpen((o) => !o)}
          menuLoading={menuLoading}
          cycleMenuLabel={cycleMenuLabel}
          muted={muted}
          onToggleMute={toggleMute}
          showSound={onProjectPage}
          onConnect={scrollToConnect}
          dark={dark}
          onToggleDark={toggleDark}
          themeLabel={currentTheme.label}
          onCycleTheme={cycleTheme}
          onNavigate={handleNavigate}
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
                showSound={onProjectPage}
                muted={muted}
                onToggleMute={toggleMute}
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
