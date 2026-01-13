import { Link, useNavigate } from "react-router-dom";
import { 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle, 
  ClipboardList,
  HeartPulse,
  MessageSquare,
  Settings,
  Users,
  Activity,
  FolderKanban,
  Calendar,
  ClipboardCheck,
  AlertCircle,
  TrendingDown,
  StickyNote,
  BookOpen,
  Bell,
  UserCheck,
  Search,
  GitBranch,
  Mic,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/context/AppContext";
import { ROLES } from "@/config/rcms";
import { useAuth } from "@/auth/supabaseAuth";
import { useRNAssignments, useRNAssessments, useRNDiary } from "@/hooks/useRNData";
import { format, parseISO } from "date-fns";
import { RNToDoList } from "@/components/RNToDoList";
import { MetricNoteDialog } from "@/components/MetricNoteDialog";
import { useEffect, useState } from "react";
import { fetchRNMetrics, type RNMetricsData } from "@/lib/rnMetrics";
import { supabase } from "@/integrations/supabase/client";
import { RNQuickActionsBar } from "@/components/RNQuickActionsBar";
import { RNRecentActivityFeed } from "@/components/RNRecentActivityFeed";
import { RNUpcomingDeadlines } from "@/components/RNUpcomingDeadlines";
import { RNCaseHealthOverview } from "@/components/RNCaseHealthOverview";
import { RNTeamPerformance } from "@/components/RNTeamPerformance";
import { RNClientSatisfaction } from "@/components/RNClientSatisfaction";
import { RNCaseloadAtAGlance } from "@/components/RNCaseloadAtAGlance";
import { RNCommunicationPriority } from "@/components/RNCommunicationPriority";
import { RNComplianceAlerts } from "@/components/RNComplianceAlerts";
import { RNTodaysPriorities } from "@/components/RNTodaysPriorities";
import { RNEngagementMetrics } from "@/components/RNEngagementMetrics";
import { RNTimeStatsWidget } from "@/components/RNTimeStatsWidget";
import { RNNavigationGuard } from "@/components/RNNavigationGuard";
import { WorkQueue } from "@/components/rn/WorkQueue";

interface CaseItem {
  id: string;
  case_number: string | null;
  client_name: string;
  date_of_injury: string | null;
  case_type: string | null;
  fourp_scores: {
    physical?: number;
    psychological?: number;
    psychosocial?: number;
    professional?: number;
  } | null;
  viability_index: number | null;
  active_flags_count: number;
  last_checkin_date: string | null;
  care_plan_status: string | null;
}

export default function RNPortalLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useApp();
  const isSupervisor = role === ROLES.SUPER_USER || role === ROLES.SUPER_ADMIN;
  const { assignments } = useRNAssignments();
  const { pending: pendingAssessments, requireFollowup } = useRNAssessments();
  const { entries: diaryEntries } = useRNDiary();
  const [metricsData, setMetricsData] = useState<RNMetricsData | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [metricNotes, setMetricNotes] = useState<Set<string>>(new Set());
  const [selectedMetric, setSelectedMetric] = useState<{
    name: string;
    label: string;
    value: number;
    target: number;
  } | null>(null);
  const [pendingCases, setPendingCases] = useState<CaseItem[]>([]);
  const [activeCases, setActiveCases] = useState<CaseItem[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  const newAssignments = assignments.filter((a) => {
    const assignedDate = new Date(a.assigned_at);
    const daysSinceAssigned = Math.floor((Date.now() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceAssigned <= 3;
  });

  const upcomingDiaryEntries = diaryEntries.slice(0, 5);
  const hasEmergencies = metricsData && metricsData.metrics.alerts.length > 0;

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load metrics
        const data = await fetchRNMetrics();
        setMetricsData(data);
        
        // Load notes for current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: notes } = await supabase
            .from('rn_metric_notes')
            .select('metric_name')
            .eq('rn_user_id', user.id);
          
          if (notes) {
            const uniqueMetrics = new Set(notes.map(n => n.metric_name));
            setMetricNotes(uniqueMetrics);
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setMetricsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Fetch pending and active cases
  useEffect(() => {
    const fetchCases = async () => {
      if (!user?.id) {
        setCasesLoading(false);
        return;
      }

      try {
        setCasesLoading(true);

        // First, get the rc_users.id from auth_user_id
        const { data: rcUserData, error: rcUserError } = await supabase
          .from('rc_users')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (rcUserError || !rcUserData?.id) {
          console.error('Failed to get rc_users.id:', rcUserError);
          setPendingCases([]);
          setActiveCases([]);
          return;
        }

        const rcUserId = rcUserData.id;

        // Get all cases for this RN
        const { data: casesData, error: casesError } = await supabase
          .from('rc_cases')
          .select('id, case_number, date_of_injury, case_type, client_id')
          .eq('rn_cm_id', rcUserId);

        if (casesError) {
          console.error('Failed to fetch cases:', casesError);
          setPendingCases([]);
          setActiveCases([]);
          return;
        }

        if (!casesData || casesData.length === 0) {
          setPendingCases([]);
          setActiveCases([]);
          return;
        }

        const caseIds = casesData.map(c => c.id);

        // Fetch client names
        const { data: clientsData } = await supabase
          .from('rc_clients')
          .select('id, first_name, last_name')
          .in('id', casesData.map(c => c.client_id).filter(Boolean) || []);

        // Fetch intakes to check attorney attestation
        const { data: intakesData } = await supabase
          .from('rc_client_intakes')
          .select('case_id, attorney_attested_at')
          .in('case_id', caseIds);

        // Fetch care plans
        const { data: carePlansData } = await supabase
          .from('rc_care_plans')
          .select('case_id, plan_type, updated_at')
          .in('case_id', caseIds);

        // Fetch latest check-ins for 4P scores
        const { data: checkinsData } = await supabase
          .from('rc_client_checkins')
          .select('case_id, fourp_physical, fourp_psychological, fourp_psychosocial, fourp_professional, created_at')
          .in('case_id', caseIds)
          .order('created_at', { ascending: false });

        const casesWithCarePlans = new Set(carePlansData?.map(cp => cp.case_id) || []);

        // Build cases array
        const casesWithData: CaseItem[] = (casesData || []).map(c => {
          const client = clientsData?.find(cl => cl.id === c.client_id);
          const clientName = client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() : 'Unknown Client';
          
          const intake = intakesData?.find(i => i.case_id === c.id);
          const attorneyAttested = !!intake?.attorney_attested_at;
          const hasCarePlan = casesWithCarePlans.has(c.id);

          const latestCheckin = checkinsData?.find(ch => ch.case_id === c.id);
          const fourpScores = latestCheckin ? {
            physical: latestCheckin.fourp_physical,
            psychological: latestCheckin.fourp_psychological,
            psychosocial: latestCheckin.fourp_psychosocial,
            professional: latestCheckin.fourp_professional,
          } : null;

          const viabilityIndex = fourpScores 
            ? ((fourpScores.physical || 0) + (fourpScores.psychological || 0) + 
               (fourpScores.psychosocial || 0) + (fourpScores.professional || 0)) / 4
            : null;

          const carePlan = carePlansData?.find(cp => cp.case_id === c.id);
          const carePlanStatus = carePlan 
            ? (carePlan.plan_type === 'final' ? 'Complete' : 
               carePlan.plan_type === 'updated' ? 'In Progress' : 'Draft')
            : null;

          return {
            id: c.id,
            case_number: c.case_number,
            client_name: clientName,
            date_of_injury: c.date_of_injury,
            case_type: c.case_type,
            fourp_scores: fourpScores,
            viability_index: viabilityIndex,
            active_flags_count: 0, // TODO: Fetch from clinical flags table
            last_checkin_date: latestCheckin?.created_at || null,
            care_plan_status: carePlanStatus,
          };
        });

        // Split into pending and active
        // Pending: attorney attested but no care plan
        const pending = casesWithData.filter(c => {
          const intake = intakesData?.find(i => i.case_id === c.id);
          const attorneyAttested = !!intake?.attorney_attested_at;
          return attorneyAttested && !casesWithCarePlans.has(c.id);
        });

        // Active: has care plan
        const active = casesWithData.filter(c => casesWithCarePlans.has(c.id));

        setPendingCases(pending);
        setActiveCases(active);
      } catch (error) {
        console.error('Error fetching cases:', error);
        setPendingCases([]);
        setActiveCases([]);
      } finally {
        setCasesLoading(false);
      }
    };

    fetchCases();
  }, [user?.id]);

  const handleMetricClick = (name: string, label: string, value: number, target: number) => {
    setSelectedMetric({ name, label, value, target });
    setNoteDialogOpen(true);
  };

  const handleNoteDialogClose = async (open: boolean) => {
    setNoteDialogOpen(open);
    
    // Refresh notes when dialog closes
    if (!open) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: notes } = await supabase
          .from('rn_metric_notes')
          .select('metric_name')
          .eq('rn_user_id', user.id);
        
        if (notes) {
          const uniqueMetrics = new Set(notes.map(n => n.metric_name));
          setMetricNotes(uniqueMetrics);
        }
      }
    }
  };

  const hasNote = (metricName: string) => {
    return metricNotes.has(metricName);
  };

  const getColorClass = (value: number, target: number) => {
    if (value >= target) return "bg-green-500";
    if (value >= target - 5) return "bg-yellow-400";
    return "bg-red-500";
  };

  const getTrendIcon = (change: string) => {
    if (change.startsWith("+")) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (change.startsWith("-")) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return null;
  };
  
  return (
    <AppLayout>
      <div className="py-6 px-6 bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 min-h-screen">
        <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-3">
            <span>RN Case Management</span>
            <span className="opacity-75">Dashboard</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f2a6a]">
            Welcome to Your Dashboard
          </h1>
          <p className="text-[#0f2a6a]/80 mt-2 max-w-2xl">
            Your performance metrics, assigned cases, and quick access to all tools.
          </p>
        </header>

          {/* Quick Actions Bar */}
          <section className="mb-6">
            <RNQuickActionsBar />
          </section>

          {/* Metric Note Dialog */}
          {selectedMetric && (
            <MetricNoteDialog
              open={noteDialogOpen}
              onOpenChange={handleNoteDialogClose}
              metricName={selectedMetric.name}
              metricLabel={selectedMetric.label}
              currentValue={selectedMetric.value}
              targetValue={selectedMetric.target}
            />
          )}

          {/* Compact Emergency Alerts Banner */}
          {hasEmergencies && (
            <div className="mb-4">
              <Alert variant="destructive" className="border-l-4 animate-pulse">
                <AlertCircle className="h-4 w-4 animate-pulse" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="font-semibold">
                    {metricsData!.metrics.alerts.length} EMERGENCY Alert{metricsData!.metrics.alerts.length !== 1 ? 's' : ''} - SUICIDAL IDEATION
                  </span>
                  <Badge variant="destructive" className="animate-pulse">IMMEDIATE ACTION REQUIRED</Badge>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* PENDING CASES SECTION */}
          <section id="pending-cases" className="mb-6">
            <Card>
              <CardHeader className="bg-amber-50 border-b border-amber-200" style={{ backgroundColor: '#fef3c7' }}>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-amber-900">Pending Cases</CardTitle>
                  <Badge className="bg-amber-500" style={{ backgroundColor: '#f59e0b' }}>
                    {pendingCases.length} Pending
                  </Badge>
                </div>
                <CardDescription className="text-amber-700">
                  Newly attested cases awaiting initial care plan
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {casesLoading ? (
                  <div className="text-center text-muted-foreground py-8 text-sm">Loading pending cases...</div>
                ) : pendingCases.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 text-sm">No pending cases</div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {pendingCases.map((caseItem) => (
                        <Collapsible
                          key={caseItem.id}
                          open={expandedCaseId === caseItem.id}
                          onOpenChange={(open) => setExpandedCaseId(open ? caseItem.id : null)}
                        >
                          <Card className="border-l-4" style={{ borderLeftColor: '#f59e0b' }}>
                            <CollapsibleTrigger className="w-full">
                              <CardContent className="p-3 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{caseItem.case_number || 'No case number'}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">{caseItem.client_name}</p>
                                    </div>
                                  </div>
                                  {expandedCaseId === caseItem.id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </div>
                              </CardContent>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="pt-0 pb-4 px-3">
                                <div className="space-y-3 border-t pt-3 mt-3">
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                      <span className="text-muted-foreground font-medium">Date of Injury:</span>
                                      <p className="mt-0.5">
                                        {caseItem.date_of_injury 
                                          ? format(parseISO(caseItem.date_of_injury), 'MMM d, yyyy')
                                          : 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground font-medium">Case Type:</span>
                                      <p className="mt-0.5">{caseItem.case_type || 'N/A'}</p>
                                    </div>
                                  </div>

                                  {caseItem.fourp_scores && (
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-1">4P Scores:</p>
                                      <div className="grid grid-cols-4 gap-2 text-xs">
                                        <div>
                                          <span className="text-muted-foreground">P1: </span>
                                          <span className="font-semibold">{caseItem.fourp_scores.physical || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">P2: </span>
                                          <span className="font-semibold">{caseItem.fourp_scores.psychological || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">P3: </span>
                                          <span className="font-semibold">{caseItem.fourp_scores.psychosocial || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">P4: </span>
                                          <span className="font-semibold">{caseItem.fourp_scores.professional || 'N/A'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                      <span className="text-muted-foreground font-medium">Active Flags:</span>
                                      <p className="mt-0.5">{caseItem.active_flags_count}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground font-medium">Last Check-in:</span>
                                      <p className="mt-0.5">
                                        {caseItem.last_checkin_date
                                          ? format(parseISO(caseItem.last_checkin_date), 'MMM d, yyyy')
                                          : 'Never'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/cases/${caseItem.id}`);
                                      }}
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      Open Case
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="flex-1 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/rn/case/${caseItem.id}/ten-vs`);
                                      }}
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      Start Care Plan
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Today's Priorities and Caseload At-a-Glance */}
          <section className="mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RNCaseloadAtAGlance />
              <RNTodaysPriorities />
            </div>
          </section>

          {/* Recent Activity and Upcoming Deadlines */}
          <section className="mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RNRecentActivityFeed />
              <RNUpcomingDeadlines />
            </div>
          </section>

          {/* ACTIVE CASES SECTION */}
          <section id="active-cases" className="mb-6">
            <Card>
              <CardHeader className="bg-green-50 border-b border-green-200" style={{ backgroundColor: '#d1fae5' }}>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-green-900">Active Cases</CardTitle>
                  <Badge className="bg-green-500" style={{ backgroundColor: '#10b981' }}>
                    {activeCases.length} Active
                  </Badge>
                </div>
                <CardDescription className="text-green-700">
                  Cases with existing care plans
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {casesLoading ? (
                  <div className="text-center text-muted-foreground py-8 text-sm">Loading active cases...</div>
                ) : activeCases.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 text-sm">No active cases</div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {activeCases.map((caseItem) => (
                        <Collapsible
                          key={caseItem.id}
                          open={expandedCaseId === caseItem.id}
                          onOpenChange={(open) => setExpandedCaseId(open ? caseItem.id : null)}
                        >
                          <Card className="border-l-4" style={{ borderLeftColor: '#10b981' }}>
                            <CollapsibleTrigger className="w-full">
                              <CardContent className="p-3 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{caseItem.case_number || 'No case number'}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">{caseItem.client_name}</p>
                                    </div>
                                  </div>
                                  {expandedCaseId === caseItem.id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </div>
                              </CardContent>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="pt-0 pb-4 px-3">
                                <div className="space-y-3 border-t pt-3 mt-3">
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                      <span className="text-muted-foreground font-medium">Date of Injury:</span>
                                      <p className="mt-0.5">
                                        {caseItem.date_of_injury 
                                          ? format(parseISO(caseItem.date_of_injury), 'MMM d, yyyy')
                                          : 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground font-medium">Case Type:</span>
                                      <p className="mt-0.5">{caseItem.case_type || 'N/A'}</p>
                                    </div>
                                  </div>

                                  {caseItem.fourp_scores && (
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-1">4P Scores:</p>
                                      <div className="grid grid-cols-4 gap-2 text-xs">
                                        <div>
                                          <span className="text-muted-foreground">P1: </span>
                                          <span className="font-semibold">{caseItem.fourp_scores.physical || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">P2: </span>
                                          <span className="font-semibold">{caseItem.fourp_scores.psychological || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">P3: </span>
                                          <span className="font-semibold">{caseItem.fourp_scores.psychosocial || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">P4: </span>
                                          <span className="font-semibold">{caseItem.fourp_scores.professional || 'N/A'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {caseItem.viability_index !== null && (
                                    <div>
                                      <span className="text-xs text-muted-foreground font-medium">Viability Index: </span>
                                      <Badge variant="outline" className="text-xs ml-2">
                                        {caseItem.viability_index.toFixed(1)}
                                      </Badge>
                                    </div>
                                  )}

                                  {caseItem.care_plan_status && (
                                    <div>
                                      <span className="text-xs text-muted-foreground font-medium">Care Plan Status: </span>
                                      {caseItem.care_plan_status === 'Complete' ? (
                                        <Badge className="bg-green-500 text-xs ml-2">{caseItem.care_plan_status}</Badge>
                                      ) : caseItem.care_plan_status === 'In Progress' ? (
                                        <Badge className="bg-blue-500 text-xs ml-2">{caseItem.care_plan_status}</Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-xs ml-2">{caseItem.care_plan_status}</Badge>
                                      )}
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                      <span className="text-muted-foreground font-medium">Active Flags:</span>
                                      <p className="mt-0.5">{caseItem.active_flags_count}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground font-medium">Last Check-in:</span>
                                      <p className="mt-0.5">
                                        {caseItem.last_checkin_date
                                          ? format(parseISO(caseItem.last_checkin_date), 'MMM d, yyyy')
                                          : 'Never'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/cases/${caseItem.id}`);
                                      }}
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      Open Case
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="flex-1 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/rn/case/${caseItem.id}/ten-vs`);
                                      }}
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      View/Edit Care Plan
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Case Health Overview */}
          <section className="mb-6">
            <RNCaseHealthOverview />
          </section>

          {/* Quality & Performance Metrics - Always Visible */}
          {metricsData && (
            <section className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#0f2a6a]">My Quality & Performance Metrics</CardTitle>
                  <CardDescription>
                    Your weekly and monthly performance vs. RCMS targets, plus compliance tracking.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {/* Performance Metrics */}
                    {[
                      { 
                        label: "Notes ≤ 24h", 
                        value: metricsData.metrics.my_performance.notes_24h, 
                        target: metricsData.metrics.targets.notes_24h,
                        weekChange: metricsData.metrics.trend.week_change.notes_24h,
                        monthChange: metricsData.metrics.trend.month_change.notes_24h,
                        type: "performance"
                      },
                      { 
                        label: "Follow-Up Calls", 
                        value: metricsData.metrics.my_performance.followup_calls, 
                        target: metricsData.metrics.targets.followup_calls,
                        weekChange: metricsData.metrics.trend.week_change.followup_calls,
                        monthChange: metricsData.metrics.trend.month_change.followup_calls,
                        type: "performance"
                      },
                      { 
                        label: "Med Reconciliation", 
                        value: metricsData.metrics.my_performance.med_reconciliation, 
                        target: metricsData.metrics.targets.med_reconciliation,
                        weekChange: metricsData.metrics.trend.week_change.med_reconciliation,
                        monthChange: metricsData.metrics.trend.month_change.med_reconciliation,
                        type: "performance"
                      },
                      { 
                        label: "Care Plans Current", 
                        value: metricsData.metrics.my_performance.care_plans_current, 
                        target: metricsData.metrics.targets.care_plans_current,
                        weekChange: metricsData.metrics.trend.week_change.care_plans_current,
                        monthChange: metricsData.metrics.trend.month_change.care_plans_current,
                        type: "performance"
                      },
                      // Compliance Metrics
                      {
                        label: "Required Fields",
                        value: 94,
                        target: 100,
                        weekChange: "+2%",
                        monthChange: "+5%",
                        type: "compliance"
                      },
                      {
                        label: "Care Plan Timeliness",
                        value: 88,
                        target: 95,
                        weekChange: "-1%",
                        monthChange: "+3%",
                        type: "compliance"
                      },
                      {
                        label: "Documentation Standards",
                        value: 96,
                        target: 98,
                        weekChange: "+1%",
                        monthChange: "+2%",
                        type: "compliance"
                      },
                      {
                        label: "Compliance Rate",
                        value: 92,
                        target: 95,
                        weekChange: "0%",
                        monthChange: "+4%",
                        type: "compliance"
                      },
                    ].map((m, i) => (
                      <div 
                        key={i} 
                        className="rounded-lg border border-border bg-card p-3 hover:shadow-md transition-all cursor-pointer relative group"
                        onClick={() => handleMetricClick(
                          `${m.type}_${m.label.toLowerCase().replace(/\s+/g, '_')}`,
                          m.label,
                          m.value,
                          m.target
                        )}
                      >
                        {hasNote(`${m.type}_${m.label.toLowerCase().replace(/\s+/g, '_')}`) && (
                          <div className="absolute top-2 right-2">
                            <StickyNote className="h-3 w-3 text-blue-600" />
                          </div>
                        )}
                        <div className="text-xs font-medium text-muted-foreground mb-1">{m.label}</div>
                        <div className="text-xl font-bold text-foreground mb-2">{m.value}%</div>
                        <div className="h-1.5 rounded bg-muted mb-2">
                          <div 
                            className={`h-1.5 rounded transition-all ${getColorClass(m.value, m.target)}`} 
                            style={{ width: `${m.value}%` }} 
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="text-muted-foreground">Target: {m.target}%</div>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(m.weekChange)}
                            <span>{m.weekChange}</span>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity pointer-events-none" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}


          {/* Tabbed Ribbon */}
          <Card className="mb-6">
            <Tabs defaultValue="overview" className="w-full" id="rn-dashboard-tabs">
              <CardHeader className="pb-3">
                <RNNavigationGuard>
                  {({ handleNavigation, hasIncompleteAlerts }) => (
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger 
                        value="overview"
                        onClick={(e) => handleNavigation(e)}
                      >
                        Overview
                      </TabsTrigger>
                      <TabsTrigger 
                        value="diary"
                        onClick={(e) => handleNavigation(e)}
                      >
                        My Diary
                      </TabsTrigger>
                      <TabsTrigger 
                        value="alerts"
                        onClick={(e) => handleNavigation(e)}
                      >
                        Alerts & Tasks
                        {hasIncompleteAlerts && (
                          <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                        )}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="documentation"
                        onClick={(e) => handleNavigation(e)}
                      >
                        Documentation Queue
                      </TabsTrigger>
                    </TabsList>
                  )}
                </RNNavigationGuard>
              </CardHeader>
              
              <CardContent>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-4">
                  {/* Work Queue - Cases ready for RN review */}
                  <div className="mt-4" data-work-queue id="work-queue">
                    <WorkQueue />
                  </div>

                  {/* Compliance - Second Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <RNComplianceAlerts />
                  </div>

                  {/* Supervisor Metrics - Third Row (Only for supervisors) */}
                  {isSupervisor && (
                    <div className="grid grid-cols-1 gap-4">
                      <RNEngagementMetrics />
                    </div>
                  )}

                  {/* Time Stats Widget */}
                  <div className="grid grid-cols-1 gap-4">
                    <RNTimeStatsWidget />
                  </div>
                </TabsContent>

                {/* My Diary - Upcoming Schedule Tab */}
                <TabsContent value="diary" className="mt-0">
                  {upcomingDiaryEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No upcoming appointments or calls</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingDiaryEntries.map((entry) => (
                        <div key={entry.id} className="flex items-start gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition">
                          <div className="text-center min-w-[60px]">
                            <div className="text-sm font-semibold">{format(new Date(entry.scheduled_date), "MMM d")}</div>
                            {entry.scheduled_time && (
                              <div className="text-xs text-muted-foreground">
                                {entry.scheduled_time.slice(0, 5)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{entry.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {entry.entry_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              {entry.location && ` • ${entry.location}`}
                            </div>
                            {entry.description && (
                              <div className="text-xs text-muted-foreground mt-1">{entry.description}</div>
                            )}
                          </div>
                          <Badge variant={entry.status === "scheduled" ? "secondary" : "default"}>
                            {entry.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Alerts & Tasks Tab */}
                <TabsContent value="alerts" className="mt-0">
                  {metricsData && metricsData.metrics.alerts.length > 0 ? (
                    <div className="space-y-2">
                      {metricsData.metrics.alerts.map((alert: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition"
                        >
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <div>
                              <div className="font-semibold text-sm">{alert.type}</div>
                              <div className="text-xs text-muted-foreground">{alert.case_id}</div>
                            </div>
                          </div>
                          <Badge variant={alert.priority === "high" ? "destructive" : "secondary"}>
                            {alert.days_overdue} day{alert.days_overdue > 1 ? 's' : ''} overdue
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No alerts at this time</p>
                  )}
                </TabsContent>

                {/* Documentation Queue Tab */}
                <TabsContent value="documentation" className="mt-0">
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">Care Plan - Sarah M.</h4>
                          <p className="text-sm text-muted-foreground">RCMS-2024-001</p>
                        </div>
                        <Badge className="bg-yellow-500 hover:bg-yellow-600">Unsigned</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Care plan needs final review and signature
                      </p>
                      <Button size="sm">Review & Sign</Button>
                    </div>

                    <div className="p-4 rounded-lg border border-orange-200 bg-orange-50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">Assessment Notes - John D.</h4>
                          <p className="text-sm text-muted-foreground">RCMS-2024-002</p>
                        </div>
                        <Badge className="bg-orange-500 hover:bg-orange-600">Incomplete</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Missing required fields: Risk assessment, Care coordination notes
                      </p>
                      <Button size="sm">Complete Assessment</Button>
                    </div>

                    <div className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">Progress Note - Maria G.</h4>
                          <p className="text-sm text-muted-foreground">RCMS-2024-003</p>
                        </div>
                        <Badge variant="outline">Draft</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Draft saved 2 hours ago, needs final review
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Continue Editing</Button>
                        <Button size="sm">Finalize</Button>
                      </div>
                    </div>
                  </div>

                  {pendingAssessments.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                      <p className="text-muted-foreground">All documentation is up to date!</p>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

        {/* Bottom Cards - Keep only specified cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isSupervisor && (
            <Link
              to="/rn-supervisor-dashboard"
              className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-[#0f2a6a]/10 text-[#0f2a6a] group-hover:bg-[#0f2a6a] group-hover:text-white transition">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">Team Dashboard</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Monitor team performance, manage assignments, and review quality metrics.
                  </p>
                  <Badge className="mt-3" variant="secondary">Supervisor View</Badge>
                </div>
              </div>
            </Link>
          )}

          {/* Education Materials */}
          <Link
            to="/rn/education-library"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Education Materials</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Access client education resources, videos, and interactive materials.
                </p>
                <Badge className="mt-3" variant="secondary">Resource Library</Badge>
              </div>
            </div>
          </Link>

          {/* Voice Documentation */}
          <Link
            to="/rn/voice-documentation"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-pink-100 text-pink-700 group-hover:bg-pink-600 group-hover:text-white transition">
                <Mic className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Voice Documentation</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Dictate notes with voice-to-text and AI-powered documentation assistance.
                </p>
                <Badge className="mt-3" variant="secondary">AI-Enhanced</Badge>
              </div>
            </div>
          </Link>

          {/* Resources - moved from top action bar */}
          <div
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group cursor-pointer"
            onClick={() => {
              // Trigger the resources dialog from RNQuickActionsBar
              if ((window as any).openRNResourcesDialog) {
                (window as any).openRNResourcesDialog();
              }
            }}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Resources</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Quick access to guides, training materials, and best practices.
                </p>
                <Badge className="mt-3" variant="secondary">Resource Library</Badge>
              </div>
            </div>
          </div>

          {/* Log Activity - moved from top action bar */}
          <Link
            to="/rn-clinical-liaison"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-green-100 text-green-700 group-hover:bg-green-600 group-hover:text-white transition">
                <Activity className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Log Activity</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Record clinical activities, notes, and case updates.
                </p>
                <Badge className="mt-3" variant="secondary">Activity Tracking</Badge>
              </div>
            </div>
          </Link>
        </div>

        {/* Performance & Satisfaction Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RNTeamPerformance />
          <RNClientSatisfaction />
        </div>

        {/* Settings & Profile */}
        <div>
          <h2 className="text-xl font-bold text-[#0f2a6a] mb-4">Settings & Profile</h2>
          <Link
            to="/rn/settings"
            className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition group inline-flex items-start gap-3 w-full md:w-auto"
          >
            <div className="p-2 rounded-lg bg-gray-100 text-gray-700 group-hover:bg-gray-600 group-hover:text-white transition">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">RN Settings</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Update profile, availability, communication preferences, and security settings.
              </p>
            </div>
          </Link>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}
