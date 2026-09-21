import React from "react";
import { sanityFetch } from "../../sanity/lib/client";
import { contactQuery } from "../../sanity/lib/queries";
import { ContactProvider, type ContactData } from "./ContactContext";

export async function ContactContextServer({
  children,
}: {
  children: React.ReactNode;
}) {
  let contact: ContactData | null = null;
  try {
    contact = await sanityFetch<ContactData | null>(
      contactQuery,
      {},
      { tags: ["contact"] },
    );
  } catch (error) {
    // Sanity unreachable — every consumer falls back to its own defaults.
    console.error("ContactContextServer: Sanity fetch failed", error);
  }

  return <ContactProvider contact={contact ?? {}}>{children}</ContactProvider>;
}
