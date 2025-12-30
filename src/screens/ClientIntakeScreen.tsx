// src/screens/ClientIntakeScreen.tsx
import React, { useMemo, useState } from "react";
import ClientEndScreen from "./ClientEndScreen";

type DemoStep =
  | "Injury Snapshot"
  | "Care Disruptions"
  | "Client Voice"
  | "Preview"
  | "Complete";

const STEPS: DemoStep[] = [
  "Injury Snapshot",
  "Care Disruptions",
  "Client Voice",
  "Preview",
  "Complete",
];

type IncomeRange =
  | ""
  | "Prefer not to say"
  | "Under $25,000"
  | "$25,000–$49,999"
  | "$50,000–$74,999"
  | "$75,000–$99,999"
  | "$100,000–$149,999"
  | "$150,000+";

type InjuryType =
  | ""
  | "Back/Neck Injury"
  | "Shoulder Injury"
  | "Knee/Leg Injury"
  | "Head Injury / Concussion"
  | "Fracture"
  | "Soft Tissue Injury"
  | "Other";

type ChronicCondition =
  | ""
  | "None"
  | "Diabetes"
  | "Hypertension"
  | "Asthma/COPD"
  | "Heart Disease"
  | "Depression/Anxiety"
  | "Chronic Pain"
  | "Other";

type FormState = {
  // Basic identifiers
  firstName: string;
  lastName: string;

  // Injury + conditions
  injuryType: InjuryType;
  injuryOther: string;
  chronicCondition: ChronicCondition;
  chronicOther: string;

  // Snapshot / basic care needs
  painNow: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  missedWork: "Yes" | "No" | "";
  primaryConcern: string;

  // Care disruptions (SDOH-like signals)
  transportationIssue: "Yes" | "No" | "";
  housingConcern: "Yes" | "No" | "";
  foodConcern: "Yes" | "No" | "";
  childcareIssue: "Yes" | "No" | "";
  incomeRange: IncomeRange;

  // Client Voice
  clientVoiceWhatHappened: string;
  clientVoiceHardestPart: string;
  clientVoiceNeedMost: string;

  // Demo acknowledgements
  demoAcknowledged: boolean;
};

const DEFAULT_FORM: FormState = {
  firstName: "",
  lastName: "",
  injuryType: "",
  injuryOther: "",
  chronicCondition: "",
  chronicOther: "",
  painNow: 6,
  missedWork: "",
  primaryConcern: "",
  transportationIssue: "",
  housingConcern: "",
  foodConcern: "",
  childcareIssue: "",
  incomeRange: "",
  clientVoiceWhatHappened: "",
  clientVoiceHardestPart: "",
  clientVoiceNeedMost: "",
  demoAcknowledged: false,
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "1rem",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.78rem",
  fontWeight: 600,
  marginBottom: "0.25rem",
};

const helpStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "#64748b",
  marginBottom: "0.6rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "0.6rem",
  fontSize: "0.85rem",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  background: "#ffffff",
};

const pillBtn = (active: boolean): React.CSSProperties => ({
  padding: "0.35rem 0.75rem",
  borderRadius: "999px",
  border: active ? "1px solid #0f2a6a" : "1px solid #cbd5e1",
  background: active ? "#0f2a6a" : "#ffffff",
  color: active ? "#ffffff" : "#0f172a",
  fontSize: "0.78rem",
  cursor: "pointer",
});

const smallBtn: React.CSSProperties = {
  padding: "0.35rem 0.9rem",
  borderRadius: "999px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  fontSize: "0.78rem",
  cursor: "pointer",
};

function stepLabel(step: DemoStep) {
  if (step === "Client Voice") return "Client Voice (Demo)";
  return step;
}

export default function ClientIntakeScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const step = STEPS[stepIndex];
  const isPreview = step === "Preview";
  const isComplete = step === "Complete";

  const canProceed = useMemo(() => {
    if (step === "Client Voice") {
      const a = (form.clientVoiceWhatHappened ?? "").trim();
      const b = (form.clientVoiceHardestPart ?? "").trim();
      const c = (form.clientVoiceNeedMost ?? "").trim();
      return a.length > 0 || b.length > 0 || c.length > 0;
    }
    if (step === "Preview") return form.demoAcknowledged;
    return true;
  }, [form, step]);

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setStepIndex((s) => s + 1);
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((s) => s - 1);
  };

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= STEPS.length) return;
    setStepIndex(idx);
  };

  const update = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  if (isComplete) {
    return (
      <div style={{ padding: "1.5rem", maxWidth: 980, margin: "0 auto" }}>
        <ClientEndScreen />
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: 980, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "0.9rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.2rem" }}>
          Client Intake Demo
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.35 }}>
          This is a shortened demonstration intake. Some items are intentionally excluded to protect
          proprietary workflows and the Clinical Care Planning Logic used in the live environment.
        </p>
        <div style={{ marginTop: "0.45rem", fontSize: "0.78rem", color: "#64748b" }}>
          <strong>Live environment:</strong> Clients should plan <strong>60–90 minutes</strong> to complete a full intake.
        </div>
      </div>

      {/* Progress / Steps */}
      <div
        style={{
          ...cardStyle,
          padding: "0.75rem",
          marginBottom: "0.9rem",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {STEPS.slice(0, 4).map((s, idx) => {
            const active = idx === stepIndex;
            const done = idx < stepIndex;
            return (
              <button
                key={s}
                type="button"
                onClick={() => goTo(idx)}
                style={{
                  ...pillBtn(active),
                  opacity: active ? 1 : done ? 0.95 : 0.65,
                }}
                aria-current={active ? "step" : undefined}
              >
                {stepLabel(s)}
              </button>
            );
          })}
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>→</span>
          <button
            type="button"
            onClick={() => goTo(3)}
            style={{ ...pillBtn(isPreview), opacity: isPreview ? 1 : 0.65 }}
            disabled={stepIndex < 2}
            title={stepIndex < 2 ? "Complete the demo steps first" : "Preview"}
          >
            Preview
          </button>
          <button
            type="button"
            style={{ ...pillBtn(false), opacity: 0.6, cursor: "not-allowed" }}
            disabled
            title="Complete becomes available after preview"
          >
            Complete
          </button>
        </div>
      </div>

      {/* Main step content */}
      <div style={cardStyle}>
        {step === "Injury Snapshot" && (
          <div style={{ display: "grid", gap: "0.85rem" }}>
            <div>
              <div style={labelStyle}>Client name</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                <input
                  style={inputStyle}
                  value={form.firstName}
                  onChange={(e) => update({ firstName: e.target.value })}
                  placeholder="First name"
                />
                <input
                  style={inputStyle}
                  value={form.lastName}
                  onChange={(e) => update({ lastName: e.target.value })}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <div style={labelStyle}>Most common injury type</div>
              <div style={helpStyle}>
                Choose the closest match. (In live use, this maps into structured RN review and care planning.)
              </div>
              <select
                style={selectStyle}
                value={form.injuryType}
                onChange={(e) => update({ injuryType: e.target.value as InjuryType })}
              >
                <option value="">Select…</option>
                <option value="Back/Neck Injury">Back/Neck Injury</option>
                <option value="Shoulder Injury">Shoulder Injury</option>
                <option value="Knee/Leg Injury">Knee/Leg Injury</option>
                <option value="Head Injury / Concussion">Head Injury / Concussion</option>
                <option value="Fracture">Fracture</option>
                <option value="Soft Tissue Injury">Soft Tissue Injury</option>
                <option value="Other">Other</option>
              </select>
              {form.injuryType === "Other" && (
                <input
                  style={{ ...inputStyle, marginTop: "0.5rem" }}
                  value={form.injuryOther}
                  onChange={(e) => update({ injuryOther: e.target.value })}
                  placeholder="Briefly describe injury type"
                />
              )}
            </div>

            <div>
              <div style={labelStyle}>Common chronic conditions (optional)</div>
              <div style={helpStyle}>
                This helps identify care needs and barriers; it does not replace provider diagnosis.
              </div>
              <select
                style={selectStyle}
                value={form.chronicCondition}
                onChange={(e) => update({ chronicCondition: e.target.value as ChronicCondition })}
              >
                <option value="">Select…</option>
                <option value="None">None</option>
                <option value="Diabetes">Diabetes</option>
                <option value="Hypertension">Hypertension</option>
                <option value="Asthma/COPD">Asthma/COPD</option>
                <option value="Heart Disease">Heart Disease</option>
                <option value="Depression/Anxiety">Depression/Anxiety</option>
                <option value="Chronic Pain">Chronic Pain</option>
                <option value="Other">Other</option>
              </select>
              {form.chronicCondition === "Other" && (
                <input
                  style={{ ...inputStyle, marginTop: "0.5rem" }}
                  value={form.chronicOther}
                  onChange={(e) => update({ chronicOther: e.target.value })}
                  placeholder="Briefly list condition"
                />
              )}
            </div>

            <div>
              <div style={labelStyle}>Current pain level (0–10)</div>
              <div style={helpStyle}>This helps tailor education and self-management supports.</div>
              <input
                type="range"
                min={0}
                max={10}
                value={form.painNow}
                onChange={(e) => update({ painNow: Number(e.target.value) as any })}
                style={{ width: "100%" }}
              />
              <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                Pain now: <strong>{form.painNow}/10</strong>
              </div>
            </div>

            <div>
              <div style={labelStyle}>Have you missed work due to this injury?</div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {(["Yes", "No"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    style={pillBtn(form.missedWork === v)}
                    onClick={() => update({ missedWork: v })}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Main concern (short)</div>
              <input
                style={inputStyle}
                value={form.primaryConcern}
                onChange={(e) => update({ primaryConcern: e.target.value })}
                placeholder="Example: pain control, sleep, mobility, return to work…"
              />
            </div>
          </div>
        )}

        {step === "Care Disruptions" && (
          <div style={{ display: "grid", gap: "0.85rem" }}>
            <div style={{ marginBottom: "0.15rem" }}>
              <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                Social Drivers of Health (SDOH) — External Disruptions of Care
              </div>
              <div style={helpStyle}>
                Why it matters: documenting SDOH defends the integrity of the client by distinguishing real
                external disruptions from perceived “noncompliance,” strengthening credibility and the medical record.
              </div>
            </div>

            <div>
              <div style={labelStyle}>Transportation disruption since injury/accident?</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["Yes", "No"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    style={pillBtn(form.transportationIssue === v)}
                    onClick={() => update({ transportationIssue: v })}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Food insecurity concerns?</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["Yes", "No"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    style={pillBtn(form.foodConcern === v)}
                    onClick={() => update({ foodConcern: v })}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Housing instability concerns?</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["Yes", "No"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    style={pillBtn(form.housingConcern === v)}
                    onClick={() => update({ housingConcern: v })}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Childcare disruption due to injury?</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["Yes", "No"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    style={pillBtn(form.childcareIssue === v)}
                    onClick={() => update({ childcareIssue: v })}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={labelStyle}>Annual household income range (optional)</div>
              <div style={helpStyle}>
                You may choose “Prefer not to say.” If provided, it is used to support community referrals when needed.
              </div>
              <select
                style={selectStyle}
                value={form.incomeRange}
                onChange={(e) => update({ incomeRange: e.target.value as IncomeRange })}
              >
                <option value="">Select…</option>
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Under $25,000">Under $25,000</option>
                <option value="$25,000–$49,999">$25,000–$49,999</option>
                <option value="$50,000–$74,999">$50,000–$74,999</option>
                <option value="$75,000–$99,999">$75,000–$99,999</option>
                <option value="$100,000–$149,999">$100,000–$149,999</option>
                <option value="$150,000+">$150,000+</option>
              </select>
            </div>
          </div>
        )}

        {step === "Client Voice" && (
          <div style={{ display: "grid", gap: "0.9rem" }}>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                Client Voice (Demo)
              </div>
              <div style={helpStyle}>
                This section captures the client’s lived experience in their own words. In the live system, this
                is reviewed by an RN Care Manager as part of the complete intake.
              </div>
            </div>

            <div>
              <div style={labelStyle}>What happened (brief)</div>
              <textarea
                value={form.clientVoiceWhatHappened}
                onChange={(e) => update({ clientVoiceWhatHappened: e.target.value })}
                rows={4}
                style={inputStyle}
                placeholder="Example: Rear-ended at a stop light. Immediate neck and back pain..."
              />
            </div>

            <div>
              <div style={labelStyle}>What’s hardest right now</div>
              <textarea
                value={form.clientVoiceHardestPart}
                onChange={(e) => update({ clientVoiceHardestPart: e.target.value })}
                rows={4}
                style={inputStyle}
                placeholder="Example: Sleep is broken; standing/sitting hurts; missed work..."
              />
            </div>

            <div>
              <div style={labelStyle}>What you need most</div>
              <textarea
                value={form.clientVoiceNeedMost}
                onChange={(e) => update({ clientVoiceNeedMost: e.target.value })}
                rows={3}
                style={inputStyle}
                placeholder="Example: Guidance, appointments scheduled, pain plan, transportation help..."
              />
            </div>

            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
              Next becomes available once you enter at least one Client Voice response.
            </div>
          </div>
        )}

        {step === "Preview" && (
          <div style={{ display: "grid", gap: "0.85rem" }}>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                Preview (Attorney Demo)
              </div>
              <div style={helpStyle}>
                This preview is for demonstration. In the live environment, additional clinical and authorization
                workflows are required before any information is reviewed or shared.
              </div>
            </div>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "0.85rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Snapshot Summary
              </div>
              <div style={{ fontSize: "0.85rem", color: "#0f172a", lineHeight: 1.4 }}>
                <div>
                  <strong>Client:</strong> {form.firstName || "—"} {form.lastName || ""}
                </div>
                <div>
                  <strong>Injury type:</strong> {form.injuryType || "—"}
                  {form.injuryType === "Other" && form.injuryOther ? ` (${form.injuryOther})` : ""}
                </div>
                <div>
                  <strong>Chronic condition:</strong> {form.chronicCondition || "—"}
                  {form.chronicCondition === "Other" && form.chronicOther ? ` (${form.chronicOther})` : ""}
                </div>
                <div>
                  <strong>Pain now:</strong> {form.painNow}/10
                </div>
                <div>
                  <strong>Missed work:</strong> {form.missedWork || "—"}
                </div>
                <div>
                  <strong>Main concern:</strong> {form.primaryConcern || "—"}
                </div>
              </div>
            </div>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "0.85rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                SDOH — External Disruptions of Care
              </div>
              <div style={{ fontSize: "0.85rem", color: "#0f172a", lineHeight: 1.4 }}>
                <div>
                  Transportation: <strong>{form.transportationIssue || "—"}</strong>
                </div>
                <div>
                  Food: <strong>{form.foodConcern || "—"}</strong>
                </div>
                <div>
                  Housing: <strong>{form.housingConcern || "—"}</strong>
                </div>
                <div>
                  Childcare: <strong>{form.childcareIssue || "—"}</strong>
                </div>
                <div>
                  Income range: <strong>{form.incomeRange || "—"}</strong>
                </div>
              </div>
            </div>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "0.85rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Client Voice
              </div>
              <div style={{ fontSize: "0.85rem", color: "#0f172a", lineHeight: 1.4 }}>
                <div style={{ marginBottom: "0.35rem" }}>
                  <strong>What happened:</strong>{" "}
                  <span style={{ whiteSpace: "pre-wrap" }}>
                    {form.clientVoiceWhatHappened || "—"}
                  </span>
                </div>
                <div style={{ marginBottom: "0.35rem" }}>
                  <strong>Hardest part:</strong>{" "}
                  <span style={{ whiteSpace: "pre-wrap" }}>
                    {form.clientVoiceHardestPart || "—"}
                  </span>
                </div>
                <div>
                  <strong>Need most:</strong>{" "}
                  <span style={{ whiteSpace: "pre-wrap" }}>
                    {form.clientVoiceNeedMost || "—"}
                  </span>
                </div>
              </div>
            </div>

            <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.8rem" }}>
              <input
                type="checkbox"
                checked={form.demoAcknowledged}
                onChange={(e) => update({ demoAcknowledged: e.target.checked })}
              />
              I understand this is a demo preview and does not include full live intake/authorization workflows.
            </label>

            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
              “Complete Demo” unlocks after acknowledgement.
            </div>
          </div>
        )}
      </div>

      {/* Footer Nav */}
      <div
        style={{
          marginTop: "0.9rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="button" onClick={goBack} style={smallBtn} disabled={stepIndex === 0}>
            Back
          </button>

          <button
            type="button"
            onClick={() => setStepIndex(0)}
            style={smallBtn}
            title="Restart demo intake"
          >
            Restart
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isPreview) setStepIndex(STEPS.length - 1);
            else goNext();
          }}
          disabled={!canProceed}
          style={{
            padding: "0.5rem 1.1rem",
            borderRadius: "999px",
            border: "1px solid #0f2a6a",
            background: !canProceed ? "#e2e8f0" : "#0f2a6a",
            color: !canProceed ? "#64748b" : "#ffffff",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: !canProceed ? "not-allowed" : "pointer",
          }}
        >
          {isPreview ? "Complete Demo" : "Next"}
        </button>
      </div>
    </div>
  );
}
