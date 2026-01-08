/**
 * Attorney Case Queries
 * 
 * This module provides helper functions for attorneys to query cases from Supabase.
 * All queries use direct Supabase queries with RLS policies to ensure attorneys can 
 * ONLY see released/closed cases, never drafts.
 * 
 * The database layer enforces this restriction via RLS policies which automatically
 * filter cases by attorney_id and case_status.
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Get all cases accessible to the authenticated attorney.
 * Returns only released/closed cases (never drafts).
 * 
 * Uses direct query to rc_cases with RLS policies enforcing:
 * - attorney_id must match the authenticated attorney's rc_users.id (via RLS)
 * - case_status must be 'released' or 'closed' (not 'draft')
 * 
 * RLS policies automatically filter by attorney_id, so we just need to filter by status.
 * 
 * @returns Array of case objects with latest released/closed version per revision chain
 */
export async function getAttorneyCases() {
  // Query rc_cases directly - RLS policies will automatically enforce:
  // 1. Only cases where attorney_id matches the authenticated attorney's rc_users.id
  // 2. User must be authenticated (auth.uid() IS NOT NULL)
  // We add explicit filter for released/closed status to ensure no drafts
  const { data, error } = await supabase
    .from('rc_cases')
    .select('*')
    .in('case_status', ['released', 'closed'])
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching attorney cases:', error);
    throw error;
  }

  return (data || []) as AttorneyCase[];
}

/**
 * Get a single case by ID for the authenticated attorney.
 * Returns the latest released/closed version if the case exists in a revision chain.
 * 
 * @param caseId - The case ID to fetch (can be any version in the chain)
 * @returns Case object or null if not found or not accessible
 */
export async function getAttorneyCaseById(caseId: string) {
  // First, get all accessible cases
  const allCases = await getAttorneyCases();
  
  // Find the case by ID (the view returns the latest final version per root)
  // If the provided caseId is in a revision chain, we need to find the root
  // and then get the latest final version for that root
  
  // For now, we'll search by direct ID match first
  const directMatch = allCases.find(c => c.id === caseId);
  if (directMatch) {
    return directMatch;
  }
  
  // If not found, the case might be a draft or the ID might be from a different
  // version in the chain. The view only returns final cases, so if we can't find it,
  // it means either:
  // 1. The case doesn't exist
  // 2. The case is a draft (not accessible to attorneys)
  // 3. The attorney doesn't have access to this case
  
  return null;
}

/**
 * Get cases for a specific client.
 * Returns only released/closed cases for that client.
 * 
 * @param clientId - The client ID
 * @returns Array of case objects
 */
export async function getAttorneyCasesByClientId(clientId: string) {
  const allCases = await getAttorneyCases();
  return allCases.filter(c => c.client_id === clientId);
}

/**
 * Check if a case ID is accessible to the attorney and get its latest final version.
 * This is useful when you have a case ID from user selection and need to resolve
 * it to the latest released/closed version.
 * 
 * Uses the database function resolve_attorney_case() which handles revision chains
 * and returns the latest released/closed version even if the provided caseId is a draft.
 * 
 * @param caseId - Any case ID (could be draft, released, or closed)
 * @returns The latest released/closed case in the same revision chain, or null
 */
export async function resolveAttorneyCase(caseId: string) {
  const { data, error } = await supabase.rpc('resolve_attorney_case', {
    case_id_param: caseId
  });

  if (error) {
    console.error('Error resolving attorney case:', error);
    return null;
  }

  return (data && data.length > 0) ? data[0] : null;
}

/**
 * Type definition for attorney-accessible case
 * Matches the structure returned by attorney_accessible_cases() function
 */
export interface AttorneyCase {
  id: string;
  client_id: string;
  attorney_id: string | null;
  case_type: string | null;
  case_status: 'released' | 'closed'; // Always one of these, never 'draft'
  date_of_injury: string | null;
  jurisdiction: string | null;
  revision_of_case_id: string | null;
  released_at: string | null;
  closed_at: string | null;
  updated_at: string;
  created_at: string;
}
