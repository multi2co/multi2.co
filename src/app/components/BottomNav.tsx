"use client";

import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import CheckButton from "./CheckButton";

const ROW =
  "flex flex-col lg:grid lg:grid-cols-12 w-full items-baseline gap-y-6 px-0 lg:px-0 bg-transparent";

/**
 * The bottom-of-page nav, shared by every route.
 *
 * On a project page (`/projects/[slug]`) it's a single link back to the
 * archive.
 *
 * Everywhere else it's "top" (a smooth scroll to the top of the page) plus one
 * forward link: on to the archive from most pages, back home from the archive.
 */
export default function BottomNav() {
  const lenis = useLenis();
  const pathname = usePathname();
  const onProject = pathname?.startsWith("/projects/") ?? false;

  const toTop = () =>
    lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: "smooth" });

  if (onProject) {
    return (
      <nav className={ROW}>
        <CheckButton
          href="/projects"
          label="all projects"
          size="xl"
          marks={{ active: "↖", inactive: "↖" }}
          color="text-primary"
          className="col-start-1 col-span-1 lg:col-start-4 lg:col-span-2 justify-center"
        />
      </nav>
    );
  }

  const archive = pathname === "/projects";
  // /about sits on a plain bg-background page, not a dark/secondary section,
  // so its BottomNav reads text-primary like the rest of the page; everywhere
  // else keeps the secondary treatment.
  const color = pathname === "/about" ? "text-primary" : "text-secondary";
  return (
    <nav className={ROW}>
      <CheckButton
        onClick={toTop}
        label="top"
        size="xl"
        labelSide="right"
        marks={{ active: "↑", inactive: "↑" }}
        className="col-start-1 col-span-1 lg:col-start-4 lg:col-span-2 justify-center"
        color={color}
      />

      <CheckButton
        href={archive ? "/" : "/projects"}
        label={archive ? "home" : "to projects"}
        size="xl"
        labelSide="left"
        marks={{ active: "→", inactive: "→" }}
        className="flex lg:hidden col-start-3 col-span-1 lg:col-start-7 lg:col-span-4 whitespace-nowrap w-min"
        color={color}
      />
      <CheckButton
        href={archive ? "/" : "/projects"}
        label={archive ? "home" : "continue to projects"}
        size="xl"
        labelSide="left"
        marks={{ active: "→", inactive: "→" }}
        color={color}
        className="hidden lg:flex col-start-3 col-span-1 lg:col-start-7 lg:col-span-4 whitespace-nowrap w-min"
      />
    </nav>
  );
}
