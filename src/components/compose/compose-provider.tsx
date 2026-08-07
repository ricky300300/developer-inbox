"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ComposePopup } from "@/components/compose/compose-popup";

type ComposeContextValue = {
  open: boolean;
  openCompose: () => void;
  closeCompose: () => void;
};

const ComposeContext = createContext<ComposeContextValue | null>(null);

export function ComposeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openCompose = useCallback(() => setOpen(true), []);
  const closeCompose = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, openCompose, closeCompose }),
    [open, openCompose, closeCompose],
  );

  return (
    <ComposeContext.Provider value={value}>
      {children}
      <ComposePopup open={open} onOpenChange={setOpen} />
    </ComposeContext.Provider>
  );
}

export function useCompose() {
  const ctx = useContext(ComposeContext);
  if (!ctx) {
    throw new Error("useCompose must be used within ComposeProvider");
  }
  return ctx;
}
