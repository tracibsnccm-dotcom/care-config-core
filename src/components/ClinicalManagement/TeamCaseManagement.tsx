import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CaseReassignmentDialog } from "./CaseReassignmentDialog";
import { Search, RefreshCw, UserX } from "lucide-react";
import { toast } from "sonner";

interface TeamCase {
  case_id: string;
  client_label: string;
  status: string;
  rn_id: string;
  rn_name: string;
  assigned_at: string;
  last_activity: string;
}

interface RNTeamMember {
  user_id: string;
  display_name: string;
  current_caseload: number;
}

export function TeamCaseManagement() {
  const { user } = useAuth();
  const [cases, setCases] = useState<TeamCase[]>([]);
  const [teamMembers, setTeamMembers] = useState<RNTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<TeamCase | null>(null);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);

  const fetchTeamCases = async () => {
    setLoading(true);
    try {
      // Fetch team members first
      const { data: teamData, error: teamError } = await supabase
        .from("rn_team_members")
        .select(`
          rn_user_id,
          profiles!rn_team_members_rn_user_id_fkey(user_id, display_name)
        `)
        .eq("team_id", user?.id); // Assuming supervisor's user_id is team_id

      if (teamError) throw teamError;

      // Get team member IDs
      const memberIds = teamData?.map(m => m.rn_user_id) || [];

      // Fetch cases for team members
      const { data: casesData, error: casesError } = await supabase
        .from("case_assignments")
        .select(`
          case_id,
          user_id,
          cases!inner(id, client_label, status),
          profiles!case_assignments_user_id_fkey(display_name)
        `)
        .in("user_id", memberIds)
        .eq("role", "RN_CCM");

      if (casesError) throw casesError;

      const formattedCases = casesData?.map((c: any) => ({
        case_id: c.case_id,
        client_label: c.cases.client_label,
        status: c.cases.status,
        rn_id: c.user_id,
        rn_name: c.profiles?.display_name || "Unknown",
        assigned_at: c.created_at || "",
        last_activity: c.updated_at || ""
      })) || [];

      setCases(formattedCases);

      // Calculate caseloads
      const caseloadMap = new Map<string, number>();
      formattedCases.forEach(c => {
        caseloadMap.set(c.rn_id, (caseloadMap.get(c.rn_id) || 0) + 1);
      });

      const members = teamData?.map((m: any) => ({
        user_id: m.rn_user_id,
        display_name: m.profiles?.display_name || "Unknown",
        current_caseload: caseloadMap.get(m.rn_user_id) || 0
      })) || [];

      setTeamMembers(members);
    } catch (error: any) {
      console.error("Error fetching team cases:", error);
      toast.error("Failed to load team cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamCases();
  }, [user?.id]);

  const filteredCases = cases.filter(c =>
    c.client_label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.rn_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReassignClick = (caseItem: TeamCase) => {
    setSelectedCase(caseItem);
    setReassignDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cases or team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon" onClick={fetchTeamCases} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid gap-3">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading cases...</p>
        ) : filteredCases.length === 0 ? (
          <Card className="p-8 text-center">
            <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No cases found</p>
          </Card>
        ) : (
          filteredCases.map((caseItem) => (
            <Card key={caseItem.case_id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{caseItem.client_label}</h3>
                    <Badge variant="outline">{caseItem.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Assigned to: {caseItem.rn_name}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReassignClick(caseItem)}
                >
                  Reassign
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {selectedCase && (
        <CaseReassignmentDialog
          open={reassignDialogOpen}
          onOpenChange={setReassignDialogOpen}
          caseId={selectedCase.case_id}
          currentRNId={selectedCase.rn_id}
          currentRNName={selectedCase.rn_name}
          clientLabel={selectedCase.client_label}
          teamMembers={teamMembers}
          onReassignSuccess={fetchTeamCases}
        />
      )}
    </div>
  );
}
