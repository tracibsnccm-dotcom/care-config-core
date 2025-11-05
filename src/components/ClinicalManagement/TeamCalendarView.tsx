import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

interface TeamMember {
  user_id: string;
  display_name: string;
}

interface DiaryEntry {
  id: string;
  title: string;
  entry_date: string;
  entry_time: string;
  rn_id: string;
  rn_name: string;
  priority: string;
  status: string;
}

export function TeamCalendarView() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [currentMonth] = useState(new Date());

  useEffect(() => {
    fetchTeamMembers();
    fetchDiaryEntries();
  }, [selectedMember]);

  const fetchTeamMembers = async () => {
    const { data, error } = await supabase
      .from("rn_team_members")
      .select("rn_user_id, profiles!rn_team_members_rn_user_id_fkey(user_id, display_name)");

    if (!error && data) {
      const members = data.map((m: any) => ({
        user_id: m.rn_user_id,
        display_name: m.profiles?.display_name || "Unknown"
      }));
      setTeamMembers(members);
    }
  };

  const fetchDiaryEntries = async () => {
    // Using case_tasks as a proxy for calendar events until rn_diary is created
    let query = supabase
      .from("case_tasks")
      .select(`
        id,
        title,
        due_date,
        status,
        assigned_to,
        description,
        profiles!case_tasks_assigned_to_fkey(display_name)
      `)
      .gte("due_date", format(startOfMonth(currentMonth), "yyyy-MM-dd"))
      .lte("due_date", format(endOfMonth(currentMonth), "yyyy-MM-dd"));

    if (selectedMember !== "all") {
      query = query.eq("assigned_to", selectedMember);
    }

    const { data, error } = await query;

    if (!error && data) {
      const entries = data.map((e: any) => ({
        id: e.id,
        title: e.title,
        entry_date: e.due_date,
        entry_time: "09:00",
        rn_id: e.assigned_to,
        rn_name: e.profiles?.display_name || "Unknown",
        priority: "normal",
        status: e.status
      }));
      setDiaryEntries(entries);
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getEntriesForDate = (date: Date) => {
    return diaryEntries.filter(entry =>
      isSameDay(new Date(entry.entry_date), date)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
        <Select value={selectedMember} onValueChange={setSelectedMember}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All team members" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Team Members</SelectItem>
            {teamMembers.map(member => (
              <SelectItem key={member.user_id} value={member.user_id}>
                {member.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}

        {daysInMonth.map(day => {
          const entries = getEntriesForDate(day);
          return (
            <Card key={day.toString()} className="min-h-[100px] p-2">
              <div className="text-sm font-medium mb-2">{format(day, "d")}</div>
              <div className="space-y-1">
                {entries.map(entry => (
                  <div key={entry.id} className="text-xs p-1 bg-primary/10 rounded">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span className="truncate">{entry.title}</span>
                    </div>
                    <div className="text-muted-foreground truncate">{entry.rn_name}</div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
