"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import CheckButton from "./CheckButton";
import LandningBlock from "./LandningBlock";
import { Reveal } from "./Reveal";

export type ContactData = {
  phone?: string;
  email?: string;
  people?: { name: string; phone?: string; email?: string }[];
};

/** Falls back to this when the CMS's Contact doc has no email published yet. */
const DEFAULT_EMAIL = "info@multi2.co";

const LINK_BTN =
  "flex items-center h-auto py-0 gap-x-1.5 font-thin justify-start whitespace-nowrap w-min";

/** The named contacts sit at cols 4 / 7 — only the first two people show,
 *  matching the grid's two reserved slots. */
const PERSON_COLS = ["lg:col-start-4 lg:col-span-2", "lg:col-start-7 lg:col-span-2"] as const;

/**
 * The "connect with us" block — one full-width 12-col grid, `items-baseline` so
 * the label and the typed heading share a baseline on the first row, then the
 * general links (col 1) and the per-person contacts (cols 4 / 7, `lg`+) on the
 * next. Used on the home page and the connect page. `contact` is the Sanity
 * Contact doc — `phone`/`email` for the general links (falling back to the
 * house email when unpublished), `people` for the named contacts.
 */
export default function ConnectSection({
  className,
  contact,
}: {
  className?: string;
  contact?: ContactData;
}) {
  const links = [
    { label: "email", href: `mailto:${contact?.email ?? DEFAULT_EMAIL}` },
    ...(contact?.phone
      ? [
          {
            label: contact.phone,
            href: `tel:${contact.phone.replace(/\s/g, "")}`,
          },
        ]
      : []),
    { label: "Instagram", href: "#" },
    { label: "Linkedin", href: "#" },
  ] as const;

  return (
    <Reveal className="grid grid-cols-3 lg:grid-cols-12 gap-x-3 h-dvh">
      <LandningBlock
        bg=" text-primary"
        className={cn(
          "col-span-3 lg:col-start-1 lg:col-span-12 h-auto w-full pb-6",
          className,
        )}
        contentClassName="col-start-1 col-span-3 lg:col-start-1 lg:col-span-12 lowercase grid grid-cols-3 lg:grid-cols-12 items-baseline gap-y-6 lg:pb-12 px-0 lg:px-0"
      >
        <CheckButton
          label="connect with us"
          href="/connect"
          size="lg"
          active
          className="col-span-3 lg:col-start-1 lg:col-span-3"
        />

        {/* Col 1 — the general links, one column. */}
        <div className="col-span-3 lg:col-start-4 lg:col-span-3 flex flex-col items-start gap-y-1 pl-6 lg:pl-3">
          {links.map((link) => (
            <Button
              key={link.label}
              variant="link"
              size="lgLink"
              className={LINK_BTN}
              asChild
            >
              <a
                href={link.href}
                {...(link.href.startsWith("http")
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
              >
                {link.label}
              </a>
            </Button>
          ))}
        </div>

        {/* Cols 4 / 7 — name, phone and email per person. Desktop only. */}
        {contact?.people?.slice(0, 2).map((person, i) => (
          <div
            key={person.name}
            className={cn(
              "hidden lg:flex flex-col items-start gap-y-1 pl-3",
              PERSON_COLS[i],
            )}
          >
            <Button variant="link" size="lgLink" className={LINK_BTN}>
              {person.name}
            </Button>
            {person.phone && (
              <Button variant="link" size="lgLink" className={LINK_BTN} asChild>
                <a href={`tel:${person.phone.replace(/\s/g, "")}`}>
                  {person.phone}
                </a>
              </Button>
            )}
            {person.email && (
              <Button variant="link" size="lgLink" className={LINK_BTN} asChild>
                <a href={`mailto:${person.email}`}>{person.email}</a>
              </Button>
            )}
          </div>
        ))}
      </LandningBlock>
    </Reveal>
  );
}
