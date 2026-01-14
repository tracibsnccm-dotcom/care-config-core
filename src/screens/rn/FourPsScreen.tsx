// src/screens/rn/FourPsScreen.tsx
// FIXED VERSION - Loads client scores, RN can only DECREASE severity (not increase)

import React, { useEffect, useState } from "react";
import {
  FOUR_PS,
  SeverityScore,
  getSeverityLabel,
} from "../../constants/reconcileFramework";

// Supabase credentials for raw fetch
const SUPABASE_URL = 'https://zmjxyspizdqhrtdcgkwk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptanh5c3BpemRxaHJ0ZGNna3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjgxODMsImV4cCI6MjA3OTcwNDE4M30.i5rqJXZPSHYFeaA8E26Vh69UPzgCmhrU9zL2kdE8jrM';

async function supabaseFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.method === 'POST' ? 'return=representation' : 'return=minimal',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

interface DimensionState {
  id: string;
  clientScore: SeverityScore | null;  // What the client rated themselves
  rnScore: SeverityScore | null;       // What the RN assessed (can only be <= clientScore)
  note: string;
  clientCheckinDate?: string;
}

function computeOverallScore(dimensions: DimensionState[]): SeverityScore | null {
  const scores = dimensions
    .map((d) => d.rnScore ?? d.clientScore)
    .filter((s): s is SeverityScore => typeof s === "number");
  if (scores.length === 0) return null;
  // Maslow logic: overall follows the WORST (lowest) score
  return scores.reduce((min, s) => (s < min ? s : min), scores[0]);
}

const FourPsScreen: React.FC = () => {
  const [dimensions, setDimensions] = useState<DimensionState[]>(
    FOUR_PS.map((p) => ({
      id: p.id,
      clientScore: null,
      rnScore: null,
      note: "",
    }))
  );
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingAssessmentId, setExistingAssessmentId] = useState<string | null>(null);
  const [abuseRiskFlag, setAbuseRiskFlag] = useState(false);
  const [suicideRiskFlag, setSuicideRiskFlag] = useState(false);
  const [safetyNotes, setSafetyNotes] = useState("");
  const [clientCheckinId, setClientCheckinId] = useState<string | null>(null);
  const [isFollowUp, setIsFollowUp] = useState(false);

  const caseId = typeof window !== 'undefined' 
    ? window.localStorage.getItem("rcms_active_case_id") 
    : null;

  // Load client's check-in scores AND any existing RN assessment
  useEffect(() => {
    async function loadData() {
      if (!caseId) {
        setLoading(false);
        setStatus("No active case selected. Please select a case first.");
        return;
      }

      try {
        // First, load the CLIENT's most recent check-in (their self-assessment)
        const checkinResult = await supabaseFetch(
          `rc_client_checkins?case_id=eq.${caseId}&order=created_at.desc&limit=1`
        );

        let clientScores = {
          physical: null as SeverityScore | null,
          psychological: null as SeverityScore | null,
          psychosocial: null as SeverityScore | null,
          professional: null as SeverityScore | null,
        };
        let checkinDate: string | undefined;

        if (checkinResult && checkinResult.length > 0) {
          const checkin = checkinResult[0];
          setClientCheckinId(checkin.id);
          checkinDate = checkin.created_at;
          
          clientScores = {
            physical: checkin.fourp_physical,
            psychological: checkin.fourp_psychological,
            psychosocial: checkin.fourp_psychosocial,
            professional: checkin.fourp_professional,
          };
          
          console.log("FourPsScreen: Loaded client scores:", clientScores);
        } else {
          console.log("FourPsScreen: No client check-in found");
          setStatus("⚠️ No client self-assessment found. Client should complete their wellness check-in first.");
        }

        // Check if this is a follow-up (has previous RN assessment)
        const existingResult = await supabaseFetch(
          `rc_fourps_assessments?case_id=eq.${caseId}&order=created_at.desc&limit=1`
        );

        if (existingResult && existingResult.length > 0) {
          const existing = existingResult[0];
          setExistingAssessmentId(existing.id);
          setIsFollowUp(true);
          
          // Load existing RN assessment
          setDimensions([
            { 
              id: 'physical', 
              clientScore: clientScores.physical, 
              rnScore: existing.p1_physical, 
              note: existing.p1_notes || '',
              clientCheckinDate: checkinDate,
            },
            { 
              id: 'psychological', 
              clientScore: clientScores.psychological, 
              rnScore: existing.p2_psychological, 
              note: existing.p2_notes || '',
              clientCheckinDate: checkinDate,
            },
            { 
              id: 'psychosocial', 
              clientScore: clientScores.psychosocial, 
              rnScore: existing.p3_psychosocial, 
              note: existing.p3_notes || '',
              clientCheckinDate: checkinDate,
            },
            { 
              id: 'professional', 
              clientScore: clientScores.professional, 
              rnScore: existing.p4_professional, 
              note: existing.p4_notes || '',
              clientCheckinDate: checkinDate,
            },
          ]);
          
          setAbuseRiskFlag(existing.abuse_risk_flag || false);
          setSuicideRiskFlag(existing.suicide_risk_flag || false);
          setSafetyNotes(existing.safety_notes || '');
          
          setStatus("Loaded existing RN assessment. This is a follow-up assessment.");
        } else {
          // New assessment - start with client scores as baseline
          setDimensions([
            { 
              id: 'physical', 
              clientScore: clientScores.physical, 
              rnScore: clientScores.physical, // Default to client's score
              note: '',
              clientCheckinDate: checkinDate,
            },
            { 
              id: 'psychological', 
              clientScore: clientScores.psychological, 
              rnScore: clientScores.psychological,
              note: '',
              clientCheckinDate: checkinDate,
            },
            { 
              id: 'psychosocial', 
              clientScore: clientScores.psychosocial, 
              rnScore: clientScores.psychosocial,
              note: '',
              clientCheckinDate: checkinDate,
            },
            { 
              id: 'professional', 
              clientScore: clientScores.professional, 
              rnScore: clientScores.professional,
              note: '',
              clientCheckinDate: checkinDate,
            },
          ]);
          
          if (clientScores.physical !== null) {
            setStatus("Client scores loaded. Review and adjust if needed (you can only decrease scores, not increase).");
          }
        }
      } catch (error) {
        console.error("Failed to load 4Ps data:", error);
        setStatus("Error loading data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [caseId]);

  const overallScore = computeOverallScore(dimensions);
  const severityLabel = overallScore ? getSeverityLabel(overallScore) : null;

  // RN can only select scores EQUAL TO OR LOWER than client's score
  // Lower number = more severe = worse condition
  const getAvailableScores = (clientScore: SeverityScore | null): SeverityScore[] => {
    if (clientScore === null) {
      // If no client score, allow all scores
      return [1, 2, 3, 4, 5];
    }
    // RN can only go DOWN (more severe) or stay the same
    // e.g., if client scored 4, RN can select 1, 2, 3, or 4 (not 5)
    return [1, 2, 3, 4, 5].filter(s => s <= clientScore) as SeverityScore[];
  };

  const handleScoreChange = (id: string, value: string) => {
    const num = Number(value) as SeverityScore;
    const dim = dimensions.find(d => d.id === id);
    
    if (!dim) return;
    
    // Validate that RN is not increasing the score above client's score
    if (dim.clientScore !== null && num > dim.clientScore) {
      setStatus(`⚠️ Cannot increase score above client's self-assessment (${dim.clientScore}). You can only decrease severity.`);
      return;
    }

    setDimensions((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, rnScore: num } : d
      )
    );
    setStatus(null);
  };

  const handleNoteChange = (id: string, value: string) => {
    setDimensions((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, note: value } : d
      )
    );
    setStatus(null);
  };

  // Check if any adjusted scores are missing required notes
  const getMissingNotes = (): string[] => {
    const missing: string[] = [];
    dimensions.forEach(dim => {
      const scoreChanged = dim.rnScore !== null && dim.clientScore !== null && dim.rnScore !== dim.clientScore;
      if (scoreChanged && !dim.note.trim()) {
        const def = FOUR_PS.find(p => p.id === dim.id);
        missing.push(def?.label || dim.id);
      }
    });
    return missing;
  };

  const handleSave = async () => {
    if (!caseId) {
      setStatus("No active case selected. Please select a case first.");
      return;
    }

    const score = overallScore;
    if (!score) {
      setStatus("Please complete at least one P before saving.");
      return;
    }

    // Validate that all adjusted scores have notes
    const missingNotes = getMissingNotes();
    if (missingNotes.length > 0) {
      setStatus(`⚠️ Notes required for adjusted scores: ${missingNotes.join(", ")}. Please document why you changed the score from the client's assessment.`);
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const physical = dimensions.find(d => d.id === 'physical');
      const psychological = dimensions.find(d => d.id === 'psychological');
      const psychosocial = dimensions.find(d => d.id === 'psychosocial');
      const professional = dimensions.find(d => d.id === 'professional');

      const assessmentData = {
        case_id: caseId,
        assessment_type: existingAssessmentId ? 'reassessment' : 'initial',
        p1_physical: physical?.rnScore ?? physical?.clientScore ?? 3,
        p2_psychological: psychological?.rnScore ?? psychological?.clientScore ?? 3,
        p3_psychosocial: psychosocial?.rnScore ?? psychosocial?.clientScore ?? 3,
        p4_professional: professional?.rnScore ?? professional?.clientScore ?? 3,
        p1_notes: physical?.note || null,
        p2_notes: psychological?.note || null,
        p3_notes: psychosocial?.note || null,
        p4_notes: professional?.note || null,
        abuse_risk_flag: abuseRiskFlag,
        suicide_risk_flag: suicideRiskFlag,
        safety_notes: safetyNotes || null,
        client_checkin_id: clientCheckinId,
      };

      if (existingAssessmentId) {
        await supabaseFetch(`rc_fourps_assessments?id=eq.${existingAssessmentId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...assessmentData,
            updated_at: new Date().toISOString(),
          }),
        });
        setStatus("✓ 4Ps assessment updated.");
      } else {
        const result = await supabaseFetch('rc_fourps_assessments', {
          method: 'POST',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(assessmentData),
        });
        
        if (result && result.length > 0) {
          setExistingAssessmentId(result[0].id);
        }
        setStatus("✓ 4Ps assessment saved.");
      }
    } catch (error: any) {
      console.error("Failed to save 4Ps assessment:", error);
      setStatus(`Error saving: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        Loading 4Ps assessment...
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "0.75rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.2rem" }}>
          4Ps of Wellness – RN Assessment
          {isFollowUp && <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "#0ea5e9", marginLeft: "0.5rem" }}>(Follow-up)</span>}
        </h2>
        <p style={{ fontSize: "0.8rem", color: "#64748b", maxWidth: "46rem", marginBottom: "0.5rem" }}>
          Score each P on the 1–5 severity scale, where <strong>1 = Critical / Very Poor</strong> and{" "}
          <strong>5 = Stable / Strong / Good</strong>. The overall 4Ps score follows the{" "}
          <strong>worst (lowest) P score</strong>, consistent with Maslow logic.
        </p>
        {caseId && (
          <p style={{ fontSize: "0.75rem", color: "#0ea5e9", marginTop: "0.25rem" }}>
            Case ID: {caseId}
          </p>
        )}
      </div>

      {/* Scoring Rule Explanation Box */}
      <div style={{
        marginBottom: "1rem",
        padding: "0.75rem 1rem",
        borderRadius: "10px",
        border: "2px solid #f59e0b",
        background: "#fffbeb",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🔒</span>
          <div>
            <div style={{ fontWeight: 600, color: "#92400e", marginBottom: "0.25rem" }}>
              Scoring Rule: Client Score is the Ceiling
            </div>
            <p style={{ fontSize: "0.8rem", color: "#78350f", margin: 0 }}>
              The client's self-assessment sets the <strong>maximum score</strong> for each P. 
              As the RN, you may <strong>decrease</strong> the score if your clinical assessment 
              indicates the client's condition is more severe than they reported — but you 
              <strong> cannot increase</strong> the score above what the client rated themselves.
            </p>
            <div style={{ 
              marginTop: "0.5rem", 
              padding: "0.4rem 0.6rem", 
              background: "#fef3c7", 
              borderRadius: "6px",
              fontSize: "0.75rem",
              color: "#92400e"
            }}>
              <strong>Example:</strong> If client rates P1 Physical as 4, you can select 1, 2, 3, or 4 — but not 5.
              <br />
              <strong>Why?</strong> The client's lived experience is the baseline. Clinical judgment can identify 
              concerns the client may not recognize, but cannot override their perception of stability.
              <br />
              <strong style={{ color: "#dc2626" }}>📝 Required:</strong> If you adjust any score, you <strong>must</strong> document 
              your clinical reasoning in the notes field explaining why you disagree with the client's self-assessment.
            </div>
          </div>
        </div>
      </div>

      {/* Overall score badge */}
      <div
        style={{
          marginBottom: "1rem",
          padding: "0.6rem 0.8rem",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          background: "#f8fafc",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          fontSize: "0.8rem",
        }}
      >
        <div>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", marginBottom: "0.1rem" }}>
            Overall 4Ps Severity (RN Assessment)
          </div>
          <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f172a" }}>
            {overallScore ? (
              <>
                {severityLabel ? `${severityLabel} (${overallScore}/5)` : `Overall score: ${overallScore}/5`}
              </>
            ) : (
              "No scores yet"
            )}
          </div>
        </div>
        <div style={{ fontSize: "0.72rem", color: "#64748b", textAlign: "right" }}>
          The overall score follows the <strong>lowest (worst)</strong> P score.<br />
          A single critical domain destabilizes the whole picture.
        </div>
      </div>

      {/* 4Ps grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        {dimensions.map((dim) => {
          const def = FOUR_PS.find((p) => p.id === dim.id);
          const label = def ? def.label : dim.id;
          const description = def ? def.definition : "";
          const availableScores = getAvailableScores(dim.clientScore);
          const scoreChanged = dim.rnScore !== null && dim.clientScore !== null && dim.rnScore !== dim.clientScore;

          return (
            <div
              key={dim.id}
              style={{
                borderRadius: "10px",
                border: scoreChanged ? "2px solid #f59e0b" : "1px solid #e2e8f0",
                background: "#ffffff",
                padding: "0.75rem 0.9rem",
                fontSize: "0.8rem",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "0.15rem" }}>
                {label}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.5rem" }}>
                {description}
              </div>

              {/* Client's Score Display */}
              <div style={{
                padding: "0.5rem",
                borderRadius: "6px",
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                marginBottom: "0.5rem",
              }}>
                <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#0369a1", marginBottom: "0.2rem" }}>
                  Client's Self-Assessment
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, color: "#0c4a6e" }}>
                    {dim.clientScore !== null ? (
                      <>{dim.clientScore}/5 - {getSeverityLabel(dim.clientScore)}</>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>Not completed</span>
                    )}
                  </span>
                  {dim.clientCheckinDate && (
                    <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                      {formatDate(dim.clientCheckinDate)}
                    </span>
                  )}
                </div>
              </div>

              {/* RN's Score Selection */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}>
                <label style={{ fontSize: "0.75rem", color: "#0f172a", minWidth: "7rem" }}>
                  RN Assessment:
                </label>
                <select
                  value={dim.rnScore ?? ""}
                  onChange={(e) => handleScoreChange(dim.id, e.target.value)}
                  style={{
                    padding: "0.25rem 0.4rem",
                    borderRadius: "6px",
                    border: scoreChanged ? "2px solid #f59e0b" : "1px solid #cbd5e1",
                    fontSize: "0.78rem",
                    background: scoreChanged ? "#fffbeb" : "#ffffff",
                  }}
                >
                  <option value="">Select…</option>
                  {availableScores.map((s) => (
                    <option key={s} value={s}>
                      {s} - {getSeverityLabel(s)}
                    </option>
                  ))}
                </select>
                {scoreChanged && (
                  <span style={{ fontSize: "0.7rem", color: "#92400e", fontWeight: 600 }}>
                    ⚠️ Adjusted
                  </span>
                )}
              </div>

              {/* Explanation if RN cannot increase */}
              {dim.clientScore !== null && (
                <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "0.4rem" }}>
                  You can select scores 1-{dim.clientScore} (equal to or more severe than client's assessment)
                </div>
              )}

              {/* RN Notes */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#0f172a", marginBottom: "0.2rem" }}>
                  RN Clinical Notes {scoreChanged && <span style={{ color: "#dc2626" }}>* (Required - explain adjustment)</span>}
                </label>
                <textarea
                  value={dim.note}
                  onChange={(e) => handleNoteChange(dim.id, e.target.value)}
                  rows={3}
                  placeholder={scoreChanged 
                    ? "Document why you adjusted the score from the client's self-assessment..."
                    : "Document your clinical observations and agreement/rationale..."}
                  style={{
                    width: "100%",
                    borderRadius: "6px",
                    border: scoreChanged && !dim.note ? "2px solid #dc2626" : "1px solid #cbd5e1",
                    padding: "0.35rem 0.4rem",
                    fontSize: "0.78rem",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Flags Section */}
      <div
        style={{
          marginBottom: "1rem",
          padding: "0.75rem",
          borderRadius: "10px",
          border: "1px solid #fecaca",
          background: "#fef2f2",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "0.5rem", color: "#991b1b" }}>
          ⚠️ Safety Flags
        </div>
        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.5rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
            <input
              type="checkbox"
              checked={abuseRiskFlag}
              onChange={(e) => setAbuseRiskFlag(e.target.checked)}
            />
            Abuse Risk Identified
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
            <input
              type="checkbox"
              checked={suicideRiskFlag}
              onChange={(e) => setSuicideRiskFlag(e.target.checked)}
            />
            Suicide/Self-Harm Risk Identified
          </label>
        </div>
        {(abuseRiskFlag || suicideRiskFlag) && (
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.2rem" }}>
              Safety Notes (required if flags checked)
            </label>
            <textarea
              value={safetyNotes}
              onChange={(e) => setSafetyNotes(e.target.value)}
              rows={2}
              placeholder="Document safety concerns and interventions..."
              style={{
                width: "100%",
                borderRadius: "6px",
                border: "1px solid #fca5a5",
                padding: "0.35rem 0.4rem",
                fontSize: "0.78rem",
                resize: "vertical",
              }}
            />
          </div>
        )}
      </div>

      {/* Save Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "0.45rem 1rem",
            borderRadius: "999px",
            border: "none",
            background: saving ? "#94a3b8" : "#0f2a6a",
            color: "#ffffff",
            fontSize: "0.8rem",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : existingAssessmentId ? "Update 4Ps Assessment" : "Save 4Ps Assessment"}
        </button>
        {status && (
          <div
            style={{
              fontSize: "0.76rem",
              color: status.startsWith("✓") ? "#16a34a" : status.startsWith("Error") ? "#dc2626" : "#b45309",
              textAlign: "right",
              maxWidth: "60%",
            }}
          >
            {status}
          </div>
        )}
      </div>

      <div style={{ marginTop: "1rem", fontSize: "0.7rem", color: "#94a3b8", textAlign: "right" }}>
        💾 Data saves to Supabase (rc_fourps_assessments table)
        {existingAssessmentId && ` • Assessment ID: ${existingAssessmentId.slice(0, 8)}...`}
      </div>
    </div>
  );
};

export default FourPsScreen;
