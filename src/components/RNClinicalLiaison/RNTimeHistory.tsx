import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Edit, Trash2, Calendar, AlertCircle } from "lucide-react";
import { format, differenceInHours, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface TimeEntry {
  id: string;
  case_id: string;
  activity_type: string;
  activity_description: string;
  time_spent_minutes: number;
  estimated_attorney_time_saved_minutes: number;
  created_at: string;
  case?: {
    client_number: string;
    client_label: string;
  };
}

const activityTypes = [
  { value: "medical_record_review", label: "Medical Record Review", multiplier: 2.5 },
  { value: "provider_communication", label: "Provider Communication", multiplier: 3 },
  { value: "appointment_coordination", label: "Appointment Coordination", multiplier: 2 },
  { value: "treatment_plan_review", label: "Treatment Plan Review", multiplier: 2.5 },
  { value: "insurance_authorization", label: "Insurance Authorization", multiplier: 4 },
  { value: "care_plan_development", label: "Care Plan Development", multiplier: 2 },
  { value: "client_education", label: "Client Education", multiplier: 1.5 },
  { value: "documentation", label: "Clinical Documentation", multiplier: 1.8 },
  { value: "case_research", label: "Case Research", multiplier: 2 },
  { value: "team_coordination", label: "Team Coordination", multiplier: 1.5 },
];

type TimeFilter = "today" | "week" | "month" | "all";

export function RNTimeHistory() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<TimeFilter>("week");
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editForm, setEditForm] = useState({
    activity_type: "",
    activity_description: "",
    time_spent_minutes: ""
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [entries, filter]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("rn_time_entries")
        .select(`
          *,
          case:cases(client_number, client_label)
        `)
        .eq("rn_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching entries:", error);
      toast.error("Failed to load time entries");
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    const now = new Date();
    let filtered = entries;

    switch (filter) {
      case "today":
        filtered = entries.filter(e => 
          format(new Date(e.created_at), "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
        );
        break;
      case "week":
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        filtered = entries.filter(e => {
          const date = new Date(e.created_at);
          return date >= weekStart && date <= weekEnd;
        });
        break;
      case "month":
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        filtered = entries.filter(e => {
          const date = new Date(e.created_at);
          return date >= monthStart && date <= monthEnd;
        });
        break;
      default:
        filtered = entries;
    }

    setFilteredEntries(filtered);
  };

  const canEdit = (entry: TimeEntry): boolean => {
    const hoursSinceCreation = differenceInHours(new Date(), new Date(entry.created_at));
    return hoursSinceCreation < 8;
  };

  const handleEdit = (entry: TimeEntry) => {
    if (!canEdit(entry)) {
      toast.error("Time entries can only be edited within 8 hours of creation");
      return;
    }

    setEditingEntry(entry);
    setEditForm({
      activity_type: entry.activity_type,
      activity_description: entry.activity_description || "",
      time_spent_minutes: entry.time_spent_minutes.toString()
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    setLoading(true);
    try {
      const selectedActivity = activityTypes.find(a => a.value === editForm.activity_type);
      const timeSpent = parseInt(editForm.time_spent_minutes);
      const estimatedSavings = selectedActivity ? Math.round(timeSpent * selectedActivity.multiplier) : 0;

      const { error } = await supabase
        .from("rn_time_entries")
        .update({
          activity_type: editForm.activity_type,
          activity_description: editForm.activity_description,
          time_spent_minutes: timeSpent,
          estimated_attorney_time_saved_minutes: estimatedSavings
        })
        .eq("id", editingEntry.id);

      if (error) throw error;

      toast.success("Time entry updated successfully");
      setEditingEntry(null);
      fetchEntries();
    } catch (error) {
      console.error("Error updating entry:", error);
      toast.error("Failed to update time entry");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entry: TimeEntry) => {
    if (!canEdit(entry)) {
      toast.error("Time entries can only be deleted within 8 hours of creation");
      return;
    }

    if (!confirm("Are you sure you want to delete this time entry?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("rn_time_entries")
        .delete()
        .eq("id", entry.id);

      if (error) throw error;

      toast.success("Time entry deleted successfully");
      fetchEntries();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete time entry");
    } finally {
      setLoading(false);
    }
  };

  const getTotalTime = () => {
    return filteredEntries.reduce((sum, e) => sum + e.time_spent_minutes, 0);
  };

  const getTotalSavings = () => {
    return filteredEntries.reduce((sum, e) => sum + e.estimated_attorney_time_saved_minutes, 0);
  };

  const getActivityLabel = (value: string) => {
    return activityTypes.find(a => a.value === value)?.label || value;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Entry History
            </CardTitle>
            <Select value={filter} onValueChange={(v) => setFilter(v as TimeFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="bg-primary/5">
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Entries</div>
                <div className="text-2xl font-bold">{filteredEntries.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Time Logged</div>
                <div className="text-2xl font-bold">{(getTotalTime() / 60).toFixed(1)} hrs</div>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10">
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Time Saved</div>
                <div className="text-2xl font-bold text-green-600">
                  {(getTotalSavings() / 60).toFixed(1)} hrs
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Entries List */}
          <div className="space-y-3">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No time entries found for this period
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const editable = canEdit(entry);
                return (
                  <Card key={entry.id} className={!editable ? "opacity-75" : ""}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {format(new Date(entry.created_at), "MMM dd, yyyy 'at' h:mm a")}
                            </span>
                            {!editable && (
                              <span className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Locked
                              </span>
                            )}
                          </div>
                          <div className="font-semibold mb-1">
                            {getActivityLabel(entry.activity_type)}
                          </div>
                          {entry.case && (
                            <div className="text-sm text-muted-foreground mb-1">
                              Case: {entry.case.client_number} - {entry.case.client_label}
                            </div>
                          )}
                          {entry.activity_description && (
                            <div className="text-sm text-muted-foreground mb-2">
                              {entry.activity_description}
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Time Spent: </span>
                              <span className="font-medium">{entry.time_spent_minutes} min</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Attorney Time Saved: </span>
                              <span className="font-medium text-green-600">
                                {entry.estimated_attorney_time_saved_minutes} min
                              </span>
                            </div>
                          </div>
                        </div>
                        {editable && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(entry)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(entry)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Activity Type *</Label>
              <Select
                value={editForm.activity_type}
                onValueChange={(v) => setEditForm({ ...editForm, activity_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((activity) => (
                    <SelectItem key={activity.value} value={activity.value}>
                      {activity.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Time Spent (minutes) *</Label>
              <Input
                type="number"
                min="1"
                value={editForm.time_spent_minutes}
                onChange={(e) => setEditForm({ ...editForm, time_spent_minutes: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editForm.activity_description}
                onChange={(e) => setEditForm({ ...editForm, activity_description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntry(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
