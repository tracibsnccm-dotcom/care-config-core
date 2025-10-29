import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Case, Provider, AuditEntry, Role, ROLES, RCMS_CONFIG } from "@/config/rcms";
import { store, nextQuarterReset } from "@/lib/store";
import { mockCases, mockProviders } from "@/lib/mockData";
import { logAudit } from "@/lib/auditLog";
import { isTrialActive, trialDaysRemaining, coerceTrialStartDate, TRIAL_DAYS } from "@/utils/trial";
import { autoPurgeIncomplete } from "@/modules/rcms-intake-extras";

type TierName = "Trial" | "Basic" | "Solo" | "Mid-Sized" | "Enterprise" | "Expired (Trial)" | "Inactive";

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  currentTier: TierName;
  setCurrentTier: (tier: TierName) => void;
  trialStartDate: string | null;
  setTrialStartDate: React.Dispatch<React.SetStateAction<string | null>>;
  trialEndDate: string | null; // deprecated, kept for back-compat
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
  policyAck: boolean;
  setPolicyAck: React.Dispatch<React.SetStateAction<boolean>>;
  
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
  const [trialStartDate, setTrialStartDate] = useState<string | null>(store.get("trialStartDate", null));
  const [trialEndDate, setTrialEndDate] = useState<string | null>(store.get("trialEndDate", null));
  const [providers, setProviders] = useState<Provider[]>(seedProviders);
  const [cases, setCases] = useState<Case[]>(seedCases);
  const [audit, setAudit] = useState<AuditEntry[]>(seedAudit);
  const [swapsUsed, setSwapsUsed] = useState<number>(store.get("swapsUsed", 0));
  const [extraProviderBlocks, setExtraProviderBlocks] = useState<number>(
    store.get("extraProviderBlocks", 0)
  );
  const [policyAck, setPolicyAck] = useState<boolean>(store.get("policyAck_user-001", false));

  // Persist on change
  useEffect(() => store.set("currentRole", role), [role]);
  useEffect(() => store.set("currentTier", currentTier), [currentTier]);
  useEffect(() => store.set("trialStartDate", trialStartDate), [trialStartDate]);
  useEffect(() => store.set("trialEndDate", trialEndDate), [trialEndDate]);
  useEffect(() => store.set("providers", providers), [providers]);
  useEffect(() => store.set("cases", cases), [cases]);
  useEffect(() => store.set("audit", audit), [audit]);
  useEffect(() => store.set("swapsUsed", swapsUsed), [swapsUsed]);
  useEffect(() => store.set("extraProviderBlocks", extraProviderBlocks), [extraProviderBlocks]);
  useEffect(() => store.set("policyAck_user-001", policyAck), [policyAck]);

  // Data migration: coerce trialStartDate from trialEndDate if needed
  useEffect(() => {
    if (!trialStartDate && trialEndDate) {
      const derivedStart = coerceTrialStartDate({ trialEndDate });
      if (derivedStart) {
        setTrialStartDate(derivedStart);
        store.set("trialStartDate", derivedStart);
      }
    }
  }, [trialStartDate, trialEndDate]);

  // Auto-purge incomplete intakes on init
  useEffect(() => {
    const runPurge = async () => {
      const { keep, purged } = await autoPurgeIncomplete(undefined, cases as any);
      if (purged.length > 0) {
        setCases(keep as any);
        console.log(`Auto-purged ${purged.length} incomplete intake(s) older than 7 days`);
      }
    };
    runPurge();
  }, []); // Run once on mount

  // Check trial expiration and update tier status using new helpers
  useEffect(() => {
    const trialData = { trialStartDate, trialEndDate };
    
    if (currentTier === "Trial") {
      const active = isTrialActive(trialData);
      if (!active) {
        setCurrentTier("Expired (Trial)");
        log("TRIAL_EXPIRED");
      }
    } else if (currentTier === "Expired (Trial)") {
      const daysRemaining = trialDaysRemaining(trialData);
      // Trial expired, check if over 30 days since expiration
      // If daysRemaining is 0, trial ended. Check how long ago.
      if (daysRemaining === 0 && trialStartDate) {
        const start = new Date(trialStartDate);
        const trialEnd = new Date(start);
        trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
        const today = new Date();
        const daysSinceEnd = Math.floor((today.getTime() - trialEnd.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceEnd > 30) {
          setCurrentTier("Inactive");
          log("TRIAL_INACTIVE");
        }
      }
    }
  }, [currentTier, trialStartDate, trialEndDate]);

  const baseTier = currentTier === "Expired (Trial)" || currentTier === "Inactive" ? "Trial" : currentTier;
  const tierCaps = RCMS_CONFIG.tiers[baseTier as keyof typeof RCMS_CONFIG.tiers] || null;
  const providerSlots = tierCaps ? tierCaps.providers.slots + extraProviderBlocks * 10 : 0;
  const routerEnabled = tierCaps ? tierCaps.routerEnabled : false;
  const nextReset = nextQuarterReset();
  const swapsCap = tierCaps ? tierCaps.providers.swapsPerQuarter || 0 : 0;
  const swapsRemaining = Math.max(0, swapsCap - swapsUsed);
  const exportAllowed = (RCMS_CONFIG.featureFlags.exportAllowedForRoles as readonly Role[]).includes(role);

  const isTrialExpired = currentTier === "Expired (Trial)" || currentTier === "Inactive";
  
  // Calculate days until inactive (30 days after trial ends)
  const daysUntilInactive = currentTier === "Expired (Trial)" && trialStartDate
    ? (() => {
        const start = new Date(trialStartDate);
        const trialEnd = new Date(start);
        trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
        const inactiveDate = new Date(trialEnd);
        inactiveDate.setDate(inactiveDate.getDate() + 30);
        const today = new Date();
        const daysLeft = Math.floor((inactiveDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, daysLeft);
      })()
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
    trialStartDate,
    setTrialStartDate,
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
    policyAck,
    setPolicyAck,
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
