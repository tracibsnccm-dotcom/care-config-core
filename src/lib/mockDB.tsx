// src/lib/mockDB.tsx

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { AppState } from "./models";

/**
 * MockDB is a simple, in-memory case store for development and testing.
 *
 * - Holds 3–5 sample AppState cases.
 * - Tracks which case is "active" for the current view.
 * - Lets you update the active case or add new ones from intake.
 *
 * Later, this can be removed or replaced by a real API layer without
 * changing RN / Attorney / Director / Client components very much.
 */

interface MockDBContextValue {
  cases: AppState[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  activeCase: AppState | null;
  updateActiveCase: (next: AppState) => void;
  addCase: (next: AppState) => void;
}

// We’ll fill in 5 archetype cases as starting points.
// NOTE: We use "as any" for client to avoid fighting type changes while
// your domain model continues to evolve. The real backend will be strict.

const initialCases: AppState[] = [
  // Level 1 – Simple, near-ready for closure
  {
    client: {
      id: "C-001",
      name: "Sample Client – Simple",
      caseStatus: "Active",
      severityLevel: 1,
      viabilityScore: 8.5,
      viabilityStatus: "Low Risk / Stable",
      vitalityScore: 8.8,
      ragStatus: "Green",
      assignedRnId: "RN-01",
      assignedAttorneyId: "AT-01",
      lastFollowupDate: null,
      nextFollowupDue: null,
    } as any,
    flags: [],
    tasks: [],
  } as AppState,

  // Level 2 – Moderate with SDOH barrier
  {
    client: {
      id: "C-002",
      name: "Sample Client – SDOH Barrier",
      caseStatus: "Active",
      severityLevel: 2,
      viabilityScore: 6.2,
      viabilityStatus: "Moderate Risk",
      vitalityScore: 6.0,
      ragStatus: "Amber",
      assignedRnId: "RN-01",
      assignedAttorneyId: "AT-01",
      lastFollowupDate: null,
      nextFollowupDue: null,
    } as any,
    flags: [
      {
        id: "F-002-1",
        label: "Transportation barrier to PT",
        type: "SDOH",
        severity: "High",
        status: "Open",
      } as any,
    ],
    tasks: [],
  } as AppState,

  // Level 3 – Complex: pain + psych + work disruption
  {
    client: {
      id: "C-003",
      name: "Sample Client – Complex Pain & Mood",
      caseStatus: "Active",
      severityLevel: 3,
      viabilityScore: 4.3,
      viabilityStatus: "High Risk / Complex",
      vitalityScore: 4.0,
      ragStatus: "Amber",
      assignedRnId: "RN-02",
      assignedAttorneyId: "AT-02",
      lastFollowupDate: null,
      nextFollowupDue: null,
    } as any,
    flags: [
      {
        id: "F-003-1",
        label: "High pain with incomplete multimodal management",
        type: "Clinical",
        severity: "High",
        status: "Open",
      } as any,
      {
        id: "F-003-2",
        label: "Depressive symptoms impacting engagement",
        type: "Psychological",
        severity: "Moderate",
        status: "Open",
      } as any,
    ],
    tasks: [],
  } as AppState,

  // Level 4 – Severely complex / catastrophic
  {
    client: {
      id: "C-004",
      name: "Sample Client – Severely Complex",
      caseStatus: "Active",
      severityLevel: 4,
      viabilityScore: 3.1,
      viabilityStatus: "Severely Complex / Fragile",
      vitalityScore: 3.0,
      ragStatus: "Red",
      assignedRnId: "RN-02",
      assignedAttorneyId: "AT-02",
      lastFollowupDate: null,
      nextFollowupDue: null,
    } as any,
    flags: [
      {
        id: "F-004-1",
        label: "High fall risk / safety concern",
        type: "Clinical",
        severity: "Critical",
        status: "Open",
      } as any,
      {
        id: "F-004-2",
        label: "Housing instability",
        type: "SDOH",
        severity: "High",
        status: "Open",
      } as any,
      {
        id: "F-004-3",
        label: "Multiple specialty referrals pending",
        type: "Coordination",
        severity: "Moderate",
        status: "Open",
      } as any,
    ],
    tasks: [],
  } as AppState,

  // Edge case – Declines CM / limited engagement
  {
    client: {
      id: "C-005",
      name: "Sample Client – Limited Engagement",
      caseStatus: "Active",
      severityLevel: 2,
      viabilityScore: 5.0,
      viabilityStatus: "Candidate, but Declining CM",
      vitalityScore: 5.2,
      ragStatus: "Amber",
      cmDeclined: true,
      assignedRnId: "RN-01",
      assignedAttorneyId: "AT-03",
      lastFollowupDate: null,
      nextFollowupDue: null,
    } as any,
    flags: [
      {
        id: "F-005-1",
        label: "Financial strain / risk for lost to follow-up",
        type: "SDOH",
        severity: "High",
        status: "Open",
      } as any,
    ],
    tasks: [],
  } as AppState,
];

const MockDBContext = createContext<MockDBContextValue | undefined>(undefined);

export const MockDBProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [cases, setCases] = useState<AppState[]>(initialCases);
  const [activeIndex, setActiveIndex] = useState<number>(
    initialCases.length ? 0 : -1
  );

  const activeCase =
    activeIndex >= 0 && activeIndex < cases.length ? cases[activeIndex] : null;

  const updateActiveCase = (next: AppState) => {
    setCases((prev) => {
      if (!prev.length || activeIndex < 0 || activeIndex >= prev.length) {
        return [next];
      }
      const copy = [...prev];
      copy[activeIndex] = next;
      return copy;
    });
  };

  const addCase = (next: AppState) => {
    setCases((prev) => [...prev, next]);
    if (activeIndex === -1) {
      setActiveIndex(0);
    }
  };

  return (
    <MockDBContext.Provider
      value={{
        cases,
        activeIndex,
        setActiveIndex,
        activeCase,
        updateActiveCase,
        addCase,
      }}
    >
      {children}
    </MockDBContext.Provider>
  );
};

export const useMockDB = (): MockDBContextValue => {
  const ctx = useContext(MockDBContext);
  if (!ctx) {
    throw new Error("useMockDB must be used within a MockDBProvider");
  }
  return ctx;
};
