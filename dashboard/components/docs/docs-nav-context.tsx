"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { DocsProductTab } from "@/lib/docs-nav";

type DocsNavContextValue = {
  productTab: DocsProductTab;
  setProductTab: (t: DocsProductTab) => void;
  activeId: string;
  setActiveId: (id: string) => void;
  navFilter: string;
  setNavFilter: (v: string) => void;
};

const DocsNavContext = createContext<DocsNavContextValue | null>(null);

export function DocsNavProvider({ children }: { children: ReactNode }) {
  const [productTab, setProductTab] = useState<DocsProductTab>("guides");
  const [activeId, setActiveId] = useState("overview");
  const [navFilter, setNavFilter] = useState("");

  const value = useMemo(
    () => ({
      productTab,
      setProductTab,
      activeId,
      setActiveId,
      navFilter,
      setNavFilter,
    }),
    [productTab, activeId, navFilter],
  );

  return <DocsNavContext.Provider value={value}>{children}</DocsNavContext.Provider>;
}

export function useDocsNav(): DocsNavContextValue {
  const ctx = useContext(DocsNavContext);
  if (!ctx) {
    throw new Error("useDocsNav must be used within DocsNavProvider");
  }
  return ctx;
}

