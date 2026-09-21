"use client";

import { Button } from "@/components/ui/button";

import { usePixelCorners } from "@/app/hooks/usePixelCorners";
import Link from "next/link";
import { useContact } from "@/context/ContactContext";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/connect", label: "Connect" },
] as const;

/** Falls back to this when the CMS's Contact doc has no email published yet —
 *  same default ConnectSection uses. */
const DEFAULT_EMAIL = "info@multi2.co";

export default function Footer() {
  // Only the top edge meets the page — the bottom sits at the viewport edge —
  // so just the top two corners get notched.
  const pixelRef = usePixelCorners<HTMLDivElement>();
  const contact = useContact();

  const socialLinks = [
    { href: "#", label: "Instagram" },
    { href: `mailto:${contact?.email ?? DEFAULT_EMAIL}`, label: "Email" },
    { href: "#", label: "LinkedIn" },
  ] as const;

  // Only the first two — same reserved pair ConnectSection's PERSON_COLS use.
  const people = contact?.people?.slice(0, 2) ?? [];

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
          {socialLinks.map((link) => (
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
          {people.map((person) => (
            <span key={person.name} className="flex flex-col items-start gap-y-0">
              <Button size="sm" variant="link" className="px-0 border-transparent h3Text">
                {person.name}
              </Button>
              {person.phone && (
                <Button
                  size="sm"
                  variant="link"
                  className="px-0 border-transparent h3Text"
                  asChild
                >
                  <Link href={`tel:${person.phone.replace(/\s/g, "")}`}>
                    {person.phone}
                  </Link>
                </Button>
              )}
              {person.email && (
                <Button
                  size="sm"
                  variant="link"
                  className="px-0 border-transparent h3Text"
                  asChild
                >
                  <Link href={`mailto:${person.email}`}>{person.email}</Link>
                </Button>
              )}
            </span>
          ))}
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
