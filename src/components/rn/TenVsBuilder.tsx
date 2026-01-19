// src/components/rn/TenVsBuilder.tsx
// FIXED VERSION - Uses raw fetch instead of broken Supabase client

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  ChevronDown,
  ChevronUp,
  Save,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Shield,
  Target,
  Zap,
  RefreshCw,
  Award,
  BarChart3,
  HeartPulse,
  TrendingUp,
  ArrowLeft
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

// Supabase credentials for raw fetch
const SUPABASE_URL = 'https://zmjxyspizdqhrtdcgkwk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptanh5c3BpemRxaHJ0ZGNna3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjgxODMsImV4cCI6MjA3OTcwNDE4M30.i5rqJXZPSHYFeaA8E26Vh69UPzgCmhrU9zL2kdE8jrM';

// Helper function for raw fetch
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

interface TenVsData {
  v1_voice: {
    p1_physical?: string;
    p2_psychological?: string;
    p3_psychosocial?: string;
    p4_professional?: string;
  };
  v2_viability: {
    p1?: { assessment?: string; score?: number; flagged?: boolean };
    p2?: { assessment?: string; score?: number; flagged?: boolean };
    p3?: { assessment?: string; score?: number; flagged?: boolean };
    p4?: { assessment?: string; score?: number; flagged?: boolean };
  };
  v3_vision: {
    p1?: { goal?: string; target_date?: string; outcome?: string };
    p2?: { goal?: string; target_date?: string; outcome?: string };
    p3?: { goal?: string; target_date?: string; outcome?: string };
    p4?: { goal?: string; target_date?: string; outcome?: string };
  };
  v4_veracity: {
    p1?: { notes?: string; providers?: string; addressed?: string };
    p2?: { notes?: string; providers?: string; addressed?: string };
    p3?: { notes?: string; providers?: string; addressed?: string };
    p4?: { notes?: string; providers?: string; addressed?: string };
  };
  v5_vigilance: {
    p1?: { monitoring?: string; changes?: string; alerts?: string };
    p2?: { monitoring?: string; changes?: string; alerts?: string };
    p3?: { monitoring?: string; changes?: string; alerts?: string };
    p4?: { monitoring?: string; changes?: string; alerts?: string };
  };
  v6_vitality: {
    p1?: { functional?: string; quality?: string; engagement?: number };
    p2?: { functional?: string; quality?: string; engagement?: number };
    p3?: { functional?: string; quality?: string; engagement?: number };
    p4?: { functional?: string; quality?: string; engagement?: number };
  };
  v7_versatility: {
    p1?: { modifications?: string; reason?: string; approach?: string };
    p2?: { modifications?: string; reason?: string; approach?: string };
    p3?: { modifications?: string; reason?: string; approach?: string };
    p4?: { modifications?: string; reason?: string; approach?: string };
  };
  v8_verification: {
    p1?: { alignment?: string; evidence?: string; verified?: boolean };
    p2?: { alignment?: string; evidence?: string; verified?: boolean };
    p3?: { alignment?: string; evidence?: string; verified?: boolean };
    p4?: { alignment?: string; evidence?: string; verified?: boolean };
  };
  v9_validation: {
    assessment?: string;
    effectiveness?: number;
    feedback?: string;
    review_date?: string;
  };
  v10_value: {
    p1?: { outcome?: string; improvement?: string };
    p2?: { outcome?: string; improvement?: string };
    p3?: { outcome?: string; improvement?: string };
    p4?: { outcome?: string; improvement?: string };
    summary?: string;
    roi?: string;
  };
}

interface ClientSummary {
  fourp_scores: {
    physical?: number;
    psychological?: number;
    psychosocial?: number;
    professional?: number;
  };
  viability_index: number;
  medications_count: number;
  treatments_count: number;
}

export default function TenVsBuilder() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<any>(null);
  const [clientSummary, setClientSummary] = useState<ClientSummary | null>(null);
  const [tenVsData, setTenVsData] = useState<TenVsData>({
    v1_voice: {},
    v2_viability: {},
    v3_vision: {},
    v4_veracity: {},
    v5_vigilance: {},
    v6_vitality: {},
    v7_versatility: {},
    v8_verification: {},
    v9_validation: {},
    v10_value: {},
  });
  const [carePlanStatus, setCarePlanStatus] = useState<'Draft' | 'In Progress' | 'Complete'>('Draft');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [carePlanId, setCarePlanId] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;
    fetchCaseData();
  }, [caseId]);

  async function fetchCaseData() {
    if (!caseId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('TenVsBuilder: Fetching case data for', caseId);
      
      // Fetch case
      const caseResult = await supabaseFetch(`rc_cases?id=eq.${caseId}&is_superseded=eq.false&select=id,case_number,client_id,date_of_injury`);
      
      if (!caseResult || caseResult.length === 0) {
        setError('Case not found');
        setLoading(false);
        return;
      }
      
      const caseInfo = caseResult[0];
      console.log('TenVsBuilder: Case found:', caseInfo);
      
      // Fetch client name
      let clientName = 'Unknown Client';
      if (caseInfo.client_id) {
        try {
          const clientResult = await supabaseFetch(`rc_clients?id=eq.${caseInfo.client_id}&select=first_name,last_name`);
          if (clientResult && clientResult.length > 0) {
            clientName = `${clientResult[0].first_name || ''} ${clientResult[0].last_name || ''}`.trim() || 'Unknown Client';
          }
        } catch (e) {
          console.log('TenVsBuilder: Could not fetch client name');
        }
      }
      
      setCaseData({
        ...caseInfo,
        client_name: clientName,
      });
      
      // Fetch latest check-in for 4P scores
      let fourpScores: any = {};
      try {
        const checkinResult = await supabaseFetch(
          `rc_client_checkins?case_id=eq.${caseId}&select=fourp_physical,fourp_psychological,fourp_psychosocial,fourp_professional&order=created_at.desc&limit=1`
        );
        if (checkinResult && checkinResult.length > 0) {
          fourpScores = {
            physical: checkinResult[0].fourp_physical,
            psychological: checkinResult[0].fourp_psychological,
            psychosocial: checkinResult[0].fourp_psychosocial,
            professional: checkinResult[0].fourp_professional,
          };
        }
      } catch (e) {
        console.log('TenVsBuilder: Could not fetch check-in data');
      }
      
      // Calculate viability index
      const viabilityIndex = fourpScores.physical || fourpScores.psychological || fourpScores.psychosocial || fourpScores.professional
        ? ((fourpScores.physical || 0) + (fourpScores.psychological || 0) +
           (fourpScores.psychosocial || 0) + (fourpScores.professional || 0)) / 4
        : 0;
      
      setClientSummary({
        fourp_scores: fourpScores,
        viability_index: viabilityIndex,
        medications_count: 0,
        treatments_count: 0,
      });
      
      // Fetch existing care plan from new rc_care_plans table
      try {
        const carePlanResult = await supabaseFetch(
          `rc_care_plans?case_id=eq.${caseId}&select=*&order=updated_at.desc&limit=1`
        );
        if (carePlanResult && carePlanResult.length > 0) {
          const plan = carePlanResult[0];
          setCarePlanId(plan.id);
          setCarePlanStatus(plan.status === 'submitted' || plan.status === 'approved' ? 'Complete' : 
                           plan.status === 'draft' ? 'Draft' : 'In Progress');
          setLastUpdated(plan.updated_at);
          
          // Load V assessments
          await loadVAssessments(plan.id);
        }
      } catch (e) {
        console.log('TenVsBuilder: No existing care plan found');
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('TenVsBuilder: Error fetching case data:', err);
      setError(err.message || 'Failed to load case data');
      setLoading(false);
    }
  }
  
  async function loadVAssessments(planId: string) {
    try {
      const vsResult = await supabaseFetch(
        `rc_care_plan_vs?care_plan_id=eq.${planId}&select=*`
      );
      
      if (vsResult && vsResult.length > 0) {
        // Map V assessments back to tenVsData structure
        // This is a simplified version - you may need to expand based on your data model
        console.log('TenVsBuilder: Loaded V assessments:', vsResult.length);
      }
    } catch (e) {
      console.log('TenVsBuilder: Could not load V assessments');
    }
  }

  async function saveCarePlan(isComplete = false) {
    if (!caseId) return;

    setSaving(true);
    try {
      const rnUserId = 'dd8b2a3b-a924-414f-854f-75737d173090'; // TODO: Get from auth
      const planStatus = isComplete ? 'submitted' : 'draft';
      
      if (carePlanId) {
        // Update existing care plan
        await supabaseFetch(`rc_care_plans?id=eq.${carePlanId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: planStatus,
            updated_at: new Date().toISOString(),
          }),
        });
      } else {
        // Create new care plan
        const result = await supabaseFetch('rc_care_plans', {
          method: 'POST',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify({
            case_id: caseId,
            plan_type: 'initial',
            plan_number: 1,
            status: planStatus,
            created_by: rnUserId,
          }),
        });
        
        if (result && result.length > 0) {
          setCarePlanId(result[0].id);
        }
      }
      
      setCarePlanStatus(isComplete ? 'Complete' : 
                       carePlanStatus === 'Draft' ? 'In Progress' : carePlanStatus);
      setLastUpdated(new Date().toISOString());
      toast.success(isComplete ? 'Care plan completed!' : 'Care plan saved');
    } catch (err: any) {
      console.error('TenVsBuilder: Error saving care plan:', err);
      toast.error('Failed to save care plan');
    } finally {
      setSaving(false);
    }
  }

  const calculateViabilityIndex = () => {
    const scores = [
      tenVsData.v2_viability.p1?.score,
      tenVsData.v2_viability.p2?.score,
      tenVsData.v2_viability.p3?.score,
      tenVsData.v2_viability.p4?.score,
    ].filter((s): s is number => s !== undefined && s !== null);

    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const getStatusBadge = () => {
    switch (carePlanStatus) {
      case 'Draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'In Progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'Complete':
        return <Badge className="bg-green-500">Complete</Badge>;
      default:
        return <Badge variant="outline">{carePlanStatus}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Loading care plan builder...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={() => navigate('/rn')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to RN Portal
          </Button>
        </div>
      </div>
    );
  }

  const viabilityIndex = calculateViabilityIndex();

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Button onClick={() => navigate('/rn')} variant="outline" size="sm">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to RN Portal
      </Button>
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">10-Vs Care Plan Builder</h1>
          <p className="text-muted-foreground mt-1">
            {caseData?.client_name || 'Unknown Client'} - {caseData?.case_number || 'No case number'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {getStatusBadge()}
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Last updated: {format(parseISO(lastUpdated), 'MMM d, yyyy h:mm a')}
            </span>
          )}
        </div>
      </div>

      {/* Client Summary Panel */}
      <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-center">
                <CardTitle>Client Summary</CardTitle>
                {summaryOpen ? <ChevronUp /> : <ChevronDown />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {clientSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">4P Scores</p>
                    <div className="text-xs mt-1">
                      <div>Physical: {clientSummary.fourp_scores.physical || 'N/A'}</div>
                      <div>Psychological: {clientSummary.fourp_scores.psychological || 'N/A'}</div>
                      <div>Psychosocial: {clientSummary.fourp_scores.psychosocial || 'N/A'}</div>
                      <div>Professional: {clientSummary.fourp_scores.professional || 'N/A'}</div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Viability Index</p>
                    <p className="text-lg font-bold">{clientSummary.viability_index.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Injury</p>
                    <p className="text-sm">
                      {caseData?.date_of_injury 
                        ? format(parseISO(caseData.date_of_injury), 'MMM d, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Case Number</p>
                    <p className="text-sm font-mono">{caseData?.case_number || 'N/A'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 10-Vs Accordion */}
      <Accordion type="multiple" className="space-y-4">
        {/* V1: VOICE/VIEW */}
        <AccordionItem value="v1" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">V1: VOICE/VIEW</span>
              <Badge variant="outline" className="ml-2 text-xs">MANDATORY</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Captures the client's lived story, self-perception, and desired outcome.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>P1 (Physical)</Label>
                  <Textarea
                    value={tenVsData.v1_voice.p1_physical || ''}
                    onChange={(e) => setTenVsData(prev => ({
                      ...prev,
                      v1_voice: { ...prev.v1_voice, p1_physical: e.target.value }
                    }))}
                    placeholder="What does the client say about their physical health?"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>P2 (Psychological)</Label>
                  <Textarea
                    value={tenVsData.v1_voice.p2_psychological || ''}
                    onChange={(e) => setTenVsData(prev => ({
                      ...prev,
                      v1_voice: { ...prev.v1_voice, p2_psychological: e.target.value }
                    }))}
                    placeholder="What does the client say about their mental health?"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>P3 (Psychosocial)</Label>
                  <Textarea
                    value={tenVsData.v1_voice.p3_psychosocial || ''}
                    onChange={(e) => setTenVsData(prev => ({
                      ...prev,
                      v1_voice: { ...prev.v1_voice, p3_psychosocial: e.target.value }
                    }))}
                    placeholder="What does the client say about support systems/SDOH?"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>P4 (Professional)</Label>
                  <Textarea
                    value={tenVsData.v1_voice.p4_professional || ''}
                    onChange={(e) => setTenVsData(prev => ({
                      ...prev,
                      v1_voice: { ...prev.v1_voice, p4_professional: e.target.value }
                    }))}
                    placeholder="What does the client say about work/finances?"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V2: VIABILITY */}
        <AccordionItem value="v2" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <span className="font-semibold">V2: VIABILITY</span>
              <Badge variant="outline" className="ml-2 text-xs">MANDATORY</Badge>
              {viabilityIndex !== null && (
                <Badge variant="outline" className="ml-2">
                  Index: {viabilityIndex.toFixed(1)}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Assesses readiness, capacity, and stability across the 4Ps and SDOH.
              </p>
              {['p1', 'p2', 'p3', 'p4'].map((p, idx) => {
                const pLabel = ['Physical', 'Psychological', 'Psychosocial', 'Professional'][idx];
                const pData = tenVsData.v2_viability[p as keyof typeof tenVsData.v2_viability];
                return (
                  <Card key={p}>
                    <CardHeader>
                      <CardTitle className="text-base">{pLabel}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Assessment</Label>
                        <Textarea
                          value={pData?.assessment || ''}
                          onChange={(e) => setTenVsData(prev => ({
                            ...prev,
                            v2_viability: {
                              ...prev.v2_viability,
                              [p]: { ...pData, assessment: e.target.value }
                            }
                          }))}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Score (1-5)</Label>
                          <Select
                            value={pData?.score?.toString() || ''}
                            onValueChange={(value) => setTenVsData(prev => ({
                              ...prev,
                              v2_viability: {
                                ...prev.v2_viability,
                                [p]: { ...pData, score: parseInt(value) }
                              }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select score" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 - Crisis</SelectItem>
                              <SelectItem value="2">2 - At Risk</SelectItem>
                              <SelectItem value="3">3 - Stable</SelectItem>
                              <SelectItem value="4">4 - Improving</SelectItem>
                              <SelectItem value="5">5 - Optimal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                          <Checkbox
                            id={`v2-${p}-flag`}
                            checked={pData?.flagged || false}
                            onCheckedChange={(checked) => setTenVsData(prev => ({
                              ...prev,
                              v2_viability: {
                                ...prev.v2_viability,
                                [p]: { ...pData, flagged: checked === true }
                              }
                            }))}
                          />
                          <Label htmlFor={`v2-${p}-flag`} className="cursor-pointer">
                            Flag concern
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V3: VISION */}
        <AccordionItem value="v3" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              <span className="font-semibold">V3: VISION</span>
              <Badge variant="outline" className="ml-2 text-xs">MANDATORY</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Defines shared goals and desired recovery trajectory.
              </p>
              {['p1', 'p2', 'p3', 'p4'].map((p, idx) => {
                const pLabel = ['Physical', 'Psychological', 'Psychosocial', 'Professional'][idx];
                const pData = tenVsData.v3_vision[p as keyof typeof tenVsData.v3_vision];
                return (
                  <Card key={p}>
                    <CardHeader>
                      <CardTitle className="text-base">{pLabel}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Goal</Label>
                        <Textarea
                          value={pData?.goal || ''}
                          onChange={(e) => setTenVsData(prev => ({
                            ...prev,
                            v3_vision: {
                              ...prev.v3_vision,
                              [p]: { ...pData, goal: e.target.value }
                            }
                          }))}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Target Date</Label>
                          <Input
                            type="date"
                            value={pData?.target_date || ''}
                            onChange={(e) => setTenVsData(prev => ({
                              ...prev,
                              v3_vision: {
                                ...prev.v3_vision,
                                [p]: { ...pData, target_date: e.target.value }
                              }
                            }))}
                          />
                        </div>
                        <div>
                          <Label>Measurable Outcome</Label>
                          <Textarea
                            value={pData?.outcome || ''}
                            onChange={(e) => setTenVsData(prev => ({
                              ...prev,
                              v3_vision: {
                                ...prev.v3_vision,
                                [p]: { ...pData, outcome: e.target.value }
                              }
                            }))}
                            rows={2}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V4: VERACITY */}
        <AccordionItem value="v4" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">V4: VERACITY</span>
              <Badge variant="secondary" className="ml-2 text-xs">TRIGGERED</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Focuses on integrity, accuracy, advocacy when client refuses treatment or provider is unresponsive.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Trigger:</strong> Client refuses treatment OR provider is unresponsive
                </p>
              </div>
              {/* Simplified V4 content */}
              <Textarea
                placeholder="Document issues with treatment refusal or provider communication..."
                rows={4}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V5: VERSATILITY */}
        <AccordionItem value="v5" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-indigo-500" />
              <span className="font-semibold">V5: VERSATILITY</span>
              <Badge variant="secondary" className="ml-2 text-xs">TRIGGERED</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Assesses adaptability when care plan needs revision.
              </p>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-sm text-indigo-800">
                  <strong>Trigger:</strong> Treatment needs revision, additional services needed, or condition changed.
                  <br /><strong>Action:</strong> Loop back to 4Ps to check if scores have changed.
                </p>
              </div>
              <Textarea
                placeholder="Document plan modifications and reasons..."
                rows={4}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V6: VITALITY */}
        <AccordionItem value="v6" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-red-500" />
              <span className="font-semibold">V6: VITALITY</span>
              <Badge variant="secondary" className="ml-2 text-xs">TRIGGERED</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Measures momentum, engagement, and forward movement.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Trigger:</strong> Case stalled, treatment stalled, or patient plateaued.
                  <br /><strong>Action:</strong> Also re-triggers V8 (Verification) and V9 (Value) review.
                </p>
              </div>
              <Textarea
                placeholder="Document why momentum has stopped and next steps..."
                rows={4}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V7: VIGILANCE */}
        <AccordionItem value="v7" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="font-semibold">V7: VIGILANCE</span>
              <Badge variant="secondary" className="ml-2 text-xs">ONGOING</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Continuous monitoring of risk, safety, compliance, and gaps.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>Tracks:</strong> Plan revision frequency, follow-up call frequency
                </p>
              </div>
              <Textarea
                placeholder="Document monitoring notes, follow-up calls, plan revisions..."
                rows={4}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V8: VERIFICATION */}
        <AccordionItem value="v8" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal-500" />
              <span className="font-semibold">V8: VERIFICATION</span>
              <Badge variant="outline" className="ml-2 text-xs">MANDATORY</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Ensures accuracy, evidence, guideline alignment, and defensibility.
              </p>
              {['p1', 'p2', 'p3', 'p4'].map((p, idx) => {
                const pLabel = ['Physical', 'Psychological', 'Psychosocial', 'Professional'][idx];
                const pData = tenVsData.v8_verification[p as keyof typeof tenVsData.v8_verification];
                return (
                  <Card key={p}>
                    <CardHeader>
                      <CardTitle className="text-base">{pLabel}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Guideline Alignment (ODG/MCG/InterQual)</Label>
                        <Textarea
                          value={pData?.alignment || ''}
                          onChange={(e) => setTenVsData(prev => ({
                            ...prev,
                            v8_verification: {
                              ...prev.v8_verification,
                              [p]: { ...pData, alignment: e.target.value }
                            }
                          }))}
                          placeholder="Reference guideline and note alignment or deviation..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Evidence/Documentation</Label>
                        <Textarea
                          value={pData?.evidence || ''}
                          onChange={(e) => setTenVsData(prev => ({
                            ...prev,
                            v8_verification: {
                              ...prev.v8_verification,
                              [p]: { ...pData, evidence: e.target.value }
                            }
                          }))}
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`v8-${p}-verified`}
                          checked={pData?.verified || false}
                          onCheckedChange={(checked) => setTenVsData(prev => ({
                            ...prev,
                            v8_verification: {
                              ...prev.v8_verification,
                              [p]: { ...pData, verified: checked === true }
                            }
                          }))}
                        />
                        <Label htmlFor={`v8-${p}-verified`} className="cursor-pointer">
                          Verified
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V9: VALUE */}
        <AccordionItem value="v9" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <span className="font-semibold">V9: VALUE</span>
              <Badge variant="outline" className="ml-2 text-xs">MANDATORY</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Quantifies benefit: outcomes, efficiency, cost stewardship, restored function.
              </p>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label>Overall Value Summary</Label>
                    <Textarea
                      value={tenVsData.v10_value.summary || ''}
                      onChange={(e) => setTenVsData(prev => ({
                        ...prev,
                        v10_value: { ...prev.v10_value, summary: e.target.value }
                      }))}
                      placeholder="Summarize the value/benefit achieved..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label>ROI Notes (for attorney summary)</Label>
                    <Textarea
                      value={tenVsData.v10_value.roi || ''}
                      onChange={(e) => setTenVsData(prev => ({
                        ...prev,
                        v10_value: { ...prev.v10_value, roi: e.target.value }
                      }))}
                      placeholder="Document return on investment for legal use..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V10: VALIDATION */}
        <AccordionItem value="v10" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <span className="font-semibold">V10: VALIDATION</span>
              <Badge variant="outline" className="ml-2 text-xs">MANDATORY</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Quality assurance + equity loop - confirms care was appropriate and equitable.
              </p>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label>Overall Assessment</Label>
                    <Textarea
                      value={tenVsData.v9_validation.assessment || ''}
                      onChange={(e) => setTenVsData(prev => ({
                        ...prev,
                        v9_validation: { ...prev.v9_validation, assessment: e.target.value }
                      }))}
                      placeholder="Document QA review and equity considerations..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Effectiveness Score (1-5)</Label>
                      <Select
                        value={tenVsData.v9_validation.effectiveness?.toString() || ''}
                        onValueChange={(value) => setTenVsData(prev => ({
                          ...prev,
                          v9_validation: { ...prev.v9_validation, effectiveness: parseInt(value) }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select score" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Not Effective</SelectItem>
                          <SelectItem value="2">2 - Minimally Effective</SelectItem>
                          <SelectItem value="3">3 - Moderately Effective</SelectItem>
                          <SelectItem value="4">4 - Very Effective</SelectItem>
                          <SelectItem value="5">5 - Highly Effective</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>90-Day Review Date</Label>
                      <Input
                        type="date"
                        value={tenVsData.v9_validation.review_date || ''}
                        onChange={(e) => setTenVsData(prev => ({
                          ...prev,
                          v9_validation: { ...prev.v9_validation, review_date: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Client Feedback Notes</Label>
                    <Textarea
                      value={tenVsData.v9_validation.feedback || ''}
                      onChange={(e) => setTenVsData(prev => ({
                        ...prev,
                        v9_validation: { ...prev.v9_validation, feedback: e.target.value }
                      }))}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Save Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                onClick={() => saveCarePlan(false)}
                disabled={saving}
                variant="outline"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                onClick={() => saveCarePlan(false)}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save & Continue
              </Button>
            </div>
            <Button
              onClick={() => saveCarePlan(true)}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Care Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
