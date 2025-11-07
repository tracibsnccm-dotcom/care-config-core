import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Case, Provider, AuditEntry, Role, ROLES, RCMS_CONFIG } from "@/config/rcms";
import { store, nextQuarterReset } from "@/lib/store";
import { isTrialActive, trialDaysRemaining, coerceTrialStartDate, TRIAL_DAYS } from "@/utils/trial";
import { useAuth } from "@/auth/supabaseAuth";
import { useCases, useProviders, useAuditLogs } from "@/hooks/useSupabaseData";
import { audit } from "@/lib/supabaseOperations";

type TierName = "Trial" | "Basic" | "Solo" | "Mid-Sized" | "Enterprise" | "Expired (Trial)" | "Inactive";

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  currentTier: TierName;
  tier: TierName; // Alias for currentTier for consistency
  setCurrentTier: (tier: TierName) => void;
  trialStartDate: string | null;
  setTrialStartDate: React.Dispatch<React.SetStateAction<string | null>>;
  trialEndDate: string | null;
  setTrialEndDate: React.Dispatch<React.SetStateAction<string | null>>;
  providers: Provider[];
  setProviders: React.Dispatch<React.SetStateAction<Provider[]>>; // Deprecated - use database operations
  cases: Case[];
  setCases: React.Dispatch<React.SetStateAction<Case[]>>; // Deprecated - use database operations
  audit: AuditEntry[];
  swapsUsed: number;
  setSwapsUsed: React.Dispatch<React.SetStateAction<number>>;
  extraProviderBlocks: number;
  setExtraProviderBlocks: React.Dispatch<React.SetStateAction<number>>;
  policyAck: boolean;
  setPolicyAck: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Loading states
  loading: boolean;
  
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

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, roles } = useAuth();
  
  // Fetch data from Supabase
  const { cases: supabaseCases, loading: casesLoading } = useCases();
  const { providers: supabaseProviders, loading: providersLoading } = useProviders();
  const { auditLogs, loading: auditLoading } = useAuditLogs();
  
  // Derive role from actual auth roles - use first role or default to ATTORNEY
  const role = (roles && roles.length > 0 ? roles[0].toUpperCase() : ROLES.ATTORNEY) as Role;
  const setRole = () => {
    // Role cannot be changed - it comes from database
    console.warn("Role is read-only and determined by database user_roles table");
  };
  const [currentTier, setCurrentTier] = useState<TierName>(store.get("currentTier", "Solo"));
  const [trialStartDate, setTrialStartDate] = useState<string | null>(store.get("trialStartDate", null));
  const [trialEndDate, setTrialEndDate] = useState<string | null>(store.get("trialEndDate", null));
  const [swapsUsed, setSwapsUsed] = useState<number>(store.get("swapsUsed", 0));
  const [extraProviderBlocks, setExtraProviderBlocks] = useState<number>(
    store.get("extraProviderBlocks", 0)
  );
  const [policyAck, setPolicyAck] = useState<boolean>(
    store.get(`policyAck_${user?.id || "guest"}`, false)
  );

  // Transform Supabase data to match existing Case/Provider types
  const cases: Case[] = supabaseCases.map((c: any) => ({
    id: c.id,
    firmId: user?.id || "unknown",
    onsetOfService: c.created_at,
    client: {
      rcmsId: c.id,
      attyRef: c.atty_ref || "",
      displayNameMasked: c.client_label || "Unknown",
      fullName: c.client_label || "Unknown",
      dobMasked: "",
      gender: "prefer_not_to_say",
      state: "",
    },
    intake: c.incident || {},
    fourPs: c.fourps || {},
    sdoh: c.sdoh || {},
    demographics: {},
    consent: c.consent || { signed: false },
    flags: c.flags || [],
    sdohFlags: [],
    riskLevel: "stable",
    status: c.status || "NEW",
    checkins: [],
    createdAt: c.created_at,
    updatedAt: c.updated_at || c.created_at,
  }));

  const providers: Provider[] = supabaseProviders.map((p: any) => ({
    id: p.id,
    name: p.name,
    specialty: p.specialty,
    city: p.address || "",
    state: "",
    distanceMiles: 0,
    active: p.accepting_patients,
  }));

  const auditEntries: AuditEntry[] = auditLogs.map((log: any) => ({
    id: log.id.toString(),
    ts: log.ts,
    actorRole: log.actor_role,
    actorId: log.actor_id,
    action: log.action,
    caseId: log.case_id,
    meta: log.meta,
  }));

  // Persist app-level state (excluding role which is now derived from auth)
  useEffect(() => store.set("currentTier", currentTier), [currentTier]);
  useEffect(() => store.set("trialStartDate", trialStartDate), [trialStartDate]);
  useEffect(() => store.set("trialEndDate", trialEndDate), [trialEndDate]);
  useEffect(() => store.set("swapsUsed", swapsUsed), [swapsUsed]);
  useEffect(() => store.set("extraProviderBlocks", extraProviderBlocks), [extraProviderBlocks]);
  useEffect(() => {
    if (user?.id) {
      store.set(`policyAck_${user.id}`, policyAck);
    }
  }, [policyAck, user?.id]);

  // Data migration: coerce trialStartDate from trialEndDate if needed
  useEffect(() => {
    const userData = { trialStartDate, trialEndDate };
    const coerced = coerceTrialStartDate(userData);
    if (coerced && coerced !== trialStartDate) {
      setTrialStartDate(coerced);
    }
  }, [trialStartDate, trialEndDate]);

  // Computed values
  const tierCaps = currentTier in RCMS_CONFIG.tiers ? RCMS_CONFIG.tiers[currentTier] : null;
  const providerSlots = (tierCaps?.providerSlots ?? 0) + extraProviderBlocks * 5;
  const routerEnabled = tierCaps?.routerEnabled ?? false;
  const nextReset = nextQuarterReset();
  const swapsCap = tierCaps?.swapsCap ?? 0;
  const swapsRemaining = Math.max(0, swapsCap - swapsUsed);
  const exportAllowed = tierCaps?.exportAllowed ?? false;
  
  const userData = { trialStartDate, trialEndDate };
  const isTrialExpired = !isTrialActive(userData);
  const trialDays = trialDaysRemaining(userData);
  const gracePeriodDays = isTrialExpired ? TRIAL_DAYS + 14 - trialDays : null;
  const daysUntilInactive = gracePeriodDays !== null && gracePeriodDays <= 14 ? gracePeriodDays : null;

  // Helper functions
  async function log(action: string, caseId?: string) {
    try {
      await audit({
        actorRole: role,
        actorId: user?.id || "unknown",
        action: action as any,
        caseId,
      });
    } catch (error) {
      console.error("Failed to log audit event:", error);
    }
  }

  function revokeConsent(caseId: string) {
    // This would trigger a Supabase update
    log("CONSENT_REVOKED", caseId);
    // TODO: Update case consent in database
  }

  // Deprecated setters for backward compatibility
  // These are no-ops since data comes from Supabase realtime
  function setCases(_cases: React.SetStateAction<Case[]>) {
    console.warn("setCases is deprecated. Data is managed by Supabase. Changes will be overwritten.");
  }

  function setProviders(_providers: React.SetStateAction<Provider[]>) {
    console.warn("setProviders is deprecated. Data is managed by Supabase. Changes will be overwritten.");
  }

  const loading = casesLoading || providersLoading || auditLoading;

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentTier,
        tier: currentTier, // Alias
        setCurrentTier,
        trialStartDate,
        setTrialStartDate,
        trialEndDate,
        setTrialEndDate,
        providers,
        setProviders,
        cases,
        setCases,
        audit: auditEntries,
        swapsUsed,
        setSwapsUsed,
        extraProviderBlocks,
        setExtraProviderBlocks,
        policyAck,
        setPolicyAck,
        loading,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
