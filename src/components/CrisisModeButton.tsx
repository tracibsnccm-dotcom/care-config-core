// src/components/CrisisModeButton.tsx
// RN Crisis Mode starter — wired to Supabase REST URL,
// falls back to a dev-stub incident ID if anything fails.

import React, { useState } from "react";
import { CrisisCategory } from "../domain/crisisCategory";

type CrisisModeButtonProps = {
  caseId: string;
  crisisCategory?: CrisisCategory | null;
  onStart?: (incidentId: string) => void;
};

// Read Supabase env vars for Vite (defined in .env.local)
const SUPABASE_REST_URL =
  (import.meta as any).env.VITE_SUPABASE_REST_URL as string | undefined;
const SUPABASE_ANON_KEY =
  (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string | undefined;

type StartResultSource = "supabase" | "stub" | "fallback" | "error";

async function createCrisisIncidentInSupabase(
  caseId: string,
  crisisCategory?: CrisisCategory | null
): Promise<{ incidentId: string; source: StartResultSource }> {
  // If env vars aren’t present, just use a stub ID (dev safe)
  if (!SUPABASE_REST_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      "[CrisisModeButton] Supabase REST env not set. Using stub incident ID."
    );
    alert(
      "Supabase REST configuration is missing (VITE_SUPABASE_REST_URL or VITE_SUPABASE_ANON_KEY). Using local dev incident ID."
    );
    return {
      incidentId: `dev-stub-incident-${Date.now()}`,
      source: "stub",
    };
  }

  try {
    const res = await fetch(`${SUPABASE_REST_URL}/crisis_incidents`, {
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
      }),
    });

    if (!res.ok) {
      console.warn(
        "[CrisisModeButton] Supabase insert not OK.",
        res.status,
        res.statusText
      );
      alert(
        `Supabase insert failed (${res.status}). Using local dev incident ID instead.`
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
      "[CrisisModeButton] Supabase insert threw error. Using stub incident ID.",
      error
    );
    alert("Supabase error when creating crisis incident. Using local dev ID.");
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

      alert(
        source === "supabase"
          ? "Crisis Mode started and saved to Supabase."
          : "Crisis Mode started (using local dev incident ID)."
      );
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
