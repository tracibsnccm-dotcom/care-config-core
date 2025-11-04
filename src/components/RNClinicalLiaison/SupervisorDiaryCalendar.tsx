import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from "date-fns";

interface TeamMember {
  rn_user_id: string;
  rn_profile: {
    display_name: string;
  };
}

interface DiaryEntry {
  id: string;
  title: string;
  scheduled_date: string;
  scheduled_time?: string;
  priority: string;
  completion_status: string;
  rn_id: string;
  rn_profile?: {
    display_name: string;
  };
}

export function SupervisorDiaryCalendar() {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers();
      fetchTeamDiaryEntries();
    }
  }, [selectedTeam, currentMonth]);

  async function fetchTeams() {
    try {
      const { data, error } = await supabase
        .from("rn_teams")
        .select("*")
        .order("team_name");

      if (error) throw error;
      setTeams(data || []);
      
      if (data && data.length > 0) {
        setSelectedTeam(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeamMembers() {
    if (!selectedTeam) return;

    try {
      const { data, error } = await supabase
        .from("rn_team_members")
        .select(`
          rn_user_id,
          rn_profile:profiles!rn_team_members_rn_user_id_fkey(display_name)
        `)
        .eq("team_id", selectedTeam);

      if (error) throw error;
      setTeamMembers((data || []) as any);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  }

  async function fetchTeamDiaryEntries() {
    if (!selectedTeam || teamMembers.length === 0) return;

    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const rnIds = teamMembers.map(m => m.rn_user_id);

      const { data, error } = await supabase
        .from("rn_diary_entries")
        .select("*")
        .in("rn_id", rnIds)
        .eq("shared_with_supervisor", true)
        .gte("scheduled_date", monthStart.toISOString().split('T')[0])
        .lte("scheduled_date", monthEnd.toISOString().split('T')[0])
        .order("scheduled_date", { ascending: true });

      if (error) throw error;

      // Fetch RN profiles for entries
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", rnIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]));

      const enrichedEntries = (data || []).map(entry => ({
        ...entry,
        rn_profile: profilesMap.get(entry.rn_id)
      }));

      setEntries(enrichedEntries as any);
    } catch (error) {
      console.error("Error fetching diary entries:", error);
    }
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEntriesForDate = (date: Date) => {
    return entries.filter(entry => 
      isSameDay(new Date(entry.scheduled_date), date)
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Team Diary Calendar
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.team_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {teamMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No team members in this team</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Team Members List */}
            <div className="flex flex-wrap gap-2">
              {teamMembers.map((member) => (
                <Badge key={member.rn_user_id} variant="secondary">
                  {member.rn_profile?.display_name}
                </Badge>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {calendarDays.map((day, idx) => {
                const dayEntries = getEntriesForDate(day);
                const isCurrentMonth = day >= monthStart && day <= monthEnd;
                const today = isToday(day);

                return (
                  <div
                    key={idx}
                    className={`
                      min-h-[100px] p-2 border rounded-lg
                      ${!isCurrentMonth ? "opacity-30" : ""}
                      ${today ? "border-primary bg-primary/5" : ""}
                    `}
                  >
                    <div className={`text-sm font-medium mb-1 ${today ? "text-primary" : ""}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className={`text-xs p-1 rounded truncate ${
                            entry.completion_status === "completed" ? "bg-green-100 text-green-800" :
                            entry.completion_status === "overdue" ? "bg-red-100 text-red-800" :
                            "bg-blue-100 text-blue-800"
                          }`}
                          title={`${entry.title} - ${entry.rn_profile?.display_name}`}
                        >
                          <div className="font-medium truncate">{entry.rn_profile?.display_name}</div>
                          <div className="truncate">{entry.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
