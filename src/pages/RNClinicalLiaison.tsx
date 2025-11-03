import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, UserCircle, FileText, FileCheck, Calendar, AlertTriangle, Activity, Info, Shield, TrendingUp, ClipboardList, Heart, Clock, DollarSign, FileStack, Users, Video, Target, ShieldCheck, Award, Star, GitCompare, Syringe, Scale } from "lucide-react";
import { SensitiveDataAuditView } from "@/components/SensitiveDataAuditView";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageThread } from "@/components/RNClinicalLiaison/MessageThread";
import { FollowUpTracker } from "@/components/RNClinicalLiaison/FollowUpTracker";
import { ProviderContactRequestForm } from "@/components/RNClinicalLiaison/ProviderContactRequestForm";
import { ActivityTimeline } from "@/components/RNClinicalLiaison/ActivityTimeline";
import { MetricsDashboard } from "@/components/RNClinicalLiaison/MetricsDashboard";
import { ClinicalOverview } from "@/components/RNClinicalLiaison/ClinicalOverview";
import { ClinicalAlertsPanel } from "@/components/RNClinicalLiaison/ClinicalAlertsPanel";
import CareCoordinationDashboard from "@/components/RNClinicalLiaison/CareCoordinationDashboard";
import DocumentationRequestsTracker from "@/components/RNClinicalLiaison/DocumentationRequestsTracker";
import TreatmentTimeline from "@/components/RNClinicalLiaison/TreatmentTimeline";
import MedicalBillingCoordination from "@/components/RNClinicalLiaison/MedicalBillingCoordination";
import ClinicalNotesRepository from "@/components/RNClinicalLiaison/ClinicalNotesRepository";
import AppointmentTracking from "@/components/RNClinicalLiaison/AppointmentTracking";
import ProviderNetwork from "@/components/RNClinicalLiaison/ProviderNetwork";
import TelehealthIntegration from "@/components/RNClinicalLiaison/TelehealthIntegration";
import ODGComplianceTracker from "@/components/RNClinicalLiaison/ODGComplianceTracker";
import InsuranceAuthTracking from "@/components/RNClinicalLiaison/InsuranceAuthTracking";
import ICD10CodeTracker from "@/components/RNClinicalLiaison/ICD10CodeTracker";
import CPTCodeTracker from "@/components/RNClinicalLiaison/CPTCodeTracker";
import CarePlanComparison from "@/components/RNClinicalLiaison/CarePlanComparison";
import RNPerformanceMetrics from "@/components/RNClinicalLiaison/RNPerformanceMetrics";
import ClientSatisfactionFeedback from "@/components/RNClinicalLiaison/ClientSatisfactionFeedback";
import AdultImmunizationTracker from "@/components/RNClinicalLiaison/AdultImmunizationTracker";
import PreventiveCareTracker from "@/components/RNClinicalLiaison/PreventiveCareTracker";
import BiometricsTracker from "@/components/RNClinicalLiaison/BiometricsTracker";
import { useUserPresence } from "@/hooks/useUserPresence";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function RNClinicalLiaison() {
  const { user } = useAuth();
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [cases, setCases] = useState<any[]>([]);
  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [rnCmInfo, setRnCmInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Track RN CM presence
  const { isTargetOnline, lastSeen } = useUserPresence(rnCmInfo?.user_id);

  // Fetch attorney's cases
  useEffect(() => {
    if (!user?.id) return;

    const fetchCases = async () => {
      try {
        const { data, error } = await supabase
          .from("case_assignments")
          .select(
            `
            case_id,
            cases (
              id,
              client_label,
              status,
              created_at
            )
          `
          )
          .eq("user_id", user.id)
          .eq("role", "ATTORNEY");

        if (error) throw error;

        const casesData = data
          .map((item: any) => item.cases)
          .filter(Boolean)
          .sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

        setCases(casesData);
        if (casesData.length > 0) {
          setSelectedCaseId(casesData[0].id);
        }
      } catch (error: any) {
        console.error("Error fetching cases:", error);
        toast.error("Failed to load cases");
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [user?.id]);

  // Fetch case details and RN CM info when case is selected
  useEffect(() => {
    if (!selectedCaseId) return;

    const fetchCaseDetails = async () => {
      try {
        // Get case details
        const { data: caseData, error: caseError } = await supabase
          .from("cases")
          .select("*")
          .eq("id", selectedCaseId)
          .single();

        if (caseError) throw caseError;
        setCaseDetails(caseData);

        // Get RN CM assignment and store user_id with profile
        const { data: rnAssignment, error: rnError } = await supabase
          .from("case_assignments")
          .select("user_id")
          .eq("case_id", selectedCaseId)
          .eq("role", "RN_CCM")
          .single();

        if (!rnError && rnAssignment) {
          // Fetch profile data separately
          const { data: profileData } = await supabase
            .from("profiles")
            .select("display_name, email, full_name")
            .eq("user_id", rnAssignment.user_id)
            .single();

          if (profileData) {
            setRnCmInfo({
              user_id: rnAssignment.user_id,
              ...profileData,
            });
          } else {
            setRnCmInfo({ user_id: rnAssignment.user_id });
          }
        } else {
          setRnCmInfo(null);
        }
      } catch (error: any) {
        console.error("Error fetching case details:", error);
      }
    };

    fetchCaseDetails();
  }, [selectedCaseId]);

  // Get last communication date
  const [lastCommunication, setLastCommunication] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedCaseId) return;

    const fetchLastCommunication = async () => {
      const { data, error } = await supabase
        .from("attorney_rn_messages")
        .select("created_at")
        .eq("case_id", selectedCaseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setLastCommunication(format(new Date(data.created_at), "MMM d, yyyy"));
      }
    };

    fetchLastCommunication();
  }, [selectedCaseId]);

  // Quick action handlers
  const handleRequestNarrative = async () => {
    if (!selectedCaseId || !user?.id) return;
    
    try {
      // Create a task for the narrative report request
      const { error } = await supabase.from("case_tasks").insert({
        case_id: selectedCaseId,
        title: "Clinical Narrative Report Requested",
        description: "Attorney requested a clinical narrative report for case review",
        status: "pending",
        assigned_to: rnCmInfo?.user_id || null,
        created_by: user.id,
      });

      if (error) throw error;

      // Notify RN CM
      if (rnCmInfo?.user_id) {
        await supabase.rpc('notify_user', {
          target_user_id: rnCmInfo.user_id,
          notification_title: 'Narrative Report Requested',
          notification_message: `Attorney requested a clinical narrative report for case ${selectedCaseId.slice(0, 8).toUpperCase()}`,
          notification_type: 'info',
          notification_link: `/case-detail/${selectedCaseId}`,
          notification_metadata: { case_id: selectedCaseId, source: 'rn_liaison' }
        });
      }

      toast.success("Clinical narrative report requested successfully");
    } catch (error: any) {
      console.error("Error requesting narrative:", error);
      toast.error("Failed to create request");
    }
  };

  const handleScheduleReview = async () => {
    if (!selectedCaseId || !user?.id) return;
    
    try {
      // Create a task for scheduling the review
      const { error } = await supabase.from("case_tasks").insert({
        case_id: selectedCaseId,
        title: "Case Review Scheduled",
        description: "Attorney requested to schedule a case review meeting",
        status: "pending",
        assigned_to: rnCmInfo?.user_id || null,
        created_by: user.id,
      });

      if (error) throw error;

      // Notify RN CM
      if (rnCmInfo?.user_id) {
        await supabase.rpc('notify_user', {
          target_user_id: rnCmInfo.user_id,
          notification_title: 'Case Review Requested',
          notification_message: `Attorney requested to schedule a case review for ${selectedCaseId.slice(0, 8).toUpperCase()}`,
          notification_type: 'info',
          notification_link: `/case-detail/${selectedCaseId}`,
          notification_metadata: { case_id: selectedCaseId, source: 'rn_liaison' }
        });
      }

      toast.success("Case review request sent successfully");
    } catch (error: any) {
      console.error("Error scheduling review:", error);
      toast.error("Failed to create request");
    }
  };

  const handleReportConcern = async () => {
    if (!selectedCaseId || !user?.id) return;
    
    try {
      // Create an urgent task
      const { error } = await supabase.from("case_tasks").insert({
        case_id: selectedCaseId,
        title: "🚨 URGENT: Concern Reported",
        description: "Attorney reported an urgent concern requiring immediate RN CM attention",
        status: "pending",
        assigned_to: rnCmInfo?.user_id || null,
        created_by: user.id,
      });

      if (error) throw error;

      // Send urgent notification
      if (rnCmInfo?.user_id) {
        await supabase.rpc('notify_user', {
          target_user_id: rnCmInfo.user_id,
          notification_title: '🚨 URGENT CONCERN',
          notification_message: `Attorney reported an urgent concern for case ${selectedCaseId.slice(0, 8).toUpperCase()}. Immediate attention required.`,
          notification_type: 'alert',
          notification_link: `/case-detail/${selectedCaseId}`,
          notification_metadata: { case_id: selectedCaseId, source: 'rn_liaison', urgent: true }
        });
      }

      toast.success("Urgent concern reported - RN CM notified immediately");
    } catch (error: any) {
      console.error("Error reporting concern:", error);
      toast.error("Failed to report concern");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            RN CM / Clinical Liaison
          </h1>
          <p className="text-muted-foreground">
            Secure communication and coordination with RN Case Manager
          </p>
        </div>

        {/* Metrics Dashboard */}
        {selectedCaseId && (
          <div className="mb-6">
            <MetricsDashboard caseId={selectedCaseId} />
          </div>
        )}

        {/* Case Selector */}
        <Card className="p-6 mb-6 border-2 rounded-2xl shadow-lg">
          <div className="max-w-md">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Select Case
            </label>
            <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a case" />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.client_label || `Case ${c.id.slice(0, 8)}`} - {c.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Case Summary Card */}
        {selectedCaseId && (
          <Card className="p-6 mb-6 border-2 rounded-2xl shadow-lg bg-gradient-to-br from-card to-muted/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Case Summary</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/cases/${selectedCaseId}`, "_blank")}
                  style={{ color: "#128f8b", borderColor: "#128f8b" }}
                >
                  View Full Details →
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Client Info */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: "#0f2a6a20" }}>
                    <UserCircle className="w-5 h-5" style={{ color: "#0f2a6a" }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Client</p>
                    <p className="font-semibold text-foreground">
                      {caseDetails?.client_label || "J.D."}
                    </p>
                  </div>
                </div>

                {/* Case Status */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: "#b0983720" }}>
                    <FileText className="w-5 h-5" style={{ color: "#b09837" }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-semibold text-foreground">
                      {caseDetails?.status || "Active"}
                    </p>
                  </div>
                </div>

                {/* Last Update */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: "#128f8b20" }}>
                    <MessageCircle className="w-5 h-5" style={{ color: "#128f8b" }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Update</p>
                    <p className="font-semibold text-foreground">
                      {lastCommunication || format(new Date(), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Assigned RN CM with Presence */}
              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: "#128f8b10" }}>
                <div className="relative">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: "#128f8b" }}>
                    <UserCircle className="w-5 h-5" style={{ color: "#ffffff" }} />
                  </div>
                  {/* Online Status Indicator */}
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                    style={{
                      backgroundColor: isTargetOnline ? "#22c55e" : "#94a3b8",
                    }}
                    title={isTargetOnline ? "Online" : "Offline"}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">Assigned RN CM</p>
                    <Badge
                      variant="secondary"
                      className="text-xs px-1.5 py-0"
                      style={{
                        backgroundColor: isTargetOnline ? "#22c55e20" : "#94a3b820",
                        color: isTargetOnline ? "#22c55e" : "#94a3b8",
                        border: "none",
                      }}
                    >
                      {isTargetOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  <p className="font-semibold text-foreground">
                    {rnCmInfo?.display_name || rnCmInfo?.full_name || "M. Garcia, RN, CCM"}
                  </p>
                  {rnCmInfo && (
                    <p className="text-xs text-muted-foreground">{rnCmInfo.email}</p>
                  )}
                  {!isTargetOnline && lastSeen && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last seen: {format(new Date(lastSeen), "MMM d, h:mm a")}
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="pt-2">
                <p className="text-sm font-medium text-foreground mb-3">Quick Actions</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    onClick={handleRequestNarrative}
                    variant="outline"
                    className="w-full justify-start gap-2"
                    style={{ borderColor: "#0f2a6a", color: "#0f2a6a" }}
                  >
                    <FileCheck className="w-4 h-4" />
                    Request Clinical Narrative Report
                  </Button>
                  <Button
                    onClick={handleScheduleReview}
                    variant="outline"
                    className="w-full justify-start gap-2"
                    style={{ borderColor: "#128f8b", color: "#128f8b" }}
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule Case Review
                  </Button>
                  <Button
                    onClick={handleReportConcern}
                    variant="outline"
                    className="w-full justify-start gap-2"
                    style={{ borderColor: "#dc2626", color: "#dc2626" }}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Report Urgent Concern
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Main Content - Two Column Layout */}
        {selectedCaseId ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Clinical Alerts Panel */}
              <ClinicalAlertsPanel caseId={selectedCaseId} />
              <Tabs defaultValue="messages" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-10 xl:grid-cols-21 mb-6 h-auto flex-wrap gap-1">
                  <TabsTrigger value="messages" className="flex items-center gap-1 text-xs">
                    <MessageCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">Messages</span>
                  </TabsTrigger>
                  <TabsTrigger value="followups" className="flex items-center gap-1 text-xs">
                    <FileCheck className="w-3 h-3" />
                    <span className="hidden sm:inline">Follow-ups</span>
                  </TabsTrigger>
                  <TabsTrigger value="coordination" className="flex items-center gap-1 text-xs">
                    <TrendingUp className="w-3 h-3" />
                    <span className="hidden sm:inline">Coordination</span>
                  </TabsTrigger>
                  <TabsTrigger value="documentation" className="flex items-center gap-1 text-xs">
                    <ClipboardList className="w-3 h-3" />
                    <span className="hidden sm:inline">Docs Requests</span>
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="flex items-center gap-1 text-xs">
                    <Heart className="w-3 h-3" />
                    <span className="hidden sm:inline">Timeline</span>
                  </TabsTrigger>
                  <TabsTrigger value="billing" className="flex items-center gap-1 text-xs">
                    <DollarSign className="w-3 h-3" />
                    <span className="hidden sm:inline">Billing</span>
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="flex items-center gap-1 text-xs">
                    <FileStack className="w-3 h-3" />
                    <span className="hidden sm:inline">Notes</span>
                  </TabsTrigger>
                  <TabsTrigger value="appointments" className="flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3" />
                    <span className="hidden sm:inline">Appointments</span>
                  </TabsTrigger>
                  <TabsTrigger value="network" className="flex items-center gap-1 text-xs">
                    <Users className="w-3 h-3" />
                    <span className="hidden sm:inline">Network</span>
                  </TabsTrigger>
                  <TabsTrigger value="telehealth" className="flex items-center gap-1 text-xs">
                    <Video className="w-3 h-3" />
                    <span className="hidden sm:inline">Telehealth</span>
                  </TabsTrigger>
                  <TabsTrigger value="odg" className="flex items-center gap-1 text-xs">
                    <Target className="w-3 h-3" />
                    <span className="hidden sm:inline">ODG</span>
                  </TabsTrigger>
                  <TabsTrigger value="auth" className="flex items-center gap-1 text-xs">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="hidden sm:inline">Auth</span>
                  </TabsTrigger>
                  <TabsTrigger value="icd10" className="flex items-center gap-1 text-xs">
                    <FileText className="w-3 h-3" />
                    <span className="hidden sm:inline">ICD-10</span>
                  </TabsTrigger>
                  <TabsTrigger value="cpt" className="flex items-center gap-1 text-xs">
                    <DollarSign className="w-3 h-3" />
                    <span className="hidden sm:inline">CPT</span>
                  </TabsTrigger>
                  <TabsTrigger value="care-plans" className="flex items-center gap-1 text-xs">
                    <GitCompare className="w-3 h-3" />
                    <span className="hidden sm:inline">Plans</span>
                  </TabsTrigger>
                  <TabsTrigger value="rn-metrics" className="flex items-center gap-1 text-xs">
                    <Award className="w-3 h-3" />
                    <span className="hidden sm:inline">RN Metrics</span>
                  </TabsTrigger>
                  <TabsTrigger value="satisfaction" className="flex items-center gap-1 text-xs">
                    <Star className="w-3 h-3" />
                    <span className="hidden sm:inline">Satisfaction</span>
                  </TabsTrigger>
                  <TabsTrigger value="immunizations" className="flex items-center gap-1 text-xs">
                    <Syringe className="w-3 h-3" />
                    <span className="hidden sm:inline">Immunizations</span>
                  </TabsTrigger>
                  <TabsTrigger value="preventive" className="flex items-center gap-1 text-xs">
                    <Activity className="w-3 h-3" />
                    <span className="hidden sm:inline">Preventive</span>
                  </TabsTrigger>
                  <TabsTrigger value="biometrics" className="flex items-center gap-1 text-xs">
                    <Scale className="w-3 h-3" />
                    <span className="hidden sm:inline">Biometrics</span>
                  </TabsTrigger>
                  <TabsTrigger value="providers" className="flex items-center gap-1 text-xs">
                    <UserCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">Provider Contacts</span>
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex items-center gap-1 text-xs">
                    <Activity className="w-3 h-3" />
                    <span className="hidden sm:inline">Activity</span>
                  </TabsTrigger>
                  <TabsTrigger value="sensitive-audit" className="flex items-center gap-1 text-xs">
                    <Shield className="w-3 h-3" />
                    <span className="hidden sm:inline">Sensitive</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="messages">
                  <MessageThread caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="followups">
                  <FollowUpTracker caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="coordination">
                  <CareCoordinationDashboard caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="documentation">
                  <DocumentationRequestsTracker caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="timeline">
                  <TreatmentTimeline caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="billing">
                  <MedicalBillingCoordination caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="notes">
                  <ClinicalNotesRepository caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="appointments">
                  <AppointmentTracking caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="network">
                  <ProviderNetwork caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="telehealth">
                  <TelehealthIntegration caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="odg">
                  <ODGComplianceTracker caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="auth">
                  <InsuranceAuthTracking caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="icd10">
                  <ICD10CodeTracker caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="cpt">
                  <CPTCodeTracker caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="care-plans">
                  <CarePlanComparison caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="rn-metrics">
                  <RNPerformanceMetrics caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="satisfaction">
                  <ClientSatisfactionFeedback caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="immunizations">
                  <AdultImmunizationTracker caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="preventive">
                  <PreventiveCareTracker caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="biometrics">
                  <BiometricsTracker caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="providers">
                  <ProviderContactRequestForm caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="activity">
                  <ActivityTimeline caseId={selectedCaseId} />
                </TabsContent>

                <TabsContent value="sensitive-audit">
                  <SensitiveDataAuditView caseId={selectedCaseId} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - Clinical Overview */}
            <div className="lg:col-span-1">
              <ClinicalOverview caseId={selectedCaseId} />
            </div>
          </div>
        ) : (
          <Card className="p-12 text-center rounded-2xl">
            <p className="text-muted-foreground">Select a case to begin communication</p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
