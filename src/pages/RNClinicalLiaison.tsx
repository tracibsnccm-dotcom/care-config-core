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
import { MessageCircle, UserCircle, FileText, Download } from "lucide-react";
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

  const handleExportLog = async () => {
    toast.info("Export functionality will be implemented with PDF generation");
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

        {/* Case Context Header */}
        <Card className="p-6 mb-6 border-2 rounded-2xl shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-md">
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

              <Button variant="outline" onClick={handleExportLog}>
                <Download className="w-4 h-4 mr-2" />
                Export Communication Log
              </Button>
            </div>

            {selectedCaseId && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* RN CM Info */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: "#128f8b20" }}>
                      <UserCircle className="w-5 h-5" style={{ color: "#128f8b" }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">RN Case Manager</p>
                      <p className="font-semibold text-foreground">
                        {rnCmInfo?.display_name || rnCmInfo?.full_name || "Not Assigned"}
                      </p>
                      {rnCmInfo && (
                        <p className="text-xs text-muted-foreground">{rnCmInfo.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Case Status */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: "#b0983720" }}>
                      <FileText className="w-5 h-5" style={{ color: "#b09837" }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Case Status</p>
                      <p className="font-semibold text-foreground">
                        {caseDetails?.status || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Last Communication */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: "#0f2a6a20" }}>
                      <MessageCircle className="w-5 h-5" style={{ color: "#0f2a6a" }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last Communication</p>
                      <p className="font-semibold text-foreground">
                        {lastCommunication || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  style={{ color: "#128f8b" }}
                  onClick={() => window.open(`/cases/${selectedCaseId}`, "_blank")}
                >
                  View Full Case Summary →
                </Button>
              </>
            )}
          </div>
        </Card>

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
