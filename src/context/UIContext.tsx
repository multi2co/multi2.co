"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { DEFAULT_COLS } from "@/lib/gridZoom";

type UIContextType = {
  contentDoneKey: number;
  notifyContentDone: () => void;
  /** M2Nav's own "loading…" state, published so a page can hold its intro
   *  back until the bar has finished saying it. */
  navLoading: boolean;
  setNavLoading: (v: boolean) => void;
  showGrid: boolean;
  setShowGrid: (v: boolean) => void;
  showList: boolean;
  setShowList: (v: boolean) => void;
  activeFilter: string;
  setActiveFilter: (v: string) => void;
  filtersOpen: boolean;
  setFiltersOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  openedCard: string | null;
  setOpenedCard: (slug: string | null) => void;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  search: string;
  setSearch: (v: string) => void;
  numCols: number;
  setNumCols: (n: number) => void;
  sortMode: "year" | "title";
  setSortMode: (v: "year" | "title" | ((prev: "year" | "title") => "year" | "title")) => void;
};

const UIContext = createContext<UIContextType | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [showGrid, setShowGrid] = useState(true);
  const [showList, setShowList] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  // mobile only: desktop always shows the category column (CategoryFilters),
  // below lg the same list is a full-screen overlay that starts closed
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(true);
  const [openedCard, setOpenedCard] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [search, setSearch] = useState("");
  const [numCols, setNumCols] = useState(DEFAULT_COLS);
  const [sortMode, setSortMode] = useState<"year" | "title">("year");
  const [contentDoneKey, setContentDoneKey] = useState(0);
  const [navLoading, setNavLoading] = useState(true);
  const notifyContentDone = useCallback(
    () => setContentDoneKey((k) => k + 1),
    [],
  );

  // Thumbnails is the default view at every width. numCols only drives the
  // desktop grid; below lg the list is one card per row.
  useEffect(() => {
    setNumCols(window.innerWidth >= 1024 ? DEFAULT_COLS : 2);
  }, []);

  return (
    <UIContext.Provider
      value={{
        showGrid,
        setShowGrid,
        showList,
        setShowList,
        activeFilter,
        setActiveFilter,
        filtersOpen,
        setFiltersOpen,
        searchOpen,
        setSearchOpen,
        openedCard,
        setOpenedCard,
        showSettings,
        setShowSettings,
        search,
        setSearch,
        numCols,
        setNumCols,
        sortMode,
        setSortMode,
        contentDoneKey,
        notifyContentDone,
        navLoading,
        setNavLoading,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside UIProvider");
  return ctx;
}
