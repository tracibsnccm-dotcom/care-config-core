import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Plus, X, UserPlus } from "lucide-react";

interface Team {
  id: string;
  team_name: string;
  supervisor_id: string;
  created_at: string;
  member_count?: number;
}

interface TeamMember {
  id: string;
  team_id: string;
  rn_user_id: string;
  added_at: string;
  rn_profile?: {
    display_name: string;
    email: string;
  };
}

interface AvailableRN {
  user_id: string;
  display_name: string;
  email: string;
}

export function RNTeamManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [availableRNs, setAvailableRNs] = useState<AvailableRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedRN, setSelectedRN] = useState("");

  useEffect(() => {
    fetchTeams();
    fetchAvailableRNs();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam);
    }
  }, [selectedTeam]);

  async function fetchTeams() {
    try {
      const { data, error } = await supabase
        .from("rn_teams")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get member counts
      const teamsWithCounts = await Promise.all(
        (data || []).map(async (team) => {
          const { count } = await supabase
            .from("rn_team_members")
            .select("*", { count: "exact", head: true })
            .eq("team_id", team.id);

          return { ...team, member_count: count || 0 };
        })
      );

      setTeams(teamsWithCounts);
      if (teamsWithCounts.length > 0 && !selectedTeam) {
        setSelectedTeam(teamsWithCounts[0].id);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeamMembers(teamId: string) {
    try {
      const { data, error } = await supabase
        .from("rn_team_members")
        .select("*, rn_profile:profiles!rn_team_members_rn_user_id_fkey(display_name, email)")
        .eq("team_id", teamId)
        .order("added_at", { ascending: true });

      if (error) throw error;
      
      setTeamMembers((data || []) as any);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  }

  async function fetchAvailableRNs() {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, profiles!user_roles_user_id_fkey(display_name, email)")
        .eq("role", "RN_CCM");

      if (error) throw error;

      const rns = (data || [])
        .filter((r: any) => r.profiles)
        .map((r: any) => ({
          user_id: r.user_id,
          display_name: r.profiles.display_name || "Unknown",
          email: r.profiles.email || ""
        }));

      setAvailableRNs(rns);
    } catch (error) {
      console.error("Error fetching RNs:", error);
    }
  }

  async function handleCreateTeam() {
    if (!newTeamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("rn_teams")
        .insert([{
          team_name: newTeamName,
          supervisor_id: user.id
        }]);

      if (error) throw error;

      toast.success("Team created successfully");
      setNewTeamName("");
      setCreateDialogOpen(false);
      fetchTeams();
    } catch (error: any) {
      console.error("Error creating team:", error);
      toast.error(error.message || "Failed to create team");
    }
  }

  async function handleAddMember() {
    if (!selectedRN || !selectedTeam) {
      toast.error("Please select an RN to add");
      return;
    }

    // Check if already a member
    if (teamMembers.some(m => m.rn_user_id === selectedRN)) {
      toast.error("This RN is already a team member");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("rn_team_members")
        .insert([{
          team_id: selectedTeam,
          rn_user_id: selectedRN,
          added_by: user.id
        }]);

      if (error) throw error;

      toast.success("Team member added");
      setSelectedRN("");
      setAddMemberDialogOpen(false);
      fetchTeamMembers(selectedTeam);
      fetchTeams();
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast.error(error.message || "Failed to add team member");
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Remove this team member?")) return;

    try {
      const { error } = await supabase
        .from("rn_team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Team member removed");
      if (selectedTeam) {
        fetchTeamMembers(selectedTeam);
        fetchTeams();
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove team member");
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading teams...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Management
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Selector */}
          {teams.length > 0 ? (
            <div>
              <Label>Select Team</Label>
              <Select value={selectedTeam || ""} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.team_name} ({team.member_count || 0} members)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No teams created yet</p>
              <p className="text-sm">Create your first team to start managing RN assignments</p>
            </div>
          )}

          {/* Team Members */}
          {selectedTeam && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Team Members</h3>
                <Button onClick={() => setAddMemberDialogOpen(true)} size="sm" variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>

              {teamMembers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                  <p>No team members yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{member.rn_profile?.display_name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{member.rn_profile?.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g., East Coast Team"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam}>
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="select-rn">Select RN *</Label>
              <Select value={selectedRN} onValueChange={setSelectedRN}>
                <SelectTrigger id="select-rn">
                  <SelectValue placeholder="Select an RN" />
                </SelectTrigger>
                <SelectContent>
                  {availableRNs
                    .filter(rn => !teamMembers.some(m => m.rn_user_id === rn.user_id))
                    .map((rn) => (
                      <SelectItem key={rn.user_id} value={rn.user_id}>
                        {rn.display_name} ({rn.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember}>
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
