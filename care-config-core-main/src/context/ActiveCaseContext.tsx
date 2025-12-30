// src/context/ActiveCaseContext.tsx
// Single source of truth for active case state in demo mode
// Wraps MockDBProvider to provide a unified API

import React, { createContext, useContext, ReactNode } from "react";
import { MockDBProvider, useMockDB, CaseRecord } from "../lib/mockDB";

interface ActiveCaseContextValue {
  cases: CaseRecord[];
  activeCase: CaseRecord | null;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  setActiveCaseById: (caseId: string) => void;
}

const ActiveCaseContext = createContext<ActiveCaseContextValue | undefined>(undefined);

/**
 * Provider component that wraps MockDBProvider and provides active case state.
 * This is the single source of truth for active case in demo mode.
 */
export function ActiveCaseProvider({ children }: { children: ReactNode }) {
  return (
    <MockDBProvider>
      <ActiveCaseProviderInner>{children}</ActiveCaseProviderInner>
    </MockDBProvider>
  );
}

function ActiveCaseProviderInner({ children }: { children: ReactNode }) {
  const { cases, activeCase, activeIndex, setActiveIndex } = useMockDB();

  const setActiveCaseById = (caseId: string) => {
    const index = cases.findIndex((c) => c.id === caseId || c.shortId === caseId);
    if (index >= 0) {
      setActiveIndex(index);
    }
  };

  const value: ActiveCaseContextValue = {
    cases,
    activeCase,
    activeIndex,
    setActiveIndex,
    setActiveCaseById,
  };

  return <ActiveCaseContext.Provider value={value}>{children}</ActiveCaseContext.Provider>;
}

/**
 * Hook to access active case state.
 * This is the single source of truth - all components should use this hook.
 */
export function useActiveCase(): ActiveCaseContextValue {
  const context = useContext(ActiveCaseContext);
  if (!context) {
    throw new Error("useActiveCase must be used within an ActiveCaseProvider");
  }
  return context;
}


