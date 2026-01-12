import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  FileText,
  Calendar,
  Activity,
  HeartPulse,
  TrendingUp,
  Eye,
  Shield,
  Target,
  Zap,
  RefreshCw,
  Search,
  Award,
  BarChart3
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";

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
  vital_signs: any;
  active_flags: number;
}

export default function TenVsBuilder() {
  const { caseId } = useParams<{ caseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    if (!caseId || !user?.id) return;
    fetchCaseData();
    fetchCarePlan();
  }, [caseId, user?.id]);

  async function fetchCaseData() {
    if (!caseId) return;
    
    setLoading(true);
    try {
      // Fetch case
      const { data: caseData, error: caseError } = await supabase
        .from('rc_cases')
        .select('id, case_number, client_id, date_of_injury')
        .eq('id', caseId)
        .single();

      if (caseError) throw caseError;
      setCaseData(caseData);

      // Fetch client
      if (caseData.client_id) {
        const { data: clientData } = await supabase
          .from('rc_clients')
          .select('first_name, last_name')
          .eq('id', caseData.client_id)
          .single();

        if (clientData) {
          setCaseData({
            ...caseData,
            client_name: `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim(),
          });
        }
      }

      // Fetch latest check-in for 4P scores
      const { data: checkinData } = await supabase
        .from('rc_client_checkins')
        .select('fourp_physical, fourp_psychological, fourp_psychosocial, fourp_professional, created_at')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fetch medications count
      const { data: medsData } = await supabase
        .from('rc_medications')
        .select('id', { count: 'exact', head: true })
        .eq('case_id', caseId)
        .is('discontinued_at', null);

      // Fetch treatments count
      const { data: treatmentsData } = await supabase
        .from('rc_treatments')
        .select('id', { count: 'exact', head: true })
        .eq('case_id', caseId)
        .is('discontinued_at', null);

      // Calculate viability index
      const fourpScores = checkinData ? {
        physical: checkinData.fourp_physical,
        psychological: checkinData.fourp_psychological,
        psychosocial: checkinData.fourp_psychosocial,
        professional: checkinData.fourp_professional,
      } : null;

      const viabilityIndex = fourpScores
        ? ((fourpScores.physical || 0) + (fourpScores.psychological || 0) +
           (fourpScores.psychosocial || 0) + (fourpScores.professional || 0)) / 4
        : 0;

      setClientSummary({
        fourp_scores: fourpScores || {},
        viability_index: viabilityIndex,
        medications_count: medsData?.length || 0,
        treatments_count: treatmentsData?.length || 0,
        vital_signs: null, // TODO: Fetch from appropriate table
        active_flags: 0, // TODO: Fetch from clinical flags
      });

      // Auto-populate V1 from intake if available
      if (checkinData) {
        setTenVsData(prev => ({
          ...prev,
          v1_voice: {
            p1_physical: prev.v1_voice.p1_physical || '',
            p2_psychological: prev.v1_voice.p2_psychological || '',
            p3_psychosocial: prev.v1_voice.p3_psychosocial || '',
            p4_professional: prev.v1_voice.p4_professional || '',
          },
        }));
      }

    } catch (error) {
      console.error('Error fetching case data:', error);
      toast.error('Failed to load case data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCarePlan() {
    if (!caseId || !user?.id) return;

    try {
      const { data: carePlan, error } = await supabase
        .from('care_plans')
        .select('*')
        .eq('case_id', caseId)
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (carePlan) {
        // Parse plan_text as JSON if it contains TenVs data
        try {
          const parsed = JSON.parse(carePlan.plan_text);
          if (parsed.tenVs) {
            setTenVsData(parsed.tenVs);
          }
        } catch {
          // If not JSON, treat as plain text (legacy format)
        }

        setCarePlanStatus(carePlan.plan_type === 'final' ? 'Complete' : 
                         carePlan.plan_type === 'updated' ? 'In Progress' : 'Draft');
        setLastUpdated(carePlan.updated_at);
      }
    } catch (error) {
      console.error('Error fetching care plan:', error);
    }
  }

  async function saveCarePlan(isComplete = false) {
    if (!caseId || !user?.id) return;

    setSaving(true);
    try {
      const planData = {
        tenVs: tenVsData,
        status: isComplete ? 'Complete' : carePlanStatus,
        saved_at: new Date().toISOString(),
      };

      const planType = isComplete ? 'final' : 
                     carePlanStatus === 'In Progress' ? 'updated' : 'preliminary';

      // Check if care plan exists
      const { data: existing } = await supabase
        .from('care_plans')
        .select('id')
        .eq('case_id', caseId)
        .eq('created_by', user.id)
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('care_plans')
          .update({
            plan_text: JSON.stringify(planData),
            plan_type: planType,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('care_plans')
          .insert({
            case_id: caseId,
            created_by: user.id,
            plan_text: JSON.stringify(planData),
            plan_type: planType,
          });

        if (error) throw error;
      }

      setCarePlanStatus(isComplete ? 'Complete' : 
                       carePlanStatus === 'Draft' ? 'In Progress' : carePlanStatus);
      setLastUpdated(new Date().toISOString());
      toast.success(isComplete ? 'Care plan completed!' : 'Care plan saved');
    } catch (error) {
      console.error('Error saving care plan:', error);
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
      <AppLayout>
        <div className="p-6">
          <div className="text-center text-muted-foreground">Loading care plan builder...</div>
        </div>
      </AppLayout>
    );
  }

  const viabilityIndex = calculateViabilityIndex();

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
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
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                      <p className="text-sm text-muted-foreground">Active Medications</p>
                      <p className="text-lg font-bold">{clientSummary.medications_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Treatments</p>
                      <p className="text-lg font-bold">{clientSummary.treatments_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Flags</p>
                      <p className="text-lg font-bold">{clientSummary.active_flags}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date of Injury</p>
                      <p className="text-sm">
                        {caseData?.date_of_injury 
                          ? format(parseISO(caseData.date_of_injury), 'MMM d, yyyy')
                          : 'N/A'}
                      </p>
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
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Listen to the patient's narrative to gather initial data for all 4Ps
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
                  Assess willingness, ability, and resources for a plan for each P
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

          {/* Continue with V3-V10... Due to length, I'll create a simplified version that can be expanded */}
          {/* V3: VISION */}
          <AccordionItem value="v3" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                <span className="font-semibold">V3: VISION</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Collaborate to create a plan with goals for each of the 4Ps
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
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Implement the plan with fidelity, addressing all 4Ps
                </p>
                {['p1', 'p2', 'p3', 'p4'].map((p, idx) => {
                  const pLabel = ['Physical', 'Psychological', 'Psychosocial', 'Professional'][idx];
                  const pData = tenVsData.v4_veracity[p as keyof typeof tenVsData.v4_veracity];
                  return (
                    <Card key={p}>
                      <CardHeader>
                        <CardTitle className="text-base">{pLabel}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Implementation Notes</Label>
                          <Textarea
                            value={pData?.notes || ''}
                            onChange={(e) => setTenVsData(prev => ({
                              ...prev,
                              v4_veracity: {
                                ...prev.v4_veracity,
                                [p]: { ...pData, notes: e.target.value }
                              }
                            }))}
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Providers/Resources Engaged</Label>
                          <Textarea
                            value={pData?.providers || ''}
                            onChange={(e) => setTenVsData(prev => ({
                              ...prev,
                              v4_veracity: {
                                ...prev.v4_veracity,
                                [p]: { ...pData, providers: e.target.value }
                              }
                            }))}
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>Addressed?</Label>
                          <Select
                            value={pData?.addressed || ''}
                            onValueChange={(value) => setTenVsData(prev => ({
                              ...prev,
                              v4_veracity: {
                                ...prev.v4_veracity,
                                [p]: { ...pData, addressed: value }
                              }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                              <SelectItem value="Exception">Exception</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* V5: VIGILANCE */}
          <AccordionItem value="v5" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span className="font-semibold">V5: VIGILANCE</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Monitor for changes in all 4Ps
                </p>
                {['p1', 'p2', 'p3', 'p4'].map((p, idx) => {
                  const pLabel = ['Physical', 'Psychological', 'Psychosocial', 'Professional'][idx];
                  const pData = tenVsData.v5_vigilance[p as keyof typeof tenVsData.v5_vigilance];
                  return (
                    <Card key={p}>
                      <CardHeader>
                        <CardTitle className="text-base">{pLabel}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Monitoring Notes</Label>
                          <Textarea
                            value={pData?.monitoring || ''}
                            onChange={(e) => setTenVsData(prev => ({
                              ...prev,
                              v5_vigilance: {
                                ...prev.v5_vigilance,
                                [p]: { ...pData, monitoring: e.target.value }
                              }
                            }))}
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Changes Observed</Label>
                          <Textarea
                            value={pData?.changes || ''}
                            onChange={(e) => setTenVsData(prev => ({
                              ...prev,
                              v5_vigilance: {
                                ...prev.v5_vigilance,
                                [p]: { ...pData, changes: e.target.value }
                              }
                            }))}
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>Alert Triggers</Label>
                          <Textarea
                            value={pData?.alerts || ''}
                            onChange={(e) => setTenVsData(prev => ({
                              ...prev,
                              v5_vigilance: {
                                ...prev.v5_vigilance,
                                [p]: { ...pData, alerts: e.target.value }
                              }
                            }))}
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* V6: VITALITY */}
          <AccordionItem value="v6" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-red-500" />
                <span className="font-semibold">V6: VITALITY</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Focus on well-being and functional capacity within each P
                </p>
                {['p1', 'p2', 'p3', 'p4'].map((p, idx) => {
                  const pLabel = ['Physical', 'Psychological', 'Psychosocial', 'Professional'][idx];
                  const pData = tenVsData.v6_vitality[p as keyof typeof tenVsData.v6_vitality];
                  return (
                    <Card key={p}>
                      <CardHeader>
                        <CardTitle className="text-base">{pLabel}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Functional Status Notes</Label>
                          <Textarea
                            value={pData?.functional || ''}
                            onChange={(e) => setTenVsData(prev => ({
                              ...prev,
                              v6_vitality: {
                                ...prev.v6_vitality,
                                [p]: { ...pData, functional: e.target.value }
                              }
                            }))}
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Quality of Life Observations</Label>
                          <Textarea
                            value={pData?.quality || ''}
                            onChange={(e) => setTenVsData(prev => ({
                              ...prev,
                              v6_vitality: {
                                ...prev.v6_vitality,
                                [p]: { ...pData, quality: e.target.value }
                              }
                            }))}
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>Client Engagement Level (1-5)</Label>
                          <Select
                            value={pData?.engagement?.toString() || ''}
                            onValueChange={(value) => setTenVsData(prev => ({
                              ...prev,
                              v6_vitality: {
                                ...prev.v6_vitality,
                                [p]: { ...pData, engagement: parseInt(value) }
                              }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 - Minimal</SelectItem>
                              <SelectItem value="2">2 - Low</SelectItem>
                              <SelectItem value="3">3 - Moderate</SelectItem>
                              <SelectItem value="4">4 - High</SelectItem>
                              <SelectItem value="5">5 - Optimal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* V7: VERSATILITY */}
          <AccordionItem value="v7" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-indigo-500" />
                <span className="font-semibold">V7: VERSATILITY</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Re-evaluate and modify based on outcomes in any P
                </p>
                {['p1', 'p2', 'p3', 'p4'].map((p, idx) => {
                  const pLabel = ['Physical', 'Psychological', 'Psychosocial', 'Professional'][idx];
                  const pData = tenVsData.v7_versatility[p as keyof typeof tenVsData.v7_versatility];
                  return (
                    <Card key={p}>
                      <CardHeader>
                        <CardTitle className="text-base">{pLabel}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Plan Modifications Needed</Label>
                          <Textarea
                            value={pData?.modifications || ''}
                            onChange={(e) => setTenVsData(prev => ({
                              ...prev,
                              v7_versatility: {
                                ...prev.v7_versatility,
                                [p]: { ...pData, modifications: e.target.value }
                              }
                            }))}
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Reason for Change</Label>
                          <Textarea
                            value={pData?.reason || ''}
                            onChange={(e) => setTenVsData(prev => ({
                              ...prev,
                              v7_versatility: {
                                ...prev.v7_versatility,
                                [p]: { ...pData, reason: e.target.value }
                              }
                            }))}
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>New Approach</Label>
                          <Textarea
                            value={pData?.approach || ''}
                            onChange={(e) => setTenVsData(prev => ({
                              ...prev,
                              v7_versatility: {
                                ...prev.v7_versatility,
                                [p]: { ...pData, approach: e.target.value }
                              }
                            }))}
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* V8: VERIFICATION */}
          <AccordionItem value="v8" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal-500" />
                <span className="font-semibold">V8: VERIFICATION</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Confirm care aligns with guidelines and goals for each relevant P
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
                          <Label>Guideline Alignment Notes</Label>
                          <Textarea
                            value={pData?.alignment || ''}
                            onChange={(e) => setTenVsData(prev => ({
                              ...prev,
                              v8_verification: {
                                ...prev.v8_verification,
                                [p]: { ...pData, alignment: e.target.value }
                              }
                            }))}
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Evidence Base Reference</Label>
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
                            Verified?
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* V9: VALIDATION */}
          <AccordionItem value="v9" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                <span className="font-semibold">V9: VALIDATION</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Confirm overall approach is effective for whole-person context
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

          {/* V10: VALUE */}
          <AccordionItem value="v10" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <span className="font-semibold">V10: VALUE</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Measure positive outcomes through improvement in the 4Ps
                </p>
                {['p1', 'p2', 'p3', 'p4'].map((p, idx) => {
                  const pLabel = ['Physical', 'Psychological', 'Psychosocial', 'Professional'][idx];
                  const pData = tenVsData.v10_value[p as keyof typeof tenVsData.v10_value];
                  return (
                    <Card key={p}>
                      <CardHeader>
                        <CardTitle className="text-base">{pLabel}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Outcome Measurement</Label>
                          <Textarea
                            value={pData?.outcome || ''}
                            onChange={(e) => setTenVsData(prev => ({
                              ...prev,
                              v10_value: {
                                ...prev.v10_value,
                                [p]: { ...pData, outcome: e.target.value }
                              }
                            }))}
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Improvement Noted</Label>
                          <Select
                            value={pData?.improvement || ''}
                            onValueChange={(value) => setTenVsData(prev => ({
                              ...prev,
                              v10_value: {
                                ...prev.v10_value,
                                [p]: { ...pData, improvement: value }
                              }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                              <SelectItem value="Partial">Partial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Overall Value Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Overall Value Summary</Label>
                      <Textarea
                        value={tenVsData.v10_value.summary || ''}
                        onChange={(e) => setTenVsData(prev => ({
                          ...prev,
                          v10_value: { ...prev.v10_value, summary: e.target.value }
                        }))}
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
    </AppLayout>
  );
}
