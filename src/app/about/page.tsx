"use client";

import AboutSectionText from "@/app/components/AboutSectionText";
import CheckButton from "@/app/components/CheckButton";
import { Reveal } from "@/app/components/Reveal";
import BottomNav from "@/app/components/BottomNav";
import Footer from "../components/Footer";

export default function AboutPage() {
  return (
    <div id="about" className="relative w-full bg-background">
      <h1 className="sr-only">About Multi2</h1>
      {/* Insets match M2Nav: on mobile the bar has no padding of its own
          (the buttons carry it), on desktop it's inset 12px — so the label
          lines up with the nav's first button and the columns with its grid. */}
      <Reveal className="relative z-10 w-full grid grid-cols-3 lg:grid-cols-12 items-baseline gap-y-12 lg:gap-y-6 h-auto   content-center px-0 lg:px-3 pt-28 lg:mt-0 lg:pt-36  bg-transparent">
        <div className="relative z-10 flex items-baseline justify-start col-start-1 col-span-3 lg:col-start-1 lg:col-span-3">
          <CheckButton label="about" size="lg" color="text-primary" active />
        </div>
        {/* The full story — reads the About doc's `aboutLong` field. */}
        <div className="relative z-10 w-full col-start-1 col-span-3 lg:col-start-4 lg:col-span-9 lowercase h-auto px-3 lg:px-0">
          <AboutSectionText
            variant="long"
            className="w-full justify-center lg:content-center pb-6 lg:pb-12 h-auto"
          />
        </div>
      </Reveal>

      {/* lg:px-3 puts BottomNav's 12 columns on the same lines as M2Nav's
          (its bar is inset 12px too). */}
      <div className="w-full mt-24 mb-12 lg:px-3">
        <BottomNav />
      </div>
      <Footer />
    </div>
  );
}
