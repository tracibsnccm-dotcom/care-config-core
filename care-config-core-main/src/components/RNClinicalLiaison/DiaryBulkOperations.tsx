import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { useState } from "react";

export function DiaryTeamCalendar() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: teams } = useQuery({
    queryKey: ["my-teams"],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("rn_team_members")
        .select("team_id, rn_teams(id, team_name)")
        .eq("rn_user_id", user.id);
      if (error) throw error;
      return data.map(t => t.rn_teams);
    },
    enabled: !!user?.id,
  });

  const { data: teamMembers } = useQuery({
    queryKey: ["team-members", selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return [];
      const { data, error } = await supabase
        .from("rn_team_members")
        .select("rn_user_id, profiles:rn_user_id(display_name, email)")
        .eq("team_id", selectedTeamId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTeamId,
  });

  const { data: teamEntries } = useQuery({
    queryKey: ["team-diary-entries", selectedTeamId, selectedDate],
    queryFn: async () => {
      if (!selectedTeamId || !teamMembers) return [];
      const memberIds = teamMembers.map((m: any) => m.rn_user_id);
      
      const { data, error } = await supabase
        .from("rn_diary_entries")
        .select(`
          *,
          profiles:rn_id(display_name, email)
        `)
        .in("rn_id", memberIds)
        .eq("scheduled_date", selectedDate)
        .order("scheduled_time");
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTeamId && !!teamMembers,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Team Calendar
        </h2>
        <div className="flex gap-2">
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              {teams?.map((team: any) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.team_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {!selectedTeamId ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Select a team to view calendar entries
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members ({teamMembers?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {teamMembers?.map((member: any) => (
                  <div key={member.rn_user_id} className="bg-secondary px-3 py-1 rounded-full text-sm">
                    {member.profiles?.display_name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule for {new Date(selectedDate).toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              {!teamEntries || teamEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No entries scheduled for this date
                </p>
              ) : (
                <div className="space-y-3">
                  {teamEntries.map((entry: any) => (
                    <div key={entry.id} className="border-l-4 border-primary pl-4 py-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{entry.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {entry.profiles?.display_name}
                          </div>
                          {entry.description && (
                            <div className="text-sm mt-1">{entry.description}</div>
                          )}
                        </div>
                        <div className="text-sm">
                          {entry.scheduled_time || "All day"}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {entry.category && (
                          <span className="text-xs bg-secondary px-2 py-1 rounded">
                            {entry.category}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${
                          entry.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          entry.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          entry.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {entry.priority}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          entry.completion_status === 'completed' ? 'bg-green-100 text-green-700' :
                          entry.completion_status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          entry.completion_status === 'overdue' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {entry.completion_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}