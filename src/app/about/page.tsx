"use client";

import AboutSectionText from "@/app/components/AboutSectionText";
import LandningBlock from "@/app/components/LandningBlock";
import BottomNav from "@/app/components/BottomNav";

export default function AboutPage() {
  return (
    <div
      id="about"
      className="relative   w-full px-3 lg:px-6 pt-28 lg:mt-0 lg:pt-36   "
    >
      <LandningBlock
        label="about"
        className="h-[25dvh]   content-center  w-full bg-transparent"
        labelClassName="col-start-1 col-span-3 lg:col-start-1 lg:col-span-3"
      >
        {/* The full story — reads the About doc's `aboutLong` field. */}
        <AboutSectionText
          variant="long"
          className="w-full justify-center lg:content-center pb-6 lg:pb-12"
        />
      </LandningBlock>

      <div className="w-full mt-24 mb-12">
        <BottomNav />
      </div>
    </div>
  );
}
