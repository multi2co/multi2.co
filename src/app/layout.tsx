import type { Metadata } from "next";
import localFont from "next/font/local";
import React from "react";
import "./globals.css";
import { WorkContextServer } from "@/context/WorkContextServer";
import { AboutContextServer } from "@/context/AboutContextServer";
import { ContactContextServer } from "@/context/ContactContextServer";
import { IconStyleContextServer } from "@/context/IconStyleContextServer";
import { UIProvider } from "@/context/UIContext";
import { SoundProvider } from "@/context/SoundContext";
import { ThemeProvider } from "@/context/ThemeContext";
import M2Nav from "@/app/components/M2Nav";
import CookieAndSound from "@/app/components/CookieAndSound";
import SmoothScroll from "@/app/components/SmoothScroll";
import UnderConstruction from "./components/UnderConstruction";
import ThemeToggle from "./components/ThemeToggle";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — creative agency, Stockholm`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: "/",
  },
  twitter: { card: "summary_large_image" },
};

/** Who's behind the site, for search engines — rendered as JSON-LD. */
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  description: SITE_DESCRIPTION,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Stockholm",
    addressCountry: "SE",
  },
};

const visualFont = localFont({
  src: [
    {
      path: "../../public/fonts/visual/Visual-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/visual/Visual-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/visual/Visual-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/visual/Visual-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-visual",
  display: "swap",
});

const multiDotsFont = localFont({
  src: "../../public/fonts/multi-dots-4-Regular.woff2",
  variable: "--font-multi-dots",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Re-applies the saved colour theme before first paint, so a chosen
            palette survives reloads without a red flash. Bare :root is already
            the red palette, so "red" / no value needs no class. Light is the
            site default — dark only applies once the visitor has explicitly
            switched it on ('multi2-dark' === '1'). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('multi2-theme');var m={red:'multi2_red',blue:'multi2_blue',green:'multi2_green',pink:'multi2_pink',teal:'multi2_teal',bw:'multi2_bw'};if(t&&m[t])document.documentElement.classList.add(m[t]);if(localStorage.getItem('multi2-dark')==='1')document.documentElement.classList.add('multi2_dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${visualFont.variable} ${multiDotsFont.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ORGANIZATION_JSON_LD),
          }}
        />
        <WorkContextServer>
          <IconStyleContextServer>
            <AboutContextServer>
              <ContactContextServer>
                <UIProvider>
                  <SoundProvider>
                    <ThemeProvider>
                      <UnderConstruction />
                      <ThemeToggle />
                      <M2Nav />
                      <CookieAndSound />

                      <SmoothScroll>{children}</SmoothScroll>
                    </ThemeProvider>
                  </SoundProvider>
                </UIProvider>
              </ContactContextServer>
            </AboutContextServer>
          </IconStyleContextServer>
        </WorkContextServer>
      </body>
    </html>
  );
}
