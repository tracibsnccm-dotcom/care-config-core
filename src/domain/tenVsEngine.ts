// src/domain/tenVsEngine.ts

import {
  CaseTimelineEvent,
  TenVsSnapshot,
  FourPsProfile,
} from "./caseTimeline";

/**
 * Zeroed-out 10-Vs snapshot for initialization.
 */
export const zeroTenVsSnapshot = (): TenVsSnapshot => ({
  v1PainSignal: 0,
  v2FunctionalLoss: 0,
  v3VitalityReserve: 0,
  v4VigilanceRisk: 0,
  v5VarianceFromBaseline: 0,
  v6VelocityOfChange: 0,
  v7VolumeOfUtilization: 0,
  v8ValueAlignment: 0,
  v9ValidationStrength: 0,
  v10ViabilityTrajectory: 0,
});

/**
 * Clamp a value into the 0–3 band.
 */
const clampBand = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 3) return 3;
  return value;
};

/**
 * Add a delta to a snapshot, then clamp.
 */
const addDelta = (
  snapshot: TenVsSnapshot,
  delta: Partial<TenVsSnapshot>
): TenVsSnapshot => {
  return {
    v1PainSignal: clampBand(
      snapshot.v1PainSignal + (delta.v1PainSignal ?? 0)
    ),
    v2FunctionalLoss: clampBand(
      snapshot.v2FunctionalLoss + (delta.v2FunctionalLoss ?? 0)
    ),
    v3VitalityReserve: clampBand(
      snapshot.v3VitalityReserve + (delta.v3VitalityReserve ?? 0)
    ),
    v4VigilanceRisk: clampBand(
      snapshot.v4VigilanceRisk + (delta.v4VigilanceRisk ?? 0)
    ),
    v5VarianceFromBaseline: clampBand(
      snapshot.v5VarianceFromBaseline +
        (delta.v5VarianceFromBaseline ?? 0)
    ),
    v6VelocityOfChange: clampBand(
      snapshot.v6VelocityOfChange + (delta.v6VelocityOfChange ?? 0)
    ),
    v7VolumeOfUtilization: clampBand(
      snapshot.v7VolumeOfUtilization +
        (delta.v7VolumeOfUtilization ?? 0)
    ),
    v8ValueAlignment: clampBand(
      snapshot.v8ValueAlignment + (delta.v8ValueAlignment ?? 0)
    ),
    v9ValidationStrength: clampBand(
      snapshot.v9ValidationStrength +
        (delta.v9ValidationStrength ?? 0)
    ),
    v10ViabilityTrajectory: clampBand(
      snapshot.v10ViabilityTrajectory +
        (delta.v10ViabilityTrajectory ?? 0)
    ),
  };
};

/**
 * Traci-optimized 4Ps → 10-Vs mapping.
 *
 * P1 – Physical      → pain, function, variance, vitality drain
 * P2 – Psychological → vigilance, velocity, vitality, value align, viability
 * P3 – Psychosocial  → vigilance, viability, value align, velocity, vitality
 * P4 – Professional  → viability, function, value align, validation, utilization
 *
 * Safety overlay (abuse / suicide) strongly boosts vigilance & velocity and
 * depresses viability.
 */
const mapFourPsToDelta = (
  profile?: FourPsProfile,
  abuseRisk?: boolean,
  suicideRisk?: boolean
): Partial<TenVsSnapshot> | null => {
  const has4Ps =
    profile?.p1Physical ||
    profile?.p2Psychological ||
    profile?.p3Psychosocial ||
    profile?.p4Professional;

  const hasSafety = abuseRisk || suicideRisk;

  if (!has4Ps && !hasSafety) return null;

  const delta: Partial<TenVsSnapshot> = {};
  const bump = <K extends keyof TenVsSnapshot>(key: K, amount: number) => {
    delta[key] = (delta[key] ?? 0) + amount;
  };

  // P1 – Physical (pain + function + variance + vitality)
  if (profile?.p1Physical) {
    bump("v1PainSignal", 2);
    bump("v2FunctionalLoss", 1.5);
    bump("v3VitalityReserve", -1);
    bump("v5VarianceFromBaseline", 1);
    bump("v4VigilanceRisk", 0.5);
  }

  // P2 – Psychological (emotional / mental)
  if (profile?.p2Psychological) {
    bump("v4VigilanceRisk", 2);
    bump("v6VelocityOfChange", 1);
    bump("v3VitalityReserve", -1);
    bump("v8ValueAlignment", -0.5);
    bump("v10ViabilityTrajectory", -0.5);
  }

  // P3 – Psychosocial (SDOH-heavy + safety window)
  if (profile?.p3Psychosocial) {
    bump("v4VigilanceRisk", 2);
    bump("v10ViabilityTrajectory", -2);
    bump("v8ValueAlignment", -1.5);
    bump("v6VelocityOfChange", 1);
    bump("v3VitalityReserve", -0.5);
  }

  // P4 – Professional (work / economic / legal role)
  if (profile?.p4Professional) {
    bump("v10ViabilityTrajectory", -1.5);
    bump("v2FunctionalLoss", 1);
    bump("v8ValueAlignment", -1);
    bump("v9ValidationStrength", 1);
    bump("v7VolumeOfUtilization", 0.5);
  }

  // Safety overlay: abuse / suicidality
  if (hasSafety) {
    bump("v4VigilanceRisk", 2);
    bump("v6VelocityOfChange", 1);
    bump("v10ViabilityTrajectory", -1);
  }

  return delta;
};

/**
 * Light-weight mock-first heuristic to apply when there is no explicit
 * tenVsSnapshot / tenVsDelta / fourPs mapping on the event.
 */
const applyHeuristicDelta = (
  snapshot: TenVsSnapshot,
  event: CaseTimelineEvent
): TenVsSnapshot => {
  let s = { ...snapshot };

  switch (event.category) {
    case "CLINICAL":
      s.v1PainSignal += 1;
      s.v2FunctionalLoss += 1;
      s.v3VitalityReserve -= 0.5;
      s.v5VarianceFromBaseline += 0.5;
      break;
    case "LEGAL":
      s.v8ValueAlignment += 0.5;
      s.v9ValidationStrength += 0.5;
      s.v10ViabilityTrajectory += 0.5;
      break;
    case "SYSTEM":
      s.v7VolumeOfUtilization += 1;
      s.v9ValidationStrength += 0.25;
      break;
    case "COMMUNICATION":
      s.v3VitalityReserve += 0.25; // engagement
      s.v8ValueAlignment += 0.25;
      break;
    case "WORKLOAD":
      s.v7VolumeOfUtilization += 0.5;
      break;
    case "OTHER":
    default:
      break;
  }

  // Provider-specific heuristic: their documentation & visits
  // increase utilization (V7) and validation (V9).
  if (event.actorRole === "PROVIDER") {
    s.v7VolumeOfUtilization += 0.5;
    s.v9ValidationStrength += 1;
  }

  if (event.isCritical) {
    s.v4VigilanceRisk += 2;
    s.v6VelocityOfChange += 1;
  }

  if (event.tags?.some((t) => t.toLowerCase().includes("sdoh"))) {
    s.v4VigilanceRisk += 1;
    s.v10ViabilityTrajectory -= 0.5;
  }

  // Clamp everything
  const clamped: TenVsSnapshot = {
    v1PainSignal: clampBand(s.v1PainSignal),
    v2FunctionalLoss: clampBand(s.v2FunctionalLoss),
    v3VitalityReserve: clampBand(s.v3VitalityReserve),
    v4VigilanceRisk: clampBand(s.v4VigilanceRisk),
    v5VarianceFromBaseline: clampBand(s.v5VarianceFromBaseline),
    v6VelocityOfChange: clampBand(s.v6VelocityOfChange),
    v7VolumeOfUtilization: clampBand(s.v7VolumeOfUtilization),
    v8ValueAlignment: clampBand(s.v8ValueAlignment),
    v9ValidationStrength: clampBand(s.v9ValidationStrength),
    v10ViabilityTrajectory: clampBand(s.v10ViabilityTrajectory),
  };

  return clamped;
};

/**
 * Given all timeline events for a case, derive the current 10-Vs snapshot.
 *
 * Rules:
 * - If an event has `tenVsSnapshot`, we treat it as a full refresh from that point.
 * - We then apply:
 *    • Traci 4Ps + safety mapping (if fourPsProfile / abuse / suicide present)
 *    • explicit tenVsDelta (if supplied)
 * - If none of the above exist, we fall back to a simple heuristic based on
 *   category / flags / tags.
 * - Events are processed in chronological order (oldest → newest).
 */
export const computeTenVsFromEvents = (
  events: CaseTimelineEvent[]
): TenVsSnapshot => {
  if (!events || events.length === 0) {
    return zeroTenVsSnapshot();
  }

  const ordered = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  let current = zeroTenVsSnapshot();

  for (const evt of ordered) {
    let next = current;

    // Explicit snapshot wins as a starting point at this time.
    if (evt.tenVsSnapshot) {
      next = {
        ...next,
        ...evt.tenVsSnapshot,
      };
    }

    // Traci 4Ps + safety mapping
    const deltaFrom4Ps = mapFourPsToDelta(
      evt.fourPsProfile,
      evt.abuseRisk,
      evt.suicideRisk
    );
    if (deltaFrom4Ps) {
      next = addDelta(next, deltaFrom4Ps);
    }

    // Explicit per-event delta (e.g., PT no-show, imaging, etc.)
    if (evt.tenVsDelta) {
      next = addDelta(next, evt.tenVsDelta);
    }

    // If nothing else specified, fall back to heuristic
    if (!evt.tenVsSnapshot && !deltaFrom4Ps && !evt.tenVsDelta) {
      next = applyHeuristicDelta(next, evt);
    }

    current = next;
  }

  return current;
};

/**
 * Helper: convert a band 0–3 into a label & quick "tone" bucket.
 */
export const describeBand = (
  value: number
): { label: string; tone: "stable" | "watch" | "concern" | "critical" } => {
  const v = clampBand(value);
  if (v === 0) return { label: "Stable", tone: "stable" };
  if (v === 1) return { label: "Mild", tone: "watch" };
  if (v === 2) return { label: "Moderate", tone: "concern" };
  return { label: "Severe", tone: "critical" };
};
