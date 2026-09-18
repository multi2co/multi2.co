"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import CheckButton from "./CheckButton";
import { useWork } from "@/context/WorkContext";

const ROW =
  "flex flex-col lg:grid lg:grid-cols-12 w-full items-baseline gap-y-6 px-0 lg:px-0 bg-transparent";

/**
 * The bottom-of-page nav, shared by every route.
 *
 * On a project page (`/projects/[slug]`) it's a pager — previous project, back
 * to the archive, next project — walking the primary works in archive order and
 * wrapping at the ends. The current slug comes off the path, so it needs no
 * props.
 *
 * Everywhere else it's "top" (a smooth scroll to the top of the page) plus one
 * forward link: on to the archive from most pages, back home from the archive.
 */
export default function BottomNav() {
  const { items } = useWork();
  const lenis = useLenis();
  const pathname = usePathname();
  const slug = pathname?.split("/").filter(Boolean).pop() ?? "";
  const onProject =
    (pathname?.startsWith("/projects/") ?? false) && slug !== "projects";

  const { prev, next } = useMemo(() => {
    const seen = new Set<string>();
    const list = items.filter((i) => {
      if (!i.isPrimary || seen.has(i.slug)) return false;
      seen.add(i.slug);
      return true;
    });
    const idx = list.findIndex((i) => i.slug === slug);
    if (idx === -1 || list.length < 2) return { prev: null, next: null };
    return {
      prev: list[(idx - 1 + list.length) % list.length],
      next: list[(idx + 1) % list.length],
    };
  }, [items, slug]);

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
          color="text-secondary"
          className="col-start-1 col-span-1 lg:col-start-4 lg:col-span-2 justify-center"
        />
        {prev && (
          <CheckButton
            href={`/projects/${prev.slug}`}
            label="previous"
            size="xl"
            marks={{ active: "←", inactive: "←" }}
            color="text-secondary"
            className="col-start-2 col-span-1 lg:col-start-7 lg:col-span-2"
          />
        )}
        {next && (
          <CheckButton
            href={`/projects/${next.slug}`}
            label="next"
            size="xl"
            labelSide="left"
            marks={{ active: "→", inactive: "→" }}
            color="text-secondary"
            className="col-start-3 col-span-1 lg:col-start-10 lg:col-span-2 justify-end w-min"
          />
        )}
      </nav>
    );
  }

  const archive = pathname === "/projects";
  return (
    <nav className={ROW}>
      <CheckButton
        onClick={toTop}
        label="top"
        size="xl"
        labelSide="right"
        marks={{ active: "↑", inactive: "↑" }}
        className="col-start-1 col-span-1 lg:col-start-4 lg:col-span-2 justify-center"
        color="text-secondary"
      />

      <CheckButton
        href={archive ? "/" : "/projects"}
        label={archive ? "home" : "to projects"}
        size="xl"
        labelSide="left"
        marks={{ active: "→", inactive: "→" }}
        className="flex lg:hidden col-start-3 col-span-1 lg:col-start-7 lg:col-span-4 whitespace-nowrap w-min"
        color="text-secondary"
      />
      <CheckButton
        href={archive ? "/" : "/projects"}
        label={archive ? "home" : "continue to projects"}
        size="xl"
        labelSide="left"
        marks={{ active: "→", inactive: "→" }}
        color="text-secondary"
        className="hidden lg:flex col-start-3 col-span-1 lg:col-start-7 lg:col-span-4 whitespace-nowrap w-min"
      />
    </nav>
  );
}
