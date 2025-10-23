import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Case, Provider, AuditEntry, Role, ROLES, RCMS_CONFIG } from "@/config/rcms";
import { store, nextQuarterReset } from "@/lib/store";
import { mockCases, mockProviders } from "@/lib/mockData";
import { logAudit } from "@/lib/auditLog";

type TierName = "Basic" | "Solo" | "Mid-Sized" | "Enterprise";

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  currentTier: TierName;
  setCurrentTier: (tier: TierName) => void;
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
  tierCaps: typeof RCMS_CONFIG.tiers[TierName];
  providerSlots: number;
  routerEnabled: boolean;
  nextReset: Date;
  swapsCap: number;
  swapsRemaining: number;
  exportAllowed: boolean;
  
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
  useEffect(() => store.set("providers", providers), [providers]);
  useEffect(() => store.set("cases", cases), [cases]);
  useEffect(() => store.set("audit", audit), [audit]);
  useEffect(() => store.set("swapsUsed", swapsUsed), [swapsUsed]);
  useEffect(() => store.set("extraProviderBlocks", extraProviderBlocks), [extraProviderBlocks]);

  const tierCaps = RCMS_CONFIG.tiers[currentTier];
  const providerSlots = tierCaps.providers.slots + extraProviderBlocks * 10;
  const routerEnabled = tierCaps.routerEnabled;
  const nextReset = nextQuarterReset();
  const swapsCap = tierCaps.providers.swapsPerQuarter || 0;
  const swapsRemaining = Math.max(0, swapsCap - swapsUsed);
  const exportAllowed = (RCMS_CONFIG.featureFlags.exportAllowedForRoles as readonly Role[]).includes(role);

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
