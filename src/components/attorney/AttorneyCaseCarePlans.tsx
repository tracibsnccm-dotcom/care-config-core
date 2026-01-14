// src/components/attorney/AttorneyCaseCarePlans.tsx
// Component to display care plans list within attorney case view

import React, { useEffect, useState } from "react";
import CarePlanPDFExport from "@/components/CarePlanPDFExport";

const SUPABASE_URL = 'https://zmjxyspizdqhrtdcgkwk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptanh5c3BpemRxaHJ0ZGNna3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjgxODMsImV4cCI6MjA3OTcwNDE4M30.i5rqJXZPSHYFeaA8E26Vh69UPzgCmhrU9zL2kdE8jrM';

async function supabaseFetch(endpoint: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(await response.text());
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

interface CarePlanSummary {
  id: string;
  planNumber: number;
  carePlanType: string;
  status: string;
  createdAt: string;
  submittedAt: string | null;
  pdfUrl: string | null;
  fourPsAvg: number | null;
  sdohFlags: number;
  overlayCount: number;
}

interface AttorneyCaseCarePlansProps {
  caseId: string;
}

const CARE_PLAN_TYPE_LABELS: Record<string, string> = {
  initial: "Initial",
  routine_60_day: "60-Day Review",
  accelerated_30_day: "30-Day Accelerated",
  event_based: "Event-Based",
  attorney_request: "Attorney Request",
  discharge: "Discharge",
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: '#fef3c7', color: '#92400e', label: 'In Progress' },
  submitted: { bg: '#dcfce7', color: '#166534', label: 'Complete' },
  archived: { bg: '#f1f5f9', color: '#64748b', label: 'Archived' },
};

const AttorneyCaseCarePlans: React.FC<AttorneyCaseCarePlansProps> = ({ caseId }) => {
  const [carePlans, setCarePlans] = useState<CarePlanSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCarePlans() {
      try {
        // Get all care plans for this case (only submitted ones for attorney view)
        const plansResult = await supabaseFetch(
          `rc_care_plans?case_id=eq.${caseId}&status=eq.submitted&order=created_at.desc`
        );

        if (plansResult && plansResult.length > 0) {
          const plansWithDetails = await Promise.all(
            plansResult.map(async (plan: any) => {
              // Get 4Ps average
              let fourPsAvg = null;
              const fourPsResult = await supabaseFetch(
                `rc_fourps_assessments?care_plan_id=eq.${plan.id}&limit=1`
              );
              if (fourPsResult && fourPsResult.length > 0) {
                const fp = fourPsResult[0];
                fourPsAvg = (fp.p1_physical + fp.p2_psychological + fp.p3_psychosocial + fp.p4_professional) / 4;
              }

              // Get SDOH flags count
              let sdohFlags = 0;
              const sdohResult = await supabaseFetch(
                `rc_sdoh_assessments?care_plan_id=eq.${plan.id}&limit=1`
              );
              if (sdohResult && sdohResult.length > 0) {
                const s = sdohResult[0];
                sdohFlags = [
                  s.housing_insecurity,
                  s.food_insecurity,
                  s.transportation_barrier,
                  s.financial_hardship,
                  s.social_isolation,
                ].filter(Boolean).length;
              }

              // Get overlay count
              const overlaysResult = await supabaseFetch(
                `rc_overlay_selections?care_plan_id=eq.${plan.id}&select=id`
              );
              const overlayCount = overlaysResult ? overlaysResult.length : 0;

              return {
                id: plan.id,
                planNumber: plan.plan_number,
                carePlanType: plan.care_plan_type || 'initial',
                status: plan.status,
                createdAt: plan.created_at,
                submittedAt: plan.submitted_at,
                pdfUrl: plan.pdf_url,
                fourPsAvg: fourPsAvg ? Math.round(fourPsAvg * 10) / 10 : null,
                sdohFlags,
                overlayCount,
              };
            })
          );

          setCarePlans(plansWithDetails);
        }
      } catch (error) {
        console.error("Failed to load care plans:", error);
      } finally {
        setLoading(false);
      }
    }

    if (caseId) {
      loadCarePlans();
    }
  }, [caseId]);

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 4) return '#22c55e';
    if (score >= 3) return '#eab308';
    if (score >= 2) return '#f97316';
    return '#dc2626';
  };

  if (loading) {
    return (
      <div style={{ padding: '1rem', color: '#64748b', textAlign: 'center' }}>
        Loading care plans...
      </div>
    );
  }

  if (carePlans.length === 0) {
    return (
      <div style={{
        background: '#f8fafc',
        borderRadius: '10px',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No Care Plans Yet</div>
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Care plans will appear here once the RN completes them.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
          Care Plans ({carePlans.length})
        </h3>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {carePlans.map(plan => {
          const statusStyle = STATUS_STYLES[plan.status] || STATUS_STYLES.draft;
          
          return (
            <div
              key={plan.id}
              style={{
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                padding: '1rem',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '0.75rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      Care Plan #{plan.planNumber}
                    </span>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      fontSize: '0.7rem',
                      fontWeight: 500
                    }}>
                      {statusStyle.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                    {CARE_PLAN_TYPE_LABELS[plan.carePlanType] || plan.carePlanType} • {formatDate(plan.createdAt)}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => window.location.href = `/attorney/care-plan/${plan.id}`}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    View
                  </button>
                  <CarePlanPDFExport
                    carePlanId={plan.id}
                    carePlanNumber={plan.planNumber}
                    existingPdfUrl={plan.pdfUrl || undefined}
                    variant="icon"
                    size="sm"
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div style={{ 
                display: 'flex', 
                gap: '1.5rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid #f1f5f9'
              }}>
                {/* 4Ps Average */}
                {plan.fourPsAvg !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>4Ps:</span>
                    <span style={{
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      background: `${getScoreColor(plan.fourPsAvg)}20`,
                      color: getScoreColor(plan.fourPsAvg),
                      fontWeight: 600,
                      fontSize: '0.8rem'
                    }}>
                      {plan.fourPsAvg.toFixed(1)}
                    </span>
                  </div>
                )}

                {/* SDOH Flags */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>SDOH Flags:</span>
                  <span style={{
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    background: plan.sdohFlags > 0 ? '#fef2f220' : '#f1f5f9',
                    color: plan.sdohFlags > 0 ? '#dc2626' : '#64748b',
                    fontWeight: 600,
                    fontSize: '0.8rem'
                  }}>
                    {plan.sdohFlags}
                  </span>
                </div>

                {/* Overlays */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Overlays:</span>
                  <span style={{
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    background: '#f0f9ff',
                    color: '#0369a1',
                    fontWeight: 600,
                    fontSize: '0.8rem'
                  }}>
                    {plan.overlayCount}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ 
        marginTop: '1rem', 
        fontSize: '0.75rem', 
        color: '#94a3b8',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <span>4Ps: Wellness Score (1-5)</span>
        <span>SDOH Flags: Social Determinant Barriers</span>
        <span>Overlays: Applied Condition Lenses</span>
      </div>
    </div>
  );
};

export default AttorneyCaseCarePlans;
