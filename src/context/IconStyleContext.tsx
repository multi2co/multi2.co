"use client";

import { createContext, useContext, type ReactNode } from "react";

export type IconStyle = "square" | "dot";

const IconStyleContext = createContext<IconStyle>("square");

export function IconStyleProvider({
  iconStyle,
  children,
}: {
  iconStyle?: IconStyle | null;
  children: ReactNode;
}) {
  return (
    <IconStyleContext.Provider value={iconStyle === "dot" ? "dot" : "square"}>
      {children}
    </IconStyleContext.Provider>
  );
}

/** The CMS toggle deciding whether checkbox-style marks across the site (every
 *  CheckButton, the nav field) draw as filled squares or filled dots. */
export function useIconStyle(): IconStyle {
  return useContext(IconStyleContext);
}
