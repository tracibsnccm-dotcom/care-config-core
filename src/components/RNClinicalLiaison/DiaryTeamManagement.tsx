import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, UserPlus, Trash2 } from "lucide-react";

export function DiaryTeamManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: teams, isLoading } = useQuery({
    queryKey: ["rn-teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rn_teams")
        .select(`
          *,
          rn_team_members(
            id,
            user_id,
            role,
            profiles:user_id(display_name, email)
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: availableUsers } = useQuery({
    queryKey: ["rn-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, profiles:user_id(display_name, email)")
        .eq("role", "RN_CCM");
      if (error) throw error;
      return data;
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { data: team, error: teamError } = await supabase
        .from("rn_teams")
        .insert({
          team_name: teamName,
          description,
          created_by: user.id,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from("rn_team_members")
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: "owner",
        });

      if (memberError) throw memberError;
      return team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rn-teams"] });
      setIsCreateOpen(false);
      setTeamName("");
      setDescription("");
      toast.success("Team created successfully");
    },
    onError: (error) => {
      console.error("Error creating team:", error);
      toast.error("Failed to create team");
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ teamId, userId, role }: { teamId: string; userId: string; role: string }) => {
      const { error } = await supabase
        .from("rn_team_members")
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rn-teams"] });
      toast.success("Member added successfully");
    },
    onError: () => {
      toast.error("Failed to add member");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("rn_team_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rn-teams"] });
      toast.success("Member removed");
    },
  });

  if (isLoading) return <div>Loading teams...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Team Management
        </h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., North Region Team"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional team description"
                />
              </div>
              <Button 
                onClick={() => createTeamMutation.mutate()} 
                disabled={!teamName || createTeamMutation.isPending}
                className="w-full"
              >
                Create Team
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {teams?.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <CardTitle>{team.team_name}</CardTitle>
              {team.description && <CardDescription>{team.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Team Members</h4>
                  <div className="space-y-2">
                    {team.rn_team_members?.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <div className="font-medium">{member.profiles?.display_name}</div>
                          <div className="text-sm text-muted-foreground">{member.profiles?.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-secondary px-2 py-1 rounded">{member.role}</span>
                          {member.user_id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMemberMutation.mutate(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <AddTeamMemberDialog
                  teamId={team.id}
                  availableUsers={availableUsers || []}
                  existingMembers={team.rn_team_members?.map((m: any) => m.user_id) || []}
                  onAddMember={(userId, role) => addMemberMutation.mutate({ teamId: team.id, userId, role })}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AddTeamMemberDialog({ 
  teamId, 
  availableUsers, 
  existingMembers, 
  onAddMember 
}: { 
  teamId: string; 
  availableUsers: any[]; 
  existingMembers: string[];
  onAddMember: (userId: string, role: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");

  const eligibleUsers = availableUsers.filter(u => !existingMembers.includes(u.user_id));

  const handleAdd = () => {
    if (selectedUser) {
      onAddMember(selectedUser, selectedRole);
      setIsOpen(false);
      setSelectedUser("");
      setSelectedRole("member");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {eligibleUsers.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.profiles?.display_name || user.profiles?.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={!selectedUser} className="w-full">
            Add Member
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}