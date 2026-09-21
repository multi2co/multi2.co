"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ContactData = {
  phone?: string;
  email?: string;
  people?: {
    name: string;
    title?: string;
    phone?: string;
    email?: string;
  }[];
};

const ContactContext = createContext<ContactData>({});

export function ContactProvider({
  contact,
  children,
}: {
  contact: ContactData;
  children: ReactNode;
}) {
  return (
    <ContactContext.Provider value={contact}>
      {children}
    </ContactContext.Provider>
  );
}

/** The CMS's Contact doc — fetched once at the root layout, so any client
 *  component (Footer, ConnectSection, ...) can read it without its page
 *  having to fetch and thread it down itself. */
export function useContact(): ContactData {
  return useContext(ContactContext);
}
