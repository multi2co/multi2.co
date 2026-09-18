"use client";

import { Button } from "@/components/ui/button";

import { usePixelCorners } from "@/app/hooks/usePixelCorners";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/connect", label: "Connect" },
] as const;

const SOCIAL_LINKS = [
  { href: "#", label: "Instagram" },
  { href: "mailto:info@multi2.co", label: "Email" },
  { href: "#", label: "LinkedIn" },
] as const;

export default function Footer() {
  // Only the top edge meets the page — the bottom sits at the viewport edge —
  // so just the top two corners get notched.
  const pixelRef = usePixelCorners<HTMLDivElement>();

  return (
    <div className=" w-full flex flex-col justify-between items-stretch h-[90dvh] lg:h-[100dvh] bg-secondary pt-6 p-6 pb-0 [&_*]text-primary">
      {/* Contact columns. Each heading + its links is one grid cell, placed on
          an explicit column so the groups all sit on the top row and line up
          regardless of how many links they hold. Mobile stacks them in
          column two. */}
      <div className="grid grid-cols-3 lg:grid-cols-12 gap-y-8 items-baseline ">
        <nav className="col-start-1 px-6 col-span-1 lg:col-start-1 lg:col-span-2 flex flex-col items-start lg:px-3 mb-12 lg:mb-0  ">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.href}
              size="sm"
              variant="link"
              className="px-0 border-transparent"
              asChild
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="col-start-3 lg:col-start-4 flex flex-col items-start gap-y-0">
          {SOCIAL_LINKS.map((link) => (
            <Button
              key={link.label}
              size="sm"
              variant="link"
              className="px-0 border-transparent h3Text"
              asChild
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>
        <div className="col-start-1 lg:col-start-7 flex flex-col items-start gap-y-12 px-6 lg:px-0">
          <span className="flex flex-col items-start gap-y-0">
            <Button
              size="sm"
              variant="link"
              className="px-0 border-transparent h3Text"
            >
              Adam Odelfelt
            </Button>
            <Button
              size="sm"
              variant="link"
              className="px-0 border-transparent h3Text"
            >
              +46704952184
            </Button>
            <Button
              size="sm"
              variant="link"
              className="px-0 border-transparent h3Text"
              asChild
            >
              <Link href="/">adam@multi2.co</Link>
            </Button>
          </span>
          <span className="flex flex-col items-start gap-y-0">
            <Button
              size="sm"
              variant="link"
              className="px-0 border-transparent h3Text"
            >
              Daniel von Malmborg
            </Button>
            <Button
              size="sm"
              variant="link"
              className="px-0 border-transparent h3Text"
            >
              +46704952184
            </Button>
            <Button
              size="sm"
              variant="link"
              className="px-0 border-transparent h3Text"
              asChild
            >
              <Link href="/">daniel@multi2.co</Link>
            </Button>
          </span>
        </div>
        <h4 className="col-start-10 col-span-4 hidden lg:flex text-sm font-visual tracking-wide lowercase text-primary  ">
          © 2026 Multisquared All rights reserved
        </h4>

        {/* The mark — col-span-4 like everything else in this grid, and
              w-full aspect-square so it stretches to fill that column width
              instead of sitting at a fixed size. Filled from the theme so it
              tracks the palette. */}
      </div>
      {/* Sits flush against the bottom edge of the footer. leading-none trims
          the wordmark's line box so its glyphs drive the row. */}
      <div className="flex flex-row lg:flex-row justify-between w-full items-baseline px-3 lg:pl-3 lg:pr-12 pb-0">
        <h1 className="ml-0 lg:ml-0 font-visual text-7xl lg:text-[8rem] leading-none font-thin lowercase mb-0 text-primary">
          multi2.co
        </h1>
      </div>
    </div>
  );
}
