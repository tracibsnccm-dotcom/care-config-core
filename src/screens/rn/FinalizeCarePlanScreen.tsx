// src/screens/rn/FinalizeCarePlanScreen.tsx
// Step 6 of RN Care Plan Workflow - Final attestation with skipped sections acknowledgment

import React, { useEffect, useState } from "react";
import { createAutoNote, generateCarePlanCompletionNote } from "@/lib/autoNotes";

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

interface CompletionStatus {
  fourps: { completed: boolean; score?: number; assessedAt?: string };
  sdoh: { completed: boolean; score?: number; assessedAt?: string };
  overlays: { completed: boolean; count?: number };
  guidelines: { completed: boolean; count?: number; hasDeviations?: boolean };
  tenvs: {
    v1: boolean; v2: boolean; v3: boolean; v4: boolean; v5: boolean;
    v6: boolean; v7: boolean; v8: boolean; v9: boolean; v10: boolean;
  };
}

interface CaseSummary {
  caseNumber?: string;
  clientName?: string;
  dateOfInjury?: string;
}

const ATTESTATION_TEXT = `I attest that I have completed all pertinent portions of this care plan and this finalized version represents what is most appropriate at this time as a treatment path.`;

const SECTION_NAMES: Record<string, string> = {
  fourps: "4Ps Assessment",
  sdoh: "SDOH Assessment",
  overlays: "Condition Overlays",
  guidelines: "Guidelines Reference",
  v1: "V1: Voice/View",
  v2: "V2: Viability",
  v3: "V3: Vision",
  v4: "V4: Veracity",
  v5: "V5: Versatility",
  v6: "V6: Vitality",
  v7: "V7: Vigilance",
  v8: "V8: Verification",
  v9: "V9: Value",
  v10: "V10: Validation",
};

const FinalizeCarePlanScreen: React.FC = () => {
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>({
    fourps: { completed: false },
    sdoh: { completed: false },
    overlays: { completed: false },
    guidelines: { completed: false },
    tenvs: {
      v1: false, v2: false, v3: false, v4: false, v5: false,
      v6: false, v7: false, v8: false, v9: false, v10: false,
    },
  });
  const [caseSummary, setCaseSummary] = useState<CaseSummary>({});
  const [skippedSections, setSkippedSections] = useState<string[]>([]);
  const [acknowledgedSkipped, setAcknowledgedSkipped] = useState(false);
  const [attestationChecked, setAttestationChecked] = useState(false);
  const [attesterName, setAttesterName] = useState("");
  const [attesterCredentials, setAttesterCredentials] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [carePlanId, setCarePlanId] = useState<string | null>(null);
  const [alreadyFinalized, setAlreadyFinalized] = useState(false);

  const caseId = typeof window !== 'undefined' ? window.localStorage.getItem("rcms_active_case_id") : null;

  // Load completion status
  useEffect(() => {
    async function loadData() {
      if (!caseId) {
        setLoading(false);
        setStatus("No active case selected. Please select a case first.");
        return;
      }

      try {
        // Get case info
        const caseResult = await supabaseFetch(`rc_cases?id=eq.${caseId}&select=case_number,client_id,date_of_injury`);
        if (caseResult && caseResult.length > 0) {
          const caseData = caseResult[0];
          let clientName = "Unknown Client";
          
          if (caseData.client_id) {
            const clientResult = await supabaseFetch(`rc_clients?id=eq.${caseData.client_id}&select=first_name,last_name`);
            if (clientResult && clientResult.length > 0) {
              clientName = `${clientResult[0].first_name || ''} ${clientResult[0].last_name || ''}`.trim();
            }
          }
          
          setCaseSummary({
            caseNumber: caseData.case_number,
            clientName,
            dateOfInjury: caseData.date_of_injury,
          });
        }

        // Get care plan
        const planResult = await supabaseFetch(`rc_care_plans?case_id=eq.${caseId}&order=created_at.desc&limit=1`);
        if (planResult && planResult.length > 0) {
          setCarePlanId(planResult[0].id);
          
          if (planResult[0].status === 'submitted' || planResult[0].status === 'approved') {
            setAlreadyFinalized(true);
          }

          // Check 4Ps completion
          const fourpsResult = await supabaseFetch(`rc_fourps_assessments?case_id=eq.${caseId}&order=created_at.desc&limit=1`);
          const fourpsCompleted = fourpsResult && fourpsResult.length > 0;
          
          // Check SDOH completion
          const sdohResult = await supabaseFetch(`rc_sdoh_assessments?case_id=eq.${caseId}&order=created_at.desc&limit=1`);
          const sdohCompleted = sdohResult && sdohResult.length > 0;
          
          // Check overlays
          const overlaysResult = await supabaseFetch(`rc_overlay_selections?care_plan_id=eq.${planResult[0].id}`);
          const overlaysCompleted = overlaysResult && overlaysResult.length > 0;
          
          // Check guidelines
          const guidelinesResult = await supabaseFetch(`rc_guideline_references?care_plan_id=eq.${planResult[0].id}`);
          const guidelinesCompleted = guidelinesResult && guidelinesResult.length > 0;
          const hasDeviations = guidelinesResult?.some((g: any) => g.deviates_from_guideline) || false;
          
          // Check 10Vs completion
          const tenvResult = await supabaseFetch(`rc_care_plan_vs?care_plan_id=eq.${planResult[0].id}`);
          const completedVs = new Set(tenvResult?.map((v: any) => v.v_key) || []);

          setCompletionStatus({
            fourps: {
              completed: fourpsCompleted,
              score: fourpsResult?.[0] ? Math.min(
                fourpsResult[0].p1_physical,
                fourpsResult[0].p2_psychological,
                fourpsResult[0].p3_psychosocial,
                fourpsResult[0].p4_professional
              ) : undefined,
              assessedAt: fourpsResult?.[0]?.assessed_at,
            },
            sdoh: {
              completed: sdohCompleted,
              score: sdohResult?.[0]?.overall_score,
              assessedAt: sdohResult?.[0]?.assessed_at,
            },
            overlays: {
              completed: overlaysCompleted,
              count: overlaysResult?.length || 0,
            },
            guidelines: {
              completed: guidelinesCompleted,
              count: guidelinesResult?.length || 0,
              hasDeviations,
            },
            tenvs: {
              v1: completedVs.has('voice_view'),
              v2: completedVs.has('viability'),
              v3: completedVs.has('vision'),
              v4: completedVs.has('veracity'),
              v5: completedVs.has('versatility'),
              v6: completedVs.has('vitality'),
              v7: completedVs.has('vigilance'),
              v8: completedVs.has('verification'),
              v9: completedVs.has('value'),
              v10: completedVs.has('validation'),
            },
          });

          // Calculate skipped sections
          const skipped: string[] = [];
          if (!fourpsCompleted) skipped.push('fourps');
          if (!sdohCompleted) skipped.push('sdoh');
          if (!overlaysCompleted) skipped.push('overlays');
          if (!guidelinesCompleted) skipped.push('guidelines');
          
          // Check mandatory Vs (V1, V2, V3, V8, V9, V10)
          if (!completedVs.has('voice_view')) skipped.push('v1');
          if (!completedVs.has('viability')) skipped.push('v2');
          if (!completedVs.has('vision')) skipped.push('v3');
          if (!completedVs.has('verification')) skipped.push('v8');
          if (!completedVs.has('value')) skipped.push('v9');
          if (!completedVs.has('validation')) skipped.push('v10');
          
          // Check triggered Vs (V4, V5, V6, V7) - these are optional based on triggers
          // For now we'll note them but not require them
          
          setSkippedSections(skipped);
        }
      } catch (error) {
        console.error("Failed to load completion status:", error);
        setStatus("Error loading data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [caseId]);

  const canSubmit = (): boolean => {
    if (!attestationChecked) return false;
    if (!attesterName.trim()) return false;
    if (!attesterCredentials.trim()) return false;
    if (skippedSections.length > 0 && !acknowledgedSkipped) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !carePlanId) return;

    setSubmitting(true);
    setStatus(null);

    try {
      // Create attestation record
      await supabaseFetch('rc_care_plan_attestations', {
        method: 'POST',
        body: JSON.stringify({
          care_plan_id: carePlanId,
          attestation_text: ATTESTATION_TEXT,
          skipped_sections: skippedSections,
          skipped_sections_acknowledged: skippedSections.length > 0 ? acknowledgedSkipped : true,
          fourps_completed: completionStatus.fourps.completed,
          sdoh_completed: completionStatus.sdoh.completed,
          overlays_reviewed: completionStatus.overlays.completed,
          guidelines_reviewed: completionStatus.guidelines.completed,
          tenvs_completed: Object.values(completionStatus.tenvs).some(v => v),
          v1_completed: completionStatus.tenvs.v1,
          v2_completed: completionStatus.tenvs.v2,
          v3_completed: completionStatus.tenvs.v3,
          v4_completed: completionStatus.tenvs.v4,
          v5_completed: completionStatus.tenvs.v5,
          v6_completed: completionStatus.tenvs.v6,
          v7_completed: completionStatus.tenvs.v7,
          v8_completed: completionStatus.tenvs.v8,
          v9_completed: completionStatus.tenvs.v9,
          v10_completed: completionStatus.tenvs.v10,
          attested_at: new Date().toISOString(),
          attester_name: attesterName,
          attester_credentials: attesterCredentials,
        }),
      });

      // Get case and care plan info for auto-note
      const caseInfoResult = await supabaseFetch(`rc_cases?id=eq.${caseId}&select=id,client_id`);
      const caseInfo = caseInfoResult && caseInfoResult.length > 0 ? caseInfoResult[0] : null;
      const clientId = caseInfo?.client_id || null;

      // Check if this is initial or updated care plan
      // Count existing submitted plans BEFORE update to determine type
      const existingPlansResult = await supabaseFetch(`rc_care_plans?case_id=eq.${caseId}&status=eq.submitted&order=created_at.asc`);
      const existingSubmittedPlans = existingPlansResult || [];
      const isInitial = existingSubmittedPlans.length === 0;

      // Check for existing auto-note for THIS specific care plan (idempotency - use care_plan_id reference if available)
      // Use note content to match care plan ID as fallback
      const existingNotesResult = await supabaseFetch(
        `rc_case_notes?case_id=eq.${caseId}&note_type=eq.care_plan_${isInitial ? 'initial' : 'updated'}_completed&order=created_at.desc&limit=5`
      );
      // Check if any existing note references this care plan ID
      const noteTypePrefix = isInitial ? 'care_plan_initial_completed' : 'care_plan_updated_completed';
      const existingNotes = existingNotesResult || [];
      const hasExistingNote = existingNotes.some((note: any) => 
        note.note_type === noteTypePrefix && 
        note.content && 
        note.content.includes(carePlanId.slice(0, 8))
      );

      // Update care plan status to submitted
      const updateResult = await supabaseFetch(`rc_care_plans?id=eq.${carePlanId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });

      // Get updated care plan to check for PDF URL
      const updatedPlanResult = await supabaseFetch(`rc_care_plans?id=eq.${carePlanId}&select=pdf_url`);
      const updatedPlan = updatedPlanResult && updatedPlanResult.length > 0 ? updatedPlanResult[0] : null;
      const pdfUrl = updatedPlan?.pdf_url || null;

      // Create auto-note for care plan completion (if not already exists - idempotency)
      if (!hasExistingNote && caseId) {
        try {
          const noteContent = generateCarePlanCompletionNote(isInitial, pdfUrl, carePlanId);
          await createAutoNote({
            caseId: caseId,
            noteType: isInitial ? 'care_plan_initial_completed' : 'care_plan_updated_completed',
            title: isInitial ? 'Initial care plan completed — document attached.' : 'Updated care plan completed — document attached.',
            content: noteContent,
            triggerEvent: isInitial ? 'care_plan_initial_completed' : 'care_plan_updated_completed',
            visibleToRN: true,
            visibleToAttorney: true,
            documentUrl: pdfUrl,
            clientId: clientId,
          });
        } catch (noteError) {
          // Log error but don't block submission
          console.error('Failed to create care plan completion auto-note:', noteError);
        }
      }

      setAlreadyFinalized(true);
      setStatus("✓ Care plan finalized and submitted successfully!");
    } catch (error: any) {
      console.error("Failed to submit care plan:", error);
      setStatus(`Error submitting: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading care plan status...</div>;
  }

  if (alreadyFinalized) {
    return (
      <div style={{ padding: "1rem" }}>
        <div style={{
          padding: "2rem", textAlign: "center", borderRadius: "12px",
          background: "#dcfce7", border: "2px solid #86efac"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 600, color: "#166534", marginBottom: "0.5rem" }}>
            Care Plan Already Finalized
          </h2>
          <p style={{ color: "#15803d" }}>
            This care plan has been submitted and is awaiting review.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#166534", marginTop: "1rem" }}>
            Case: {caseSummary.caseNumber} • Client: {caseSummary.clientName}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.2rem" }}>
          Finalize Care Plan
        </h2>
        <p style={{ fontSize: "0.8rem", color: "#64748b", maxWidth: "50rem" }}>
          Review your care plan completion status and provide attestation before submitting.
        </p>
      </div>

      {/* Case Summary */}
      <div style={{
        marginBottom: "1rem", padding: "0.75rem", borderRadius: "10px",
        border: "1px solid #e2e8f0", background: "#f8fafc"
      }}>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#64748b" }}>Case Number</div>
            <div style={{ fontWeight: 600 }}>{caseSummary.caseNumber || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#64748b" }}>Client</div>
            <div style={{ fontWeight: 600 }}>{caseSummary.clientName || 'Unknown'}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#64748b" }}>Date of Injury</div>
            <div style={{ fontWeight: 600 }}>{caseSummary.dateOfInjury ? new Date(caseSummary.dateOfInjury).toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Completion Status */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Completion Status
        </h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
          {/* 4Ps */}
          <div style={{
            padding: "0.75rem", borderRadius: "8px",
            border: completionStatus.fourps.completed ? "1px solid #86efac" : "1px solid #fecaca",
            background: completionStatus.fourps.completed ? "#f0fdf4" : "#fef2f2"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>4Ps Assessment</span>
              <span style={{ fontSize: "1.2rem" }}>{completionStatus.fourps.completed ? "✅" : "❌"}</span>
            </div>
            {completionStatus.fourps.completed && (
              <div style={{ fontSize: "0.75rem", color: "#166534", marginTop: "0.25rem" }}>
                Score: {completionStatus.fourps.score}/5 • {formatDate(completionStatus.fourps.assessedAt)}
              </div>
            )}
          </div>

          {/* SDOH */}
          <div style={{
            padding: "0.75rem", borderRadius: "8px",
            border: completionStatus.sdoh.completed ? "1px solid #86efac" : "1px solid #fecaca",
            background: completionStatus.sdoh.completed ? "#f0fdf4" : "#fef2f2"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>SDOH Assessment</span>
              <span style={{ fontSize: "1.2rem" }}>{completionStatus.sdoh.completed ? "✅" : "❌"}</span>
            </div>
            {completionStatus.sdoh.completed && (
              <div style={{ fontSize: "0.75rem", color: "#166534", marginTop: "0.25rem" }}>
                Score: {completionStatus.sdoh.score}/5 • {formatDate(completionStatus.sdoh.assessedAt)}
              </div>
            )}
          </div>

          {/* Overlays */}
          <div style={{
            padding: "0.75rem", borderRadius: "8px",
            border: completionStatus.overlays.completed ? "1px solid #86efac" : "1px solid #fcd34d",
            background: completionStatus.overlays.completed ? "#f0fdf4" : "#fffbeb"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Condition Overlays</span>
              <span style={{ fontSize: "1.2rem" }}>{completionStatus.overlays.completed ? "✅" : "⚠️"}</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: completionStatus.overlays.completed ? "#166534" : "#92400e", marginTop: "0.25rem" }}>
              {completionStatus.overlays.count || 0} overlay(s) selected
            </div>
          </div>

          {/* Guidelines */}
          <div style={{
            padding: "0.75rem", borderRadius: "8px",
            border: completionStatus.guidelines.completed ? "1px solid #86efac" : "1px solid #fcd34d",
            background: completionStatus.guidelines.completed ? "#f0fdf4" : "#fffbeb"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Guidelines Reference</span>
              <span style={{ fontSize: "1.2rem" }}>{completionStatus.guidelines.completed ? "✅" : "⚠️"}</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: completionStatus.guidelines.completed ? "#166534" : "#92400e", marginTop: "0.25rem" }}>
              {completionStatus.guidelines.count || 0} reference(s)
              {completionStatus.guidelines.hasDeviations && " • ⚠️ Has deviations"}
            </div>
          </div>
        </div>

        {/* 10Vs Status */}
        <div style={{ marginTop: "1rem" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>10-Vs Completion</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {[
              { key: 'v1', label: 'V1', mandatory: true },
              { key: 'v2', label: 'V2', mandatory: true },
              { key: 'v3', label: 'V3', mandatory: true },
              { key: 'v4', label: 'V4', mandatory: false },
              { key: 'v5', label: 'V5', mandatory: false },
              { key: 'v6', label: 'V6', mandatory: false },
              { key: 'v7', label: 'V7', mandatory: false },
              { key: 'v8', label: 'V8', mandatory: true },
              { key: 'v9', label: 'V9', mandatory: true },
              { key: 'v10', label: 'V10', mandatory: true },
            ].map(({ key, label, mandatory }) => {
              const completed = completionStatus.tenvs[key as keyof typeof completionStatus.tenvs];
              return (
                <div
                  key={key}
                  style={{
                    padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem",
                    border: completed ? "1px solid #86efac" : mandatory ? "1px solid #fecaca" : "1px solid #e2e8f0",
                    background: completed ? "#dcfce7" : mandatory ? "#fef2f2" : "#f8fafc",
                    color: completed ? "#166534" : mandatory ? "#dc2626" : "#64748b"
                  }}
                >
                  {completed ? "✓" : mandatory ? "✗" : "○"} {label}
                  {mandatory && <span style={{ fontSize: "0.65rem" }}> *</span>}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.3rem" }}>
            * = Mandatory sections
          </div>
        </div>
      </div>

      {/* Skipped Sections Warning */}
      {skippedSections.length > 0 && (
        <div style={{
          marginBottom: "1.5rem", padding: "1rem", borderRadius: "10px",
          border: "2px solid #f59e0b", background: "#fffbeb"
        }}>
          <div style={{ fontWeight: 600, color: "#92400e", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
            ⚠️ The following sections were not completed:
          </div>
          <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem", color: "#92400e" }}>
            {skippedSections.map(section => (
              <li key={section} style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                {SECTION_NAMES[section] || section}
              </li>
            ))}
          </ul>
          
          <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#fef3c7", borderRadius: "6px" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={acknowledgedSkipped}
                onChange={(e) => setAcknowledgedSkipped(e.target.checked)}
                style={{ marginTop: "0.2rem" }}
              />
              <span style={{ fontSize: "0.85rem", color: "#92400e" }}>
                <strong>I acknowledge</strong> that the above sections were skipped and confirm this care plan 
                represents what is most appropriate at this time despite these sections not being completed.
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Attestation */}
      <div style={{
        marginBottom: "1.5rem", padding: "1rem", borderRadius: "10px",
        border: "2px solid #0ea5e9", background: "#f0f9ff"
      }}>
        <div style={{ fontWeight: 600, color: "#0369a1", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
          📋 Attestation
        </div>
        
        <div style={{
          padding: "0.75rem", background: "#ffffff", borderRadius: "6px",
          border: "1px solid #bae6fd", marginBottom: "1rem"
        }}>
          <p style={{ fontSize: "0.85rem", color: "#0c4a6e", fontStyle: "italic", margin: 0 }}>
            "{ATTESTATION_TEXT}"
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.2rem" }}>
              Your Name *
            </label>
            <input
              type="text"
              value={attesterName}
              onChange={(e) => setAttesterName(e.target.value)}
              placeholder="Enter your full name"
              style={{
                width: "100%", padding: "0.4rem", borderRadius: "6px",
                border: "1px solid #cbd5e1", fontSize: "0.85rem"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.2rem" }}>
              Credentials *
            </label>
            <input
              type="text"
              value={attesterCredentials}
              onChange={(e) => setAttesterCredentials(e.target.value)}
              placeholder="e.g., RN, BSN, CCM"
              style={{
                width: "100%", padding: "0.4rem", borderRadius: "6px",
                border: "1px solid #cbd5e1", fontSize: "0.85rem"
              }}
            />
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={attestationChecked}
            onChange={(e) => setAttestationChecked(e.target.checked)}
            style={{ marginTop: "0.2rem" }}
          />
          <span style={{ fontSize: "0.85rem", color: "#0369a1" }}>
            <strong>I agree</strong> to the attestation statement above and confirm that this care plan 
            is complete and ready for submission.
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit() || submitting}
          style={{
            padding: "0.6rem 1.5rem", borderRadius: "999px", border: "none",
            background: canSubmit() && !submitting ? "#16a34a" : "#94a3b8",
            color: "#ffffff", fontSize: "0.9rem", fontWeight: 600,
            cursor: canSubmit() && !submitting ? "pointer" : "not-allowed"
          }}
        >
          {submitting ? "Submitting..." : "✓ Finalize & Submit Care Plan"}
        </button>
        {status && (
          <div style={{
            fontSize: "0.8rem",
            color: status.startsWith("✓") ? "#16a34a" : "#dc2626"
          }}>
            {status}
          </div>
        )}
      </div>

      {!canSubmit() && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#dc2626" }}>
          {!attestationChecked && "• Please agree to the attestation statement"}
          {!attesterName.trim() && " • Please enter your name"}
          {!attesterCredentials.trim() && " • Please enter your credentials"}
          {skippedSections.length > 0 && !acknowledgedSkipped && " • Please acknowledge skipped sections"}
        </div>
      )}

      <div style={{ marginTop: "1.5rem", fontSize: "0.7rem", color: "#94a3b8", textAlign: "right" }}>
        💾 Data saves to Supabase (rc_care_plan_attestations table)
        {carePlanId && ` • Care Plan ID: ${carePlanId.slice(0, 8)}...`}
      </div>
    </div>
  );
};

export default FinalizeCarePlanScreen;
