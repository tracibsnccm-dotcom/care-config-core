// src/components/CrisisModeButton.tsx
// RN Crisis Mode starter — now writes to Supabase when possible,
// but still falls back to a dev stub incident ID if anything fails.

import React, { useState } from "react";
import { CrisisCategory } from "../domain/crisisCategory";

type CrisisModeButtonProps = {
  caseId: string;
  crisisCategory?: CrisisCategory | null;
  onStart?: (incidentId: string) => void;
};

// Read Supabase env vars for Vite
const SUPABASE_URL =
  (import.meta as any).env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY =
  (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string | undefined;

type StartResultSource = "supabase" | "stub" | "fallback" | "error";

async function createCrisisIncidentInSupabase(
  caseId: string,
  crisisCategory?: CrisisCategory | null
): Promise<{ incidentId: string; source: StartResultSource }> {
  // If env vars aren’t present, just use a stub ID (dev safe)
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      "[CrisisModeButton] Supabase env not set. Using stub incident ID."
    );
    return {
      incidentId: `dev-stub-incident-${Date.now()}`,
      source: "stub",
    };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/crisis_incidents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        case_id: caseId,
        trigger_source: "rn_manual",
        crisis_category: crisisCategory ?? null,
        // You can add more defaults here later if you want (ems_status, etc.)
      }),
    });

    if (!res.ok) {
      console.warn(
        "[CrisisModeButton] Supabase insert not OK. Status:",
        res.status
      );
      return {
        incidentId: `dev-stub-incident-${Date.now()}`,
        source: "fallback",
      };
    }

    const data = await res.json();
    const row = Array.isArray(data) ? data[0] : data;
    const incidentId =
      row?.id?.toString() ??
      row?.incident_id?.toString?.() ??
      `dev-stub-incident-${Date.now()}`;

    console.log("[CrisisModeButton] Supabase incident created:", row);

    return {
      incidentId,
      source: "supabase",
    };
  } catch (error) {
    console.warn(
      "[CrisisModeButton] Supabase insert failed. Using stub incident ID.",
      error
    );
    return {
      incidentId: `dev-stub-incident-${Date.now()}`,
      source: "error",
    };
  }
}

const CrisisModeButton: React.FC<CrisisModeButtonProps> = ({
  caseId,
  crisisCategory,
  onStart,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;

    // Require the RN to choose a crisis type first
    if (!crisisCategory) {
      alert("Please choose a crisis type before entering Crisis Mode.");
      return;
    }

    setIsLoading(true);

    try {
      const { incidentId, source } = await createCrisisIncidentInSupabase(
        caseId,
        crisisCategory
      );

      console.log("[CrisisModeButton] Crisis Mode started:", {
        caseId,
        crisisCategory,
        incidentId,
        source,
      });

      if (onStart) {
        onStart(incidentId);
      }

      alert("Crisis Mode started for this case.");
    } catch (error) {
      console.error("[CrisisModeButton] Unexpected error:", error);
      alert("Unexpected error starting Crisis Mode.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      style={{
        padding: "0.5rem 1rem",
        borderRadius: "999px",
        border: "none",
        fontWeight: 600,
        cursor: isLoading ? "not-allowed" : "pointer",
        backgroundColor: "#b91c1c",
        opacity: isLoading ? 0.7 : 1,
        color: "#ffffff",
      }}
    >
      {isLoading ? "Starting Crisis Mode..." : "Enter Crisis Mode"}
    </button>
  );
};

export default CrisisModeButton;
