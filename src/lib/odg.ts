// src/lib/odg.ts
// Lightweight, curated ODG/MCG-style reference with adjustment logic.
// You can extend this table or swap these functions for a licensed source later.

import { AppState } from "./models";

export type RecoveryWindow = {
  source: "CURATED_ODG" | "MCG" | "INTERNAL_RULE";
  conditionKey: string;          // e.g., "MVA_WHIPLASH"
  description: string;           // human-readable injury description
  baselineDays: { min: number; max: number }; // expected range absent modifiers
  modifiers: Array<{
    name: string;
    effectDays: number;          // positive adds time; negative reduces
    rationale: string;
  }>;
  totalDays: { min: number; max: number };    // baseline +/- net modifiers
  assumptions: string[];         // explicit assumptions
  notes?: string;
};

// ------- Curated “ODG-like” baselines -------
// Keys should align with your injury forms, labels, or ICD-10 groupings.
// Keep these conservative and well-reasoned; refine with your clinical governance.
const CURATED_ODG_BASELINES: Record<
  string,
  {
    match: (inj: any) => boolean;
    description: string;
    baselineDays: { min: number; max: number };
    assumptions?: string[];
  }
> = {
  MVA_WHIPLASH: {
    match: (inj) => {
      const label = (inj?.label || inj?.form || "").toLowerCase();
      const icd = ((inj?.icd10 || []) as string[]).join(" ").toLowerCase();
      return (
        label.includes("whiplash") ||
        icd.includes("s13.4") || // Sprain of cervical spine
        (label.includes("mva") && label.includes("neck"))
      );
    },
    description: "Whiplash-associated disorders (cervical sprain/strain)",
    baselineDays: { min: 28, max: 84 }, // 4–12 weeks
    assumptions: [
      "No major neurological deficit",
      "Conservative care (NSAIDs, PT) timely initiated",
    ],
  },
  LUMBAR_STRAIN: {
    match: (inj) => {
      const label = (inj?.label || inj?.form || "").toLowerCase();
      const icd = ((inj?.icd10 || []) as string[]).join(" ").toLowerCase();
      return label.includes("lumbar strain") || icd.includes("s33.5");
    },
    description: "Lumbar spine strain/sprain",
    baselineDays: { min: 21, max: 56 }, // 3–8 weeks
    assumptions: ["No red-flag symptoms", "Activity modification + PT"],
  },
  CONCUSSION_MILD: {
    match: (inj) => {
      const label = (inj?.label || inj?.form || "").toLowerCase();
      const icd = ((inj?.icd10 || []) as string[]).join(" ").toLowerCase();
      return (
        label.includes("concussion") ||
        icd.includes("s06.0") // concussion family
      );
    },
    description: "Concussion / mTBI (uncomplicated)",
    baselineDays: { min: 14, max: 42 }, // 2–6 weeks
    assumptions: ["No prolonged LOC", "No focal deficits", "Graduated return"],
  },
  CRUSH_INJURY_UPPER_EXTREMITY: {
    match: (inj) => {
      const label = (inj?.label || inj?.form || "").toLowerCase();
      const icd = ((inj?.icd10 || []) as string[]).join(" ").toLowerCase();
      return label.includes("crush") || icd.includes("s67.") || icd.includes("s47.");
    },
    description: "Crush injury (upper extremity)",
    baselineDays: { min: 56, max: 168 }, // 8–24 weeks (wide variance)
    assumptions: ["No compartment syndrome", "No vascular compromise"],
  },
};

function pickBaseline(injury: any) {
  for (const key of Object.keys(CURATED_ODG_BASELINES)) {
    const row = CURATED_ODG_BASELINES[key];
    if (row.match(injury)) {
      return { key, ...row };
    }
  }
  // Fallback: generic MSK soft-tissue window
  return {
    key: "GENERIC_MSK",
    description: "Musculoskeletal soft-tissue injury (unspecified)",
    baselineDays: { min: 21, max: 70 },
    assumptions: ["No neurological deficit", "Conservative care available"],
  };
}

// ------- Modifiers (risk/comorbidity/clinical) -------

type RiskContext = {
  // keep flexible; we derive from AppState safely
  riskFactors: string[]; // e.g., ["diabetes", "cardiovascular", "smoker"]
  hasSurgeryOccurred?: boolean;
  postOpTherapyWeeks?: number; // if surgery occurred, expected PT/OT duration
};

function deriveRiskContext(state: AppState): RiskContext {
  const rf: string[] = [];

  // Pull from known spots safely:
  // fourPs?.health?.chronicConditions: string[] | record
  const chronic =
    (state as any)?.client?.fourPs?.health?.chronicConditions ||
    (state as any)?.client?.chronicConditions ||
    [];

  const lower = Array.isArray(chronic)
    ? chronic.map((c) => String(c).toLowerCase())
    : Object.keys(chronic).filter((k) => chronic[k]);

  if (lower.some((c) => c.includes("diab"))) rf.push("diabetes");
  if (lower.some((c) => c.includes("htn") || c.includes("hypertens"))) rf.push("hypertension");
  if (lower.some((c) => c.includes("copd") || c.includes("asthma"))) rf.push("respiratory");
  if (lower.some((c) => c.includes("heart") || c.includes("cardio"))) rf.push("cardiovascular");
  if (lower.some((c) => c.includes("obes") || c.includes("bmi"))) rf.push("obesity");

  // medication adherence flags could be added in future
  // smoking status could be pulled from SDOH or intake
  const sdoh = (state as any)?.client?.sdoh || {};
  const socialText = JSON.stringify(sdoh).toLowerCase();
  if (socialText.includes("smok")) rf.push("smoker");
  if (socialText.includes("food") && socialText.includes("insecure")) rf.push("food_insecurity");

  // post-op detection (very simple; you can wire to your surgery records)
  const injuries = (state as any).injuries || [];
  const anySurgery = injuries.some((inj: any) => inj?.surgeryOccurred === true);
  const therapyWeeks = injuries.reduce((acc: number, inj: any) => {
    if (inj?.postOpTherapyWeeks && Number.isFinite(inj.postOpTherapyWeeks)) {
      return Math.max(acc, Number(inj.postOpTherapyWeeks));
    }
    return acc;
  }, 0);

  return {
    riskFactors: Array.from(new Set(rf)),
    hasSurgeryOccurred: anySurgery,
    postOpTherapyWeeks: therapyWeeks || undefined,
  };
}

function applyModifiers(
  baseline: { min: number; max: number },
  context: RiskContext
): { total: { min: number; max: number }; modifiers: RecoveryWindow["modifiers"] } {
  const mods: RecoveryWindow["modifiers"] = [];

  const addMod = (name: string, days: number, rationale: string) =>
    mods.push({ name, effectDays: days, rationale });

  // Examples — tune with your clinical governance:
  if (context.riskFactors.includes("diabetes")) {
    addMod("Diabetes", +7, "Glycemic control may slow tissue healing.");
  }
  if (context.riskFactors.includes("cardiovascular")) {
    addMod(
      "Cardiovascular disease",
      +7,
      "Reduced exercise tolerance and perfusion may lengthen recovery."
    );
  }
  if (context.riskFactors.includes("respiratory")) {
    addMod(
      "Chronic respiratory disease",
      +5,
      "Dyspnea limits therapy intensity; infection risk."
    );
  }
  if (context.riskFactors.includes("obesity")) {
    addMod("Obesity", +7, "Mechanical load and inflammation may delay recovery.");
  }
  if (context.riskFactors.includes("smoker")) {
    addMod("Active smoker", +7, "Nicotine impairs microvascular healing.");
  }
  if (context.riskFactors.includes("food_insecurity")) {
    addMod(
      "Food insecurity",
      +5,
      "Nutrition barriers can impair recovery and adherence."
    );
  }

  // Post-op: add explicit fixed window for PT/OT if surgery truly occurred.
  if (context.hasSurgeryOccurred) {
    const weeks = context.postOpTherapyWeeks ?? 6; // default 6 weeks if not specified
    addMod(
      "Post-operative therapy",
      weeks * 7,
      "Added duration based on actual PT/OT plan after surgery."
    );
  }

  // Compute totals
  const netDays = mods.reduce((sum, m) => sum + m.effectDays, 0);
  const total = {
    min: Math.max(0, baseline.min + netDays),
    max: Math.max(0, baseline.max + netDays),
  };

  return { total, modifiers: mods };
}

// ------- Public API -------

export function estimateRecoveryWindowForInjury(
  state: AppState,
  injury: any
): RecoveryWindow {
  const context = deriveRiskContext(state);
  const picked = pickBaseline(injury);
  const { total, modifiers } = applyModifiers(picked.baselineDays, context);

  return {
    source: "CURATED_ODG",
    conditionKey: picked.key,
    description: picked.description,
    baselineDays: picked.baselineDays,
    modifiers,
    totalDays: total,
    assumptions: picked.assumptions || [],
    notes:
      "This is a curated estimate. Actual recovery depends on clinical response. If surgery occurs later, system adds post-op therapy time only after the event (not pre-emptively).",
  };
}

export function estimateAllRecoveryWindows(state: AppState): RecoveryWindow[] {
  const injuries = (state as any).injuries || [];
  return injuries.map((inj: any) => estimateRecoveryWindowForInjury(state, inj));
}
