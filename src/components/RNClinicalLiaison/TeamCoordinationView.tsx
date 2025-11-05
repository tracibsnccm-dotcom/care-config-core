import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, Users } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";

interface TeamMember {
  user_id: string;
  display_name: string;
  entries: Array<{
    id: string;
    title: string;
    scheduled_date: string;
    scheduled_time?: string;
    completion_status: string;
    priority: string;
  }>;
}

export function TeamCoordinationView() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamSchedules();
  }, []);

  const loadTeamSchedules = async () => {
    setLoading(true);
    try {
      // Get all RN CMs
      const { data: rnUsers, error: usersError } = await supabase
        .from("user_roles")
        .select("user_id, profiles!inner(display_name)")
        .in("role", ["RN_CM", "RCMS_CLINICAL_MGMT"]);

      if (usersError) throw usersError;

      // Get today's and tomorrow's entries for all RN CMs
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

      const { data: entries, error: entriesError } = await supabase
        .from("rn_diary_entries")
        .select("id, rn_id, title, scheduled_date, scheduled_time, completion_status, priority")
        .in("scheduled_date", [today, tomorrow])
        .in("completion_status", ["pending", "in_progress"]);

      if (entriesError) throw entriesError;

      // Group entries by RN
      const teamData: TeamMember[] = (rnUsers || []).map((rn: any) => ({
        user_id: rn.user_id,
        display_name: rn.profiles?.display_name || "Unknown",
        entries: (entries || []).filter((e) => e.rn_id === rn.user_id),
      }));

      setTeamMembers(teamData);
    } catch (error) {
      console.error("Error loading team schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getWorkloadColor = (entryCount: number) => {
    if (entryCount === 0) return "bg-green-100 text-green-800";
    if (entryCount <= 3) return "bg-yellow-100 text-yellow-800";
    if (entryCount <= 6) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getWorkloadLabel = (entryCount: number) => {
    if (entryCount === 0) return "Available";
    if (entryCount <= 3) return "Light";
    if (entryCount <= 6) return "Moderate";
    return "Heavy";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading team schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Team Coordination
          </h2>
          <p className="text-muted-foreground mt-1">View team schedules and workload distribution</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => {
          const todayEntries = member.entries.filter((e) =>
            isToday(new Date(e.scheduled_date))
          );
          const tomorrowEntries = member.entries.filter((e) =>
            isTomorrow(new Date(e.scheduled_date))
          );
          const totalEntries = member.entries.length;

          return (
            <Card key={member.user_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(member.display_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{member.display_name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />
                        RN Case Manager
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getWorkloadColor(totalEntries)}>
                    {getWorkloadLabel(totalEntries)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Today's Schedule */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Today ({todayEntries.length})
                  </h4>
                  {todayEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No entries scheduled</p>
                  ) : (
                    <div className="space-y-2">
                      {todayEntries.slice(0, 3).map((entry) => (
                        <div
                          key={entry.id}
                          className="text-sm p-2 bg-muted rounded-md flex items-start justify-between gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{entry.title}</p>
                            {entry.scheduled_time && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {entry.scheduled_time.slice(0, 5)}
                              </p>
                            )}
                          </div>
                          {entry.priority === "urgent" && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                        </div>
                      ))}
                      {todayEntries.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{todayEntries.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Tomorrow's Schedule */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Tomorrow ({tomorrowEntries.length})
                  </h4>
                  {tomorrowEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No entries scheduled</p>
                  ) : (
                    <div className="space-y-2">
                      {tomorrowEntries.slice(0, 2).map((entry) => (
                        <div
                          key={entry.id}
                          className="text-sm p-2 bg-muted rounded-md"
                        >
                          <p className="font-medium truncate">{entry.title}</p>
                          {entry.scheduled_time && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {entry.scheduled_time.slice(0, 5)}
                            </p>
                          )}
                        </div>
                      ))}
                      {tomorrowEntries.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{tomorrowEntries.length - 2} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {teamMembers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No team members found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}