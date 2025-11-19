// src/domain/tenVsEngine.ts

import { CaseTimelineEvent, TenVsSnapshot } from "./caseTimeline";

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
 * Given all timeline events for a case, derive the current 10-Vs snapshot.
 *
 * Rules (mock-first):
 * - If an event has `tenVsSnapshot`, we treat it as a full refresh from that point.
 * - If an event has `tenVsDelta`, we add it to the running snapshot.
 * - Events are processed in chronological order.
 */
export const computeTenVsFromEvents = (
  events: CaseTimelineEvent[]
): TenVsSnapshot => {
  if (!events || events.length === 0) {
    return zeroTenVsSnapshot();
  }

  // Sort oldest → newest
  const ordered = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  let current = zeroTenVsSnapshot();

  for (const evt of ordered) {
    if (evt.tenVsSnapshot) {
      current = {
        ...current,
        ...evt.tenVsSnapshot,
      };
    }

    if (evt.tenVsDelta) {
      current = {
        v1PainSignal: clampBand(
          current.v1PainSignal + (evt.tenVsDelta.v1PainSignal ?? 0)
        ),
        v2FunctionalLoss: clampBand(
          current.v2FunctionalLoss + (evt.tenVsDelta.v2FunctionalLoss ?? 0)
        ),
        v3VitalityReserve: clampBand(
          current.v3VitalityReserve + (evt.tenVsDelta.v3VitalityReserve ?? 0)
        ),
        v4VigilanceRisk: clampBand(
          current.v4VigilanceRisk + (evt.tenVsDelta.v4VigilanceRisk ?? 0)
        ),
        v5VarianceFromBaseline: clampBand(
          current.v5VarianceFromBaseline +
            (evt.tenVsDelta.v5VarianceFromBaseline ?? 0)
        ),
        v6VelocityOfChange: clampBand(
          current.v6VelocityOfChange + (evt.tenVsDelta.v6VelocityOfChange ?? 0)
        ),
        v7VolumeOfUtilization: clampBand(
          current.v7VolumeOfUtilization +
            (evt.tenVsDelta.v7VolumeOfUtilization ?? 0)
        ),
        v8ValueAlignment: clampBand(
          current.v8ValueAlignment + (evt.tenVsDelta.v8ValueAlignment ?? 0)
        ),
        v9ValidationStrength: clampBand(
          current.v9ValidationStrength +
            (evt.tenVsDelta.v9ValidationStrength ?? 0)
        ),
        v10ViabilityTrajectory: clampBand(
          current.v10ViabilityTrajectory +
            (evt.tenVsDelta.v10ViabilityTrajectory ?? 0)
        ),
      };
    }
  }

  return current;
};

/**
 * Helper: convert a band 0–3 into a label & quick color-ish bucket.
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
