// src/hooks/useSupabaseData.ts
// React hooks for fetching data from Supabase

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { getAttorneyCases, AttorneyCase } from "@/lib/attorneyCaseQueries";

/* ===================== Types ===================== */

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  practice_name?: string;
  phone?: string;
  email?: string;
  fax?: string;
  address?: string;
  npi?: string;
  accepting_patients: boolean;
}

export interface CaseData {
  id: string;
  client_label?: string;
  atty_ref?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  
  // New fields from migration
  provider_routed?: boolean;
  specialist_report_uploaded?: boolean;
  last_pain_diary_at?: string;
  pain_diary_count_30d?: number;
  sdoh_resolved?: any;
  odg_benchmarks?: any;
  flags?: string[];
  documentation?: any;
  
  // Nested data
  consent?: any;
  incident?: any;
  fourps?: any;
  sdoh?: any;
}

export interface AuditLog {
  id: number;
  ts: string;
  actor_role: string;
  actor_id: string;
  action: string;
  case_id?: string;
  meta?: any;
}

/* ===================== Providers Hook ===================== */

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProviders() {
      try {
        const { data, error: fetchError } = await supabase
          .from("providers")
          .select("*")
          .order("name");

        if (fetchError) throw fetchError;
        setProviders(data || []);
      } catch (err) {
        console.error("Failed to fetch providers:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchProviders();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("providers-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "providers",
        },
        () => {
          fetchProviders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { providers, loading, error, refetch: () => setLoading(true) };
}

/* ===================== Cases Hook ===================== */

export function useCases() {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setCases([]);
      setLoading(false);
      return;
    }

    async function fetchCases() {
      try {
        // Fetch cases the user has access to via rc_case_assignments
        const { data, error: fetchError } = await supabase
          .from("rc_cases")
          .select(`
            *,
            rc_case_assignments!inner(user_id)
          `)
          .eq("rc_case_assignments.user_id", user.id)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setCases(data || []);
      } catch (err) {
        console.error("Failed to fetch cases:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchCases();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("rc-cases-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rc_cases",
        },
        () => {
          fetchCases();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { cases, loading, error, refetch: () => setLoading(true) };
}

/* ===================== Attorney Cases Hook (Released-Only) ===================== */

/**
 * Hook for attorneys to fetch cases.
 * ONLY returns released/closed cases via attorney_accessible_cases() RPC.
 * Never exposes draft cases.
 */
export function useAttorneyCases() {
  const { user, roles, rolesLoading } = useAuth();
  const [cases, setCases] = useState<AttorneyCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Wait for roles to load before checking
    if (rolesLoading) {
      console.log('useAttorneyCases: Waiting for roles to load...');
      return;
    }

    if (!user) {
      console.log('useAttorneyCases: No user, skipping fetch');
      setCases([]);
      setLoading(false);
      return;
    }

    // Normalize roles to uppercase for case-insensitive comparison
    // Note: Roles from auth context should already be uppercase via mapRcUserRoleToAppRole,
    // but we normalize again here to be defensive and handle any edge cases
    const upperRoles = roles && roles.length > 0 ? roles.map(r => r.toUpperCase()) : [];
    
    // Check if user is an RN (case-insensitive) - RN users should NOT fetch attorney cases
    // This includes: 'rn', 'rn_cm', 'RN_CM', 'RN_CCM', 'RN_CM_SUPERVISOR', etc.
    const isRN = upperRoles.some(r => {
      return r === 'RN' || 
             r === 'RN_CM' || 
             r === 'RN_CCM' ||
             r === 'RN_CM_SUPERVISOR' ||
             r === 'RN_CM_MANAGER' ||
             r === 'RN_CM_DIRECTOR' ||
             (r.includes('RN') && !r.includes('ATTORNEY')); // RN roles but not attorney-related
    });
    
    // Check if user is specifically an attorney (not RN or other roles)
    const isAttorney = upperRoles.some(r => {
      return r === 'ATTORNEY' || r === 'STAFF'; // Only fetch for attorneys/staff
    });

    console.log('useAttorneyCases: Roles check:', {
      roles,
      upperRoles,
      rolesLoading,
      isRN,
      isAttorney,
      userId: user?.id
    });

    // Skip fetching if user is an RN (even if they also have attorney role, RN takes precedence)
    if (isRN) {
      console.log('useAttorneyCases: User is an RN, skipping attorney case fetch. Roles:', roles);
      setCases([]);
      setLoading(false);
      return;
    }

    // Only fetch if user is specifically an attorney
    if (!isAttorney) {
      console.log('useAttorneyCases: User is not an attorney, skipping fetch. Roles:', roles);
      setCases([]);
      setLoading(false);
      return;
    }

    async function fetchAttorneyCases() {
      try {
        console.log('=== useAttorneyCases: fetchAttorneyCases called ===');
        console.log('useAttorneyCases: User ID:', user?.id);
        console.log('useAttorneyCases: User roles:', roles);
        
        // Use attorney_accessible_cases() RPC which enforces released-only access
        const attorneyCases = await getAttorneyCases();
        
        console.log('useAttorneyCases: Cases returned from getAttorneyCases:', attorneyCases?.length || 0);
        console.log('useAttorneyCases: Cases data:', attorneyCases);
        
        setCases(attorneyCases || []);
      } catch (err) {
        console.error("useAttorneyCases: Failed to fetch attorney cases:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchAttorneyCases();

    // Note: Real-time subscriptions for attorney cases would need to be handled
    // via the attorney_latest_final_cases view, but for MVP we'll refetch on demand
    // Attorneys can manually refresh if needed
  }, [user, roles, rolesLoading]);

  return { cases, loading, error, refetch: () => setLoading(true) };
}

/* ===================== Audit Logs Hook ===================== */

export function useAuditLogs(caseId?: string) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAuditLogs() {
      try {
        let query = supabase
          .from("audit_logs")
          .select("*")
          .order("ts", { ascending: false })
          .limit(100);

        if (caseId) {
          query = query.eq("case_id", caseId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setAuditLogs(data || []);
      } catch (err) {
        console.error("Failed to fetch audit logs:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchAuditLogs();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("audit-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "audit_logs",
        },
        () => {
          fetchAuditLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId]);

  return { auditLogs, loading, error, refetch: () => setLoading(true) };
}

/* ===================== Case Details Hook ===================== */

export function useCaseDetails(caseId: string) {
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [intake, setIntake] = useState<any>(null);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCaseDetails() {
      try {
        // Fetch case
        const { data: caseResult, error: caseError } = await supabase
          .from("cases")
          .select("*")
          .eq("id", caseId)
          .single();

        if (caseError) throw caseError;
        setCaseData(caseResult);

        // Fetch intake
        const { data: intakeResult, error: intakeError } = await supabase
          .from("intakes")
          .select("*")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!intakeError && intakeResult) {
          setIntake(intakeResult);
        }

        // Fetch checkins
        const { data: checkinsResult, error: checkinsError } = await supabase
          .from("checkins")
          .select("*")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false });

        if (!checkinsError && checkinsResult) {
          setCheckins(checkinsResult);
        }

        // Fetch documents
        const { data: docsResult, error: docsError } = await supabase
          .from("documents")
          .select("*")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false });

        if (!docsError && docsResult) {
          setDocuments(docsResult);
        }
      } catch (err) {
        console.error("Failed to fetch case details:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    if (caseId) {
      fetchCaseDetails();
    }
  }, [caseId]);

  return {
    caseData,
    intake,
    checkins,
    documents,
    loading,
    error,
    refetch: () => setLoading(true),
  };
}

/* ===================== User Cases Hook (for specific user) ===================== */

export function useUserCases(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!targetUserId) {
      setCases([]);
      setLoading(false);
      return;
    }

    async function fetchUserCases() {
      try {
        const { data, error: fetchError } = await supabase
          .from("case_assignments")
          .select(`
            case_id,
            role,
            cases (*)
          `)
          .eq("user_id", targetUserId);

        if (fetchError) throw fetchError;
        
        // Extract cases from assignments
        const casesData = data?.map((assignment: any) => ({
          ...assignment.cases,
          assignedRole: assignment.role,
        })) || [];
        
        setCases(casesData);
      } catch (err) {
        console.error("Failed to fetch user cases:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserCases();
  }, [targetUserId]);

  return { cases, loading, error, refetch: () => setLoading(true) };
}
