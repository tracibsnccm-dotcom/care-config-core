import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Repeat, Plus, Trash2, Pause, Play } from "lucide-react";

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

export function DiaryRecurringEntries() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [pattern, setPattern] = useState("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [scheduledTime, setScheduledTime] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: recurringEntries, isLoading } = useQuery({
    queryKey: ["recurring-entries"],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("rn_diary_recurring")
        .select("*")
        .eq("rn_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createRecurringMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("rn_diary_recurring")
        .insert({
          rn_id: user.id,
          title,
          description: description || null,
          category: category || null,
          priority,
          recurrence_pattern: pattern,
          recurrence_days: pattern === "weekly" ? selectedDays : null,
          scheduled_time: scheduledTime || null,
          start_date: startDate,
          end_date: endDate || null,
          is_active: true,
        });

      if (error) throw error;

      // Trigger generation of entries
      const { error: generateError } = await supabase.rpc("generate_recurring_diary_entries");
      if (generateError) console.error("Error generating entries:", generateError);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-entries"] });
      queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
      setIsCreateOpen(false);
      resetForm();
      toast.success("Recurring entry created");
    },
    onError: (error) => {
      console.error("Error creating recurring entry:", error);
      toast.error("Failed to create recurring entry");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("rn_diary_recurring")
        .update({ is_active: !isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-entries"] });
      toast.success("Recurring entry updated");
    },
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rn_diary_recurring")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-entries"] });
      toast.success("Recurring entry deleted");
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setPriority("medium");
    setPattern("daily");
    setSelectedDays([1, 2, 3, 4, 5]);
    setScheduledTime("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  if (isLoading) return <div>Loading recurring entries...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Repeat className="h-6 w-6" />
          Recurring Entries
        </h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Recurring
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Recurring Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Daily Client Check-in"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Follow-up"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="pattern">Recurrence Pattern</Label>
                <Select value={pattern} onValueChange={setPattern}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {pattern === "weekly" && (
                <div>
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={selectedDays.includes(day.value)}
                          onCheckedChange={() => toggleDay(day.value)}
                        />
                        <label htmlFor={`day-${day.value}`} className="text-sm">{day.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date (Optional)</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="time">Time (Optional)</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => createRecurringMutation.mutate()} 
                disabled={!title || !startDate || createRecurringMutation.isPending}
                className="w-full"
              >
                Create Recurring Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {recurringEntries?.map((entry) => (
          <Card key={entry.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{entry.title}</CardTitle>
                  <CardDescription>
                    {entry.recurrence_pattern} • Starts {new Date(entry.start_date).toLocaleDateString()}
                    {entry.end_date && ` • Ends ${new Date(entry.end_date).toLocaleDateString()}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${entry.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {entry.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {entry.description && <p className="text-sm text-muted-foreground">{entry.description}</p>}
              <div className="flex items-center gap-2 flex-wrap">
                {entry.category && (
                  <span className="text-xs bg-secondary px-2 py-1 rounded">{entry.category}</span>
                )}
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{entry.priority}</span>
                {entry.scheduled_time && (
                  <span className="text-xs bg-muted px-2 py-1 rounded">{entry.scheduled_time}</span>
                )}
                {entry.recurrence_pattern === "weekly" && entry.recurrence_days && (
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {entry.recurrence_days.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label.slice(0, 3)).join(", ")}
                  </span>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActiveMutation.mutate({ id: entry.id, isActive: entry.is_active })}
                >
                  {entry.is_active ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {entry.is_active ? 'Pause' : 'Resume'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRecurringMutation.mutate(entry.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}