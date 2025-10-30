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
import { MessageCircle, UserCircle, FileText, FileCheck, Calendar, AlertTriangle } from "lucide-react";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageThread } from "@/components/RNClinicalLiaison/MessageThread";
import { ProviderContactRequestForm } from "@/components/RNClinicalLiaison/ProviderContactRequestForm";
import { FollowUpTracker } from "@/components/RNClinicalLiaison/FollowUpTracker";
import { format } from "date-fns";

export default function RNClinicalLiaison() {
  const { user } = useAuth();
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [cases, setCases] = useState<any[]>([]);
  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [rnCmInfo, setRnCmInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

        // Get RN CM assignment
        const { data: rnAssignment, error: rnError } = await supabase
          .from("case_assignments")
          .select(
            `
            user_id,
            profiles (
              display_name,
              email,
              full_name
            )
          `
          )
          .eq("case_id", selectedCaseId)
          .eq("role", "RN_CCM")
          .single();

        if (!rnError && rnAssignment) {
          setRnCmInfo(rnAssignment.profiles);
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
    if (!selectedCaseId) return;
    toast.success("Clinical narrative report requested");
    // TODO: Create request in database
  };

  const handleScheduleReview = async () => {
    if (!selectedCaseId) return;
    toast.success("Case review scheduled");
    // TODO: Create calendar event
  };

  const handleReportConcern = async () => {
    if (!selectedCaseId) return;
    toast.success("Urgent concern reported to RN CM");
    // TODO: Send urgent notification
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            RN CM / Clinical Liaison
          </h1>
          <p className="text-muted-foreground">
            Secure communication and coordination with RN Case Manager
          </p>
        </div>

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
                      {caseDetails.client_label || "J.D."}
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
                      {caseDetails.status || "Active"}
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

              {/* Assigned RN CM */}
              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: "#128f8b10" }}>
                <div className="p-2 rounded-lg" style={{ backgroundColor: "#128f8b" }}>
                  <UserCircle className="w-5 h-5" style={{ color: "#ffffff" }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assigned RN CM</p>
                  <p className="font-semibold text-foreground">
                    {rnCmInfo?.display_name || rnCmInfo?.full_name || "M. Garcia, RN, CCM"}
                  </p>
                  {rnCmInfo && (
                    <p className="text-xs text-muted-foreground">{rnCmInfo.email}</p>
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

        {/* Main Content Tabs */}
        {selectedCaseId ? (
          <Tabs defaultValue="messages" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="messages">Message Thread</TabsTrigger>
              <TabsTrigger value="provider-requests">Provider Contacts</TabsTrigger>
              <TabsTrigger value="follow-ups">Follow-Up Tracker</TabsTrigger>
            </TabsList>

            <TabsContent value="messages">
              <MessageThread caseId={selectedCaseId} />
            </TabsContent>

            <TabsContent value="provider-requests">
              <ProviderContactRequestForm caseId={selectedCaseId} />
            </TabsContent>

            <TabsContent value="follow-ups">
              <FollowUpTracker caseId={selectedCaseId} />
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="p-12 text-center rounded-2xl">
            <p className="text-muted-foreground">Select a case to begin communication</p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
