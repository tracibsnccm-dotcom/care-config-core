/**
 * RN Case Helpers
 * 
 * Helper functions for RN case workflow operations.
 */

import { supabase } from "@/integrations/supabase/client";
import { resolveLatestReleasedCase, type CaseWithRevision } from "@/lib/resolveLatestReleasedCase";

export interface LatestReleasedCase {
  id: string;
  released_at: string;
  case_status: string;
}

/**
 * Get the latest released case in the revision chain for a given case ID.
 * 
 * @param activeCaseId - The current active case ID (may be draft or any revision in chain)
 * @returns The latest released/closed case in the chain, or null if none exists
 */
export async function getLatestReleasedForChain(
  activeCaseId: string | null | undefined
): Promise<LatestReleasedCase | null> {
  if (!activeCaseId) return null;

  try {
    // Fetch all cases to use with resolveLatestReleasedCase
    const { data: allCases, error } = await supabase
      .from("rc_cases")
      .select("id, revision_of_case_id, case_status, released_at, closed_at, updated_at, created_at");

    if (error) {
      console.error("[getLatestReleasedForChain] Error fetching cases:", error);
      return null;
    }

    if (!allCases || allCases.length === 0) {
      return null;
    }

    // Use existing resolver function
    const latest = resolveLatestReleasedCase(allCases as CaseWithRevision[], activeCaseId);

    if (!latest) {
      return null;
    }

    return {
      id: latest.id,
      released_at: latest.released_at || "",
      case_status: latest.case_status || "",
    };
  } catch (e) {
    console.error("[getLatestReleasedForChain] Exception:", e);
    return null;
  }
}

/**
 * Find the current draft case in the revision chain (most recent non-released/closed case).
 * 
 * @param activeCaseId - The current active case ID (may be in a revision chain)
 * @returns The most recent draft/working/revised/ready case in the chain, or null if none exists
 */
export async function getCurrentDraftInChain(
  activeCaseId: string | null | undefined
): Promise<string | null> {
  if (!activeCaseId) return null;

  try {
    // Fetch all cases to find the chain
    const { data: allCases, error } = await supabase
      .from("rc_cases")
      .select("id, revision_of_case_id, case_status, updated_at, created_at");

    if (error) {
      console.error("[getCurrentDraftInChain] Error fetching cases:", error);
      return null;
    }

    if (!allCases || allCases.length === 0) {
      return null;
    }

    // Find the starting case
    const startCase = allCases.find((c) => c.id === activeCaseId);
    if (!startCase) {
      return null;
    }

    // Walk up to find root
    let rootCase = startCase;
    const visited = new Set<string>([startCase.id]);

    while (rootCase.revision_of_case_id) {
      const parentId = rootCase.revision_of_case_id;
      if (visited.has(parentId)) {
        break;
      }
      visited.add(parentId);

      const parent = allCases.find((c) => c.id === parentId);
      if (!parent) {
        break;
      }
      rootCase = parent;
    }

    // Gather all cases in the chain
    const chainIds = new Set<string>([rootCase.id]);
    let toProcess = [rootCase.id];
    const processed = new Set<string>();

    while (toProcess.length > 0) {
      const currentId = toProcess.shift()!;
      if (processed.has(currentId)) continue;
      processed.add(currentId);

      const children = allCases.filter(
        (c) => c.revision_of_case_id === currentId && !chainIds.has(c.id)
      );

      for (const child of children) {
        chainIds.add(child.id);
        toProcess.push(child.id);
      }
    }

    // Filter to editable cases (draft, working, revised, ready)
    const editableCases = allCases.filter(
      (c) =>
        chainIds.has(c.id) &&
        c.case_status &&
        ["draft", "working", "revised", "ready"].includes(c.case_status.toLowerCase())
    );

    if (editableCases.length === 0) {
      return null;
    }

    // Sort by updated_at desc (or created_at desc) and return most recent
    editableCases.sort((a, b) => {
      const aTime = a.updated_at
        ? new Date(a.updated_at).getTime()
        : a.created_at
        ? new Date(a.created_at).getTime()
        : 0;
      const bTime = b.updated_at
        ? new Date(b.updated_at).getTime()
        : b.created_at
        ? new Date(b.created_at).getTime()
        : 0;
      return bTime - aTime;
    });

    return editableCases[0].id;
  } catch (e) {
    console.error("[getCurrentDraftInChain] Exception:", e);
    return null;
  }
}
