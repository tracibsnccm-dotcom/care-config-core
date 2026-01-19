// src/screens/rn/SDOHScreen.tsx
// FIXED VERSION - Loads client SDOH data, RN can only DECREASE severity (not increase)

import React, { useEffect, useState } from "react";
import {
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

type SdohDomainId = "economic" | "education" | "healthcare" | "neighborhood" | "social";

interface SdohQuestion {
  id: string;
  domainId: SdohDomainId;
  label: string;
  clientField?: string; // Maps to client intake field if applicable
}

interface DomainConfig {
  id: SdohDomainId;
  title: string;
  description: string;
  questions: SdohQuestion[];
}

const DOMAINS: DomainConfig[] = [
  {
    id: "economic",
    title: "Economic Stability",
    description: "Income, employment, and ability to afford basic needs that support treatment and recovery.",
    questions: [
      { id: "econ_basic_needs", domainId: "economic", label: "Are they able to afford basic needs such as food, utilities, and personal essentials?" },
      { id: "econ_delay_care", domainId: "economic", label: "Have financial concerns caused them to delay or skip medical care?" },
      { id: "econ_job_stability", domainId: "economic", label: "Is their employment stable enough to support ongoing treatment needs?" },
    ],
  },
  {
    id: "education",
    title: "Education Access & Quality",
    description: "Literacy, language, and ability to understand and act on health information.",
    questions: [
      { id: "edu_health_literacy", domainId: "education", label: "Do they feel confident understanding medical instructions and health information?" },
      { id: "edu_language_barrier", domainId: "education", label: "Are language or literacy barriers affecting their ability to follow care recommendations?" },
      { id: "edu_system_navigation", domainId: "education", label: "Does their level of education or training limit their ability to navigate medical or legal processes?" },
    ],
  },
  {
    id: "healthcare",
    title: "Health Care Access & Quality",
    description: "Access to providers, treatments, and medications in a way that supports the plan of care.",
    questions: [
      { id: "hc_access_providers", domainId: "healthcare", label: "Do they have reliable access to primary care and needed specialists?" },
      { id: "hc_treatment_barriers", domainId: "healthcare", label: "Have they been unable to obtain treatments, medications, or referrals due to insurance or cost?" },
      { id: "hc_transport_impact", domainId: "healthcare", label: "Do transportation issues cause missed or delayed appointments?", clientField: "transportation_issue" },
    ],
  },
  {
    id: "neighborhood",
    title: "Neighborhood & Built Environment",
    description: "Housing safety, environmental hazards, and neighborhood factors that help or hinder recovery.",
    questions: [
      { id: "nb_housing_safety", domainId: "neighborhood", label: "Is their housing safe, stable, and free of hazards (mold, pests, violence)?", clientField: "housing_concern" },
      { id: "nb_environment_impact", domainId: "neighborhood", label: "Do environmental factors (noise, pollution, unsafe area) limit sleep, mobility, or recovery?" },
      { id: "nb_transport_support", domainId: "neighborhood", label: "Is transportation in their area reliable enough to support treatment adherence?", clientField: "transportation_issue" },
    ],
  },
  {
    id: "social",
    title: "Social & Community Context",
    description: "Support, relationships, stressors, and discrimination that affect their ability to engage in care.",
    questions: [
      { id: "soc_support", domainId: "social", label: "Do they have reliable social support for daily needs and recovery?" },
      { id: "soc_conflict", domainId: "social", label: "Are there conflicts or stressors at home or work affecting their ability to engage in care?" },
      { id: "soc_discrimination", domainId: "social", label: "Have they experienced discrimination or bias that affects their care or well-being?" },
    ],
  },
];

interface QuestionState {
  id: string;
  domainId: SdohDomainId;
  clientScore: SeverityScore | null;  // What client reported (from intake)
  rnScore: SeverityScore | null;       // What RN assessed (can only be <= clientScore)
}

interface DomainNotes {
  economic: string;
  education: string;
  healthcare: string;
  neighborhood: string;
  social: string;
}

interface SdohFlags {
  housing_insecurity: boolean;
  food_insecurity: boolean;
  transportation_barrier: boolean;
  financial_hardship: boolean;
  social_isolation: boolean;
}

// Convert Yes/No from client intake to severity score
// "Yes" to a problem = score of 2 (concern identified)
// "No" to a problem = score of 4 (no concern)
function yesNoToScore(value: string | null | undefined): SeverityScore | null {
  if (!value) return null;
  if (value.toLowerCase() === 'yes') return 2; // Problem identified = more severe
  if (value.toLowerCase() === 'no') return 4;  // No problem = stable
  return null;
}

function computeDomainScore(questions: QuestionState[], domainId: SdohDomainId): SeverityScore | null {
  const domainQs = questions.filter((q) => q.domainId === domainId);
  const scores = domainQs
    .map((q) => q.rnScore ?? q.clientScore)
    .filter((s): s is SeverityScore => s !== null);
  if (scores.length === 0) return null;
  const sum = scores.reduce((acc, s) => acc + s, 0);
  return Math.round(sum / scores.length) as SeverityScore;
}

function computeOverallScore(questions: QuestionState[]): SeverityScore | null {
  const scores = questions
    .map((q) => q.rnScore ?? q.clientScore)
    .filter((s): s is SeverityScore => s !== null);
  if (scores.length === 0) return null;
  const sum = scores.reduce((acc, s) => acc + s, 0);
  return Math.round(sum / scores.length) as SeverityScore;
}

const SDOHScreen: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionState[]>(
    DOMAINS.flatMap((d) => d.questions.map((q) => ({ 
      id: q.id, 
      domainId: q.domainId, 
      clientScore: null,
      rnScore: null 
    })))
  );
  const [domainNotes, setDomainNotes] = useState<DomainNotes>({
    economic: "", education: "", healthcare: "", neighborhood: "", social: ""
  });
  const [narrative, setNarrative] = useState("");
  const [flags, setFlags] = useState<SdohFlags>({
    housing_insecurity: false,
    food_insecurity: false,
    transportation_barrier: false,
    financial_hardship: false,
    social_isolation: false,
  });
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingAssessmentId, setExistingAssessmentId] = useState<string | null>(null);
  const [clientIntakeDate, setClientIntakeDate] = useState<string | null>(null);
  const [isFollowUp, setIsFollowUp] = useState(false);

  const caseId = typeof window !== 'undefined' ? window.localStorage.getItem("rcms_active_case_id") : null;

  // Load client intake SDOH data and any existing RN assessment
  useEffect(() => {
    async function loadData() {
      if (!caseId) {
        setLoading(false);
        setStatus("No active case selected. Please select a case first.");
        return;
      }

      try {
        // Load client intake data (SDOH flags from their intake)
        const caseResult = await supabaseFetch(`rc_cases?id=eq.${caseId}&is_superseded=eq.false&select=client_id,created_at`);
        
        let clientSdohData: any = null;
        
        if (caseResult && caseResult.length > 0 && caseResult[0].client_id) {
          // Try to get client's intake responses
          const clientResult = await supabaseFetch(
            `rc_clients?id=eq.${caseResult[0].client_id}&select=*`
          );
          
          if (clientResult && clientResult.length > 0) {
            clientSdohData = clientResult[0];
            setClientIntakeDate(clientResult[0].created_at || caseResult[0].created_at);
          }
        }

        // Also check rc_client_checkins for any SDOH-related data
        const checkinResult = await supabaseFetch(
          `rc_client_checkins?case_id=eq.${caseId}&order=created_at.desc&limit=1`
        );
        
        if (checkinResult && checkinResult.length > 0) {
          // Merge checkin data with client data
          clientSdohData = { ...clientSdohData, ...checkinResult[0] };
          setClientIntakeDate(checkinResult[0].created_at);
        }

        // Map client intake responses to question scores
        const updatedQuestions = questions.map(q => {
          let clientScore: SeverityScore | null = null;
          
          // Map specific fields from client intake
          if (clientSdohData) {
            if (q.id === 'hc_transport_impact' || q.id === 'nb_transport_support') {
              clientScore = yesNoToScore(clientSdohData.transportation_issue || clientSdohData.transportationIssue);
            } else if (q.id === 'nb_housing_safety') {
              clientScore = yesNoToScore(clientSdohData.housing_concern || clientSdohData.housingConcern);
              // Invert: "Yes" to housing concern = problem = lower score
              if (clientSdohData.housing_concern === 'Yes' || clientSdohData.housingConcern === 'Yes') {
                clientScore = 2;
              } else if (clientSdohData.housing_concern === 'No' || clientSdohData.housingConcern === 'No') {
                clientScore = 4;
              }
            } else if (q.id === 'econ_basic_needs') {
              // Food concern maps to economic basic needs
              if (clientSdohData.food_concern === 'Yes' || clientSdohData.foodConcern === 'Yes') {
                clientScore = 2;
              } else if (clientSdohData.food_concern === 'No' || clientSdohData.foodConcern === 'No') {
                clientScore = 4;
              }
            }
          }
          
          return { ...q, clientScore, rnScore: clientScore };
        });

        // Set flags based on client intake
        if (clientSdohData) {
          setFlags({
            housing_insecurity: clientSdohData.housing_concern === 'Yes' || clientSdohData.housingConcern === 'Yes',
            food_insecurity: clientSdohData.food_concern === 'Yes' || clientSdohData.foodConcern === 'Yes',
            transportation_barrier: clientSdohData.transportation_issue === 'Yes' || clientSdohData.transportationIssue === 'Yes',
            financial_hardship: false,
            social_isolation: false,
          });
        }

        // Check for existing RN assessment
        const existingResult = await supabaseFetch(
          `rc_sdoh_assessments?case_id=eq.${caseId}&order=created_at.desc&limit=1`
        );

        if (existingResult && existingResult.length > 0) {
          const existing = existingResult[0];
          setExistingAssessmentId(existing.id);
          setIsFollowUp(true);
          
          // Load existing RN assessment scores
          // Map domain scores back to questions
          setDomainNotes({
            economic: existing.economic_notes || '',
            education: existing.education_notes || '',
            healthcare: existing.healthcare_notes || '',
            neighborhood: existing.neighborhood_notes || '',
            social: existing.community_notes || '',
          });
          
          setNarrative(existing.overall_notes || '');
          
          setFlags({
            housing_insecurity: existing.housing_insecurity_flag || false,
            food_insecurity: existing.food_insecurity_flag || false,
            transportation_barrier: existing.transportation_barrier_flag || false,
            financial_hardship: existing.financial_hardship_flag || false,
            social_isolation: existing.social_isolation_flag || false,
          });
          
          setStatus("Loaded existing RN assessment. This is a follow-up assessment.");
        } else {
          setQuestions(updatedQuestions);
          if (clientSdohData) {
            setStatus("Client intake data loaded. Review and assess each domain.");
          } else {
            setStatus("⚠️ No client intake data found. Client should complete intake first.");
          }
        }
      } catch (error) {
        console.error("Failed to load SDOH data:", error);
        setStatus("Error loading data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [caseId]);

  // RN can only select scores EQUAL TO OR LOWER than client's score
  const getAvailableScores = (clientScore: SeverityScore | null): SeverityScore[] => {
    if (clientScore === null) {
      return [1, 2, 3, 4, 5];
    }
    // RN can only go DOWN (more severe) or stay the same
    return [1, 2, 3, 4, 5].filter(s => s <= clientScore) as SeverityScore[];
  };

  const handleScoreChange = (qId: string, value: string) => {
    const num = Number(value) as SeverityScore;
    const question = questions.find(q => q.id === qId);
    
    if (!question) return;
    
    // Validate that RN is not increasing the score above client's score
    if (question.clientScore !== null && num > question.clientScore) {
      setStatus(`⚠️ Cannot increase score above client's self-assessment (${question.clientScore}). You can only identify additional concerns.`);
      return;
    }

    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, rnScore: num } : q)));
    setStatus(null);
  };

  // Check if any adjusted scores are missing required notes in their domain
  const getMissingNotes = (): string[] => {
    const missing: string[] = [];
    
    DOMAINS.forEach(domain => {
      const domainQuestions = questions.filter(q => q.domainId === domain.id);
      const hasAdjustedScore = domainQuestions.some(q => 
        q.rnScore !== null && q.clientScore !== null && q.rnScore !== q.clientScore
      );
      
      if (hasAdjustedScore && !domainNotes[domain.id].trim()) {
        missing.push(domain.title);
      }
    });
    
    return missing;
  };

  const handleSave = async () => {
    if (!caseId) {
      setStatus("No active case selected. Please select a case first.");
      return;
    }

    // Validate that all domains with adjusted scores have notes
    const missingNotes = getMissingNotes();
    if (missingNotes.length > 0) {
      setStatus(`⚠️ Notes required for adjusted domains: ${missingNotes.join(", ")}. Please document why you changed scores from the client's assessment.`);
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const economicScore = computeDomainScore(questions, 'economic');
      const educationScore = computeDomainScore(questions, 'education');
      const healthcareScore = computeDomainScore(questions, 'healthcare');
      const neighborhoodScore = computeDomainScore(questions, 'neighborhood');
      const socialScore = computeDomainScore(questions, 'social');
      const overallScore = computeOverallScore(questions);

      const assessmentData = {
        case_id: caseId,
        assessment_type: existingAssessmentId ? 'reassessment' : 'initial',
        
        economic_employment: economicScore,
        economic_income: economicScore,
        economic_expenses: economicScore,
        economic_notes: domainNotes.economic || null,
        
        neighborhood_housing: neighborhoodScore,
        neighborhood_transportation: neighborhoodScore,
        neighborhood_safety: neighborhoodScore,
        neighborhood_notes: domainNotes.neighborhood || null,
        
        education_literacy: educationScore,
        education_language: educationScore,
        education_notes: domainNotes.education || null,
        
        food_hunger: economicScore,
        food_access: economicScore,
        
        community_integration: socialScore,
        community_support: socialScore,
        community_stress: socialScore,
        community_notes: domainNotes.social || null,
        
        healthcare_coverage: healthcareScore,
        healthcare_access: healthcareScore,
        healthcare_quality: healthcareScore,
        healthcare_notes: domainNotes.healthcare || null,
        
        overall_score: overallScore,
        overall_notes: narrative || null,
        
        housing_insecurity_flag: flags.housing_insecurity,
        food_insecurity_flag: flags.food_insecurity,
        transportation_barrier_flag: flags.transportation_barrier,
        financial_hardship_flag: flags.financial_hardship,
        social_isolation_flag: flags.social_isolation,
      };

      if (existingAssessmentId) {
        await supabaseFetch(`rc_sdoh_assessments?id=eq.${existingAssessmentId}`, {
          method: 'PATCH',
          body: JSON.stringify({ ...assessmentData, updated_at: new Date().toISOString() }),
        });
        setStatus("✓ SDOH assessment updated.");
      } else {
        const result = await supabaseFetch('rc_sdoh_assessments', {
          method: 'POST',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(assessmentData),
        });
        if (result && result.length > 0) {
          setExistingAssessmentId(result[0].id);
        }
        setStatus("✓ SDOH assessment saved.");
      }
    } catch (error: any) {
      console.error("Failed to save SDOH assessment:", error);
      setStatus(`Error saving: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const overallScore = computeOverallScore(questions);
  
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading SDOH assessment...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "0.75rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.2rem" }}>
          SDOH – Social Determinants of Health
          {isFollowUp && <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "#0ea5e9", marginLeft: "0.5rem" }}>(Follow-up)</span>}
        </h2>
        <p style={{ fontSize: "0.8rem", color: "#64748b", maxWidth: "46rem" }}>
          Evaluate each SDOH domain using the 1–5 scale where <strong>1 = Severe barrier/crisis</strong> and{" "}
          <strong>5 = No significant barriers</strong>. These factors directly affect treatment adherence and recovery outcomes.
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
              Scoring Rule: Client's Perception is the Ceiling
            </div>
            <p style={{ fontSize: "0.8rem", color: "#78350f", margin: 0 }}>
              The client's self-reported SDOH concerns set the <strong>maximum score</strong> for each item. 
              As the RN, you may <strong>decrease</strong> the score if your assessment identifies additional 
              barriers or concerns the client didn't report — but you <strong>cannot increase</strong> the 
              score above what the client indicated.
            </p>
            <div style={{ 
              marginTop: "0.5rem", 
              padding: "0.4rem 0.6rem", 
              background: "#fef3c7", 
              borderRadius: "6px",
              fontSize: "0.75rem",
              color: "#92400e"
            }}>
              <strong>Example:</strong> If client reported "No" to housing concerns (score 4), you can select 1, 2, 3, or 4 — but not 5.
              <br />
              <strong>Why?</strong> The client's lived experience is the baseline. You may uncover additional barriers 
              they didn't recognize, but cannot override their perception of their own situation.
              <br />
              <strong style={{ color: "#dc2626" }}>📝 Required:</strong> If you adjust any score in a domain, you <strong>must</strong> document 
              your reasoning in that domain's notes field explaining why you identified additional concerns.
            </div>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div style={{
        marginBottom: "1rem", padding: "0.6rem 0.8rem", borderRadius: "10px",
        border: "1px solid #e2e8f0", background: "#f8fafc",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b" }}>
            Overall SDOH Score (RN Assessment)
          </div>
          <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
            {overallScore ? `${getSeverityLabel(overallScore)} (${overallScore}/5)` : "Score at least one question"}
          </div>
        </div>
        {clientIntakeDate && (
          <div style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "right" }}>
            Client intake: {formatDate(clientIntakeDate)}
          </div>
        )}
      </div>

      {/* SDOH Flags */}
      <div style={{
        marginBottom: "1rem", padding: "0.75rem", borderRadius: "10px",
        border: "1px solid #fecaca", background: "#fef2f2"
      }}>
        <div style={{ fontWeight: 600, marginBottom: "0.5rem", color: "#991b1b" }}>⚠️ SDOH Risk Flags</div>
        <p style={{ fontSize: "0.75rem", color: "#7f1d1d", marginBottom: "0.5rem" }}>
          Flags from client intake are pre-checked. You may add additional flags but cannot remove client-reported concerns.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          {[
            { key: 'housing_insecurity', label: 'Housing Insecurity' },
            { key: 'food_insecurity', label: 'Food Insecurity' },
            { key: 'transportation_barrier', label: 'Transportation Barrier' },
            { key: 'financial_hardship', label: 'Financial Hardship' },
            { key: 'social_isolation', label: 'Social Isolation' },
          ].map(({ key, label }) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
              <input
                type="checkbox"
                checked={flags[key as keyof SdohFlags]}
                onChange={(e) => setFlags(prev => ({ ...prev, [key]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Domain Cards */}
      {DOMAINS.map((domain) => {
        const domainQuestions = questions.filter(q => q.domainId === domain.id);
        const domainScore = computeDomainScore(questions, domain.id);
        const hasClientData = domainQuestions.some(q => q.clientScore !== null);
        
        return (
          <div key={domain.id} style={{
            marginBottom: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0",
            background: "#ffffff", padding: "0.75rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <div>
                <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {domain.title}
                  {hasClientData && (
                    <span style={{ 
                      fontSize: "0.65rem", 
                      padding: "0.1rem 0.4rem", 
                      borderRadius: "4px",
                      background: "#dbeafe", 
                      color: "#1e40af" 
                    }}>
                      Has client data
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{domain.description}</div>
              </div>
              {domainScore && (
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0f172a" }}>
                  {domainScore}/5
                </div>
              )}
            </div>

            {domainQuestions.map((qState) => {
              const qDef = domain.questions.find(q => q.id === qState.id);
              const availableScores = getAvailableScores(qState.clientScore);
              const scoreChanged = qState.rnScore !== null && qState.clientScore !== null && qState.rnScore !== qState.clientScore;
              
              return (
                <div key={qState.id} style={{
                  padding: "0.5rem",
                  borderTop: "1px solid #f1f5f9",
                  background: qState.clientScore !== null ? "#f0f9ff" : "transparent",
                }}>
                  <div style={{ fontSize: "0.78rem", marginBottom: "0.4rem" }}>
                    {qDef?.label}
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    {/* Client's Response */}
                    {qState.clientScore !== null && (
                      <div style={{ 
                        fontSize: "0.7rem", 
                        padding: "0.2rem 0.5rem", 
                        borderRadius: "4px",
                        background: "#dbeafe", 
                        color: "#1e40af" 
                      }}>
                        Client: {qState.clientScore}/5
                      </div>
                    )}
                    
                    {/* RN's Score Selection */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>RN:</span>
                      <select
                        value={qState.rnScore ?? ""}
                        onChange={(e) => handleScoreChange(qState.id, e.target.value)}
                        style={{
                          padding: "0.2rem 0.4rem", borderRadius: "6px",
                          border: scoreChanged ? "2px solid #f59e0b" : "1px solid #cbd5e1",
                          fontSize: "0.75rem", minWidth: "70px",
                          background: scoreChanged ? "#fffbeb" : "#ffffff",
                        }}
                      >
                        <option value="">Select…</option>
                        {availableScores.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    
                    {scoreChanged && (
                      <span style={{ fontSize: "0.7rem", color: "#92400e", fontWeight: 600 }}>
                        ⚠️ Adjusted from client
                      </span>
                    )}
                    
                    {qState.clientScore !== null && (
                      <span style={{ fontSize: "0.65rem", color: "#64748b" }}>
                        (Can select 1-{qState.clientScore})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: "0.5rem" }}>
              {(() => {
                const domainQuestions = questions.filter(q => q.domainId === domain.id);
                const hasAdjustedScore = domainQuestions.some(q => 
                  q.rnScore !== null && q.clientScore !== null && q.rnScore !== q.clientScore
                );
                const notesRequired = hasAdjustedScore && !domainNotes[domain.id].trim();
                
                return (
                  <>
                    <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.2rem" }}>
                      RN Notes for {domain.title}
                      {hasAdjustedScore && (
                        <span style={{ color: "#dc2626", fontWeight: 600 }}> * (Required - score adjusted)</span>
                      )}
                    </label>
                    <textarea
                      value={domainNotes[domain.id]}
                      onChange={(e) => setDomainNotes(prev => ({ ...prev, [domain.id]: e.target.value }))}
                      rows={2}
                      placeholder={hasAdjustedScore 
                        ? "REQUIRED: Document why you adjusted the score from the client's assessment..."
                        : "Document your clinical observations..."}
                      style={{
                        width: "100%", borderRadius: "6px", 
                        border: notesRequired ? "2px solid #dc2626" : "1px solid #cbd5e1",
                        padding: "0.35rem", fontSize: "0.78rem", resize: "vertical",
                        background: notesRequired ? "#fef2f2" : "#ffffff",
                      }}
                    />
                  </>
                );
              })()}
            </div>
          </div>
        );
      })}

      {/* Narrative */}
      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.3rem" }}>
          SDOH Summary Narrative (attorney-facing)
        </label>
        <textarea
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          rows={4}
          placeholder="Summarize how SDOH factors impact this client's recovery and treatment adherence..."
          style={{
            width: "100%", borderRadius: "6px", border: "1px solid #cbd5e1",
            padding: "0.4rem", fontSize: "0.78rem", resize: "vertical"
          }}
        />
      </div>

      {/* Save Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "0.45rem 1rem", borderRadius: "999px", border: "none",
            background: saving ? "#94a3b8" : "#0f2a6a", color: "#ffffff",
            fontSize: "0.8rem", cursor: saving ? "not-allowed" : "pointer"
          }}
        >
          {saving ? "Saving..." : existingAssessmentId ? "Update SDOH Assessment" : "Save SDOH Assessment"}
        </button>
        {status && (
          <div style={{
            fontSize: "0.76rem",
            color: status.startsWith("✓") ? "#16a34a" : status.startsWith("Error") ? "#dc2626" : "#b45309",
            maxWidth: "60%",
          }}>
            {status}
          </div>
        )}
      </div>

      <div style={{ marginTop: "1rem", fontSize: "0.7rem", color: "#94a3b8", textAlign: "right" }}>
        💾 Data saves to Supabase (rc_sdoh_assessments table)
        {existingAssessmentId && ` • Assessment ID: ${existingAssessmentId.slice(0, 8)}...`}
      </div>
    </div>
  );
};

export default SDOHScreen;
