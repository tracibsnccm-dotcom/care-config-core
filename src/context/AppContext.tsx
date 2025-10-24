import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Case, Provider, AuditEntry, Role, ROLES, RCMS_CONFIG } from "@/config/rcms";
import { store, nextQuarterReset } from "@/lib/store";
import { mockCases, mockProviders } from "@/lib/mockData";
import { logAudit } from "@/lib/auditLog";

type TierName = "Trial" | "Basic" | "Solo" | "Mid-Sized" | "Enterprise" | "Expired (Trial)" | "Inactive";

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  currentTier: TierName;
  setCurrentTier: (tier: TierName) => void;
  trialEndDate: string | null;
  setTrialEndDate: React.Dispatch<React.SetStateAction<string | null>>;
  providers: Provider[];
  setProviders: React.Dispatch<React.SetStateAction<Provider[]>>;
  cases: Case[];
  setCases: React.Dispatch<React.SetStateAction<Case[]>>;
  audit: AuditEntry[];
  setAudit: React.Dispatch<React.SetStateAction<AuditEntry[]>>;
  swapsUsed: number;
  setSwapsUsed: React.Dispatch<React.SetStateAction<number>>;
  extraProviderBlocks: number;
  setExtraProviderBlocks: React.Dispatch<React.SetStateAction<number>>;
  
  // Computed values
  tierCaps: typeof RCMS_CONFIG.tiers[keyof typeof RCMS_CONFIG.tiers] | null;
  providerSlots: number;
  routerEnabled: boolean;
  nextReset: Date;
  swapsCap: number;
  swapsRemaining: number;
  exportAllowed: boolean;
  isTrialExpired: boolean;
  daysUntilInactive: number | null;
  
  // Helper functions
  log: (action: string, caseId?: string) => void;
  revokeConsent: (caseId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function seedProviders(): Provider[] {
  const seeded = store.get<Provider[] | null>("providers", null);
  if (seeded) return seeded;
  store.set("providers", mockProviders);
  return mockProviders;
}

function seedCases(): Case[] {
  const seeded = store.get<Case[] | null>("cases", null);
  if (seeded) return seeded;
  store.set("cases", mockCases);
  return mockCases;
}

function seedAudit(): AuditEntry[] {
  const seeded = store.get<AuditEntry[] | null>("audit", null);
  if (seeded) return seeded;
  const mock: AuditEntry[] = [];
  store.set("audit", mock);
  return mock;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(store.get("currentRole", ROLES.ATTORNEY));
  const [currentTier, setCurrentTier] = useState<TierName>(store.get("currentTier", "Solo"));
  const [trialEndDate, setTrialEndDate] = useState<string | null>(store.get("trialEndDate", null));
  const [providers, setProviders] = useState<Provider[]>(seedProviders);
  const [cases, setCases] = useState<Case[]>(seedCases);
  const [audit, setAudit] = useState<AuditEntry[]>(seedAudit);
  const [swapsUsed, setSwapsUsed] = useState<number>(store.get("swapsUsed", 0));
  const [extraProviderBlocks, setExtraProviderBlocks] = useState<number>(
    store.get("extraProviderBlocks", 0)
  );

  // Persist on change
  useEffect(() => store.set("currentRole", role), [role]);
  useEffect(() => store.set("currentTier", currentTier), [currentTier]);
  useEffect(() => store.set("trialEndDate", trialEndDate), [trialEndDate]);
  useEffect(() => store.set("providers", providers), [providers]);
  useEffect(() => store.set("cases", cases), [cases]);
  useEffect(() => store.set("audit", audit), [audit]);
  useEffect(() => store.set("swapsUsed", swapsUsed), [swapsUsed]);
  useEffect(() => store.set("extraProviderBlocks", extraProviderBlocks), [extraProviderBlocks]);

  // Check trial expiration and update tier status
  useEffect(() => {
    if (currentTier === "Trial" && trialEndDate) {
      const today = new Date();
      const endDate = new Date(trialEndDate);
      if (today > endDate) {
        setCurrentTier("Expired (Trial)");
        log("TRIAL_EXPIRED");
      }
    } else if (currentTier === "Expired (Trial)" && trialEndDate) {
      const today = new Date();
      const endDate = new Date(trialEndDate);
      const daysSinceEnd = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceEnd > 30) {
        setCurrentTier("Inactive");
        log("TRIAL_INACTIVE");
      }
    }
  }, [currentTier, trialEndDate]);

  const baseTier = currentTier === "Expired (Trial)" || currentTier === "Inactive" ? "Trial" : currentTier;
  const tierCaps = RCMS_CONFIG.tiers[baseTier as keyof typeof RCMS_CONFIG.tiers] || null;
  const providerSlots = tierCaps ? tierCaps.providers.slots + extraProviderBlocks * 10 : 0;
  const routerEnabled = tierCaps ? tierCaps.routerEnabled : false;
  const nextReset = nextQuarterReset();
  const swapsCap = tierCaps ? tierCaps.providers.swapsPerQuarter || 0 : 0;
  const swapsRemaining = Math.max(0, swapsCap - swapsUsed);
  const exportAllowed = (RCMS_CONFIG.featureFlags.exportAllowedForRoles as readonly Role[]).includes(role);

  const isTrialExpired = currentTier === "Expired (Trial)" || currentTier === "Inactive";
  const daysUntilInactive = currentTier === "Expired (Trial)" && trialEndDate
    ? Math.max(0, 30 - Math.floor((new Date().getTime() - new Date(trialEndDate).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  function log(action: string, caseId: string = "n/a") {
    setAudit((prevAudit) => logAudit(prevAudit, action, caseId, role));
  }

  function revokeConsent(caseId: string) {
    setCases((arr) =>
      arr.map((c) =>
        c.id === caseId
          ? {
              ...c,
              consent: { ...c.consent, signed: false },
              status: "HOLD_SENSITIVE",
            }
          : c
      )
    );
    log("CONSENT_REVOKED", caseId);
    alert(
      `Consent revoked for Case ${caseId}.\n\nNotifications sent to:\n- Client\n- Attorney\n- Connected Providers (mock)`
    );
  }

  // Expose for manual testing
  useEffect(() => {
    (window as any).revokeConsent = revokeConsent;
    (window as any).setCases = setCases;
    (window as any).setProviders = setProviders;
    (window as any).setCurrentTier = setCurrentTier;
  }, [cases, providers]);

  const value: AppContextType = {
    role,
    setRole,
    currentTier,
    setCurrentTier,
    trialEndDate,
    setTrialEndDate,
    providers,
    setProviders,
    cases,
    setCases,
    audit,
    setAudit,
    swapsUsed,
    setSwapsUsed,
    extraProviderBlocks,
    setExtraProviderBlocks,
    tierCaps,
    providerSlots,
    routerEnabled,
    nextReset,
    swapsCap,
    swapsRemaining,
    exportAllowed,
    isTrialExpired,
    daysUntilInactive,
    log,
    revokeConsent,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
