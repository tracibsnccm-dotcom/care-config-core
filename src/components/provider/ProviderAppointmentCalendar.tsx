import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Calendar as CalendarIcon, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Case {
  id: string;
  client_label: string;
  client_number: string;
}

export function ProviderAppointmentCalendar() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  async function fetchCases() {
    try {
      const user = await supabase.auth.getUser();
      
      // Get cases where user is a provider
      const { data, error } = await supabase
        .from("cases")
        .select("id, client_label, client_number")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (err: any) {
      console.error("Error fetching cases:", err);
      toast.error("Failed to load cases");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedCase || !date || !title) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await supabase.auth.getUser();
      
      // Get client_id from the case
      const { data: caseData } = await supabase
        .from("case_assignments")
        .select("user_id")
        .eq("case_id", selectedCase)
        .eq("role", "CLIENT")
        .single();

      if (!caseData) {
        toast.error("Could not find client for this case");
        return;
      }

      const { error } = await supabase
        .from("client_appointments")
        .insert({
          case_id: selectedCase,
          client_id: caseData.user_id,
          provider_id: user.data.user?.id,
          title,
          appointment_date: format(date, "yyyy-MM-dd"),
          appointment_time: time || null,
          location: location || null,
          notes: notes || null,
          status: "scheduled",
        });

      if (error) throw error;

      toast.success("Appointment scheduled successfully");
      setOpen(false);
      // Reset form
      setSelectedCase("");
      setDate(undefined);
      setTime("");
      setTitle("");
      setLocation("");
      setNotes("");
    } catch (err: any) {
      console.error("Error creating appointment:", err);
      toast.error("Failed to schedule appointment");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Appointment Calendar</h2>
          <p className="text-sm text-muted-foreground">Schedule appointments for your cases</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>
                Create an appointment for a client case
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="case">Case *</Label>
                  <Select value={selectedCase} onValueChange={setSelectedCase}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a case" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.client_number} - {c.client_label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Appointment Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Follow-up Consultation"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Main Office"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes about the appointment"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Scheduling..." : "Schedule Appointment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
