import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar as CalendarIcon, 
  FileText, 
  Plus, 
  Send, 
  Clock, 
  MapPin 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ProviderNote {
  id: string;
  note_content: string;
  note_title: string;
  created_at: string;
  case_id: string;
  provider_id: string;
}

interface CaseOption {
  id: string;
  client_label: string;
}

export function ProviderPortal() {
  const [notes, setNotes] = useState<ProviderNote[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [selectedCase, setSelectedCase] = useState<string>("");
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Appointment state
  const [appointmentTitle, setAppointmentTitle] = useState("");
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(new Date());
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentLocation, setAppointmentLocation] = useState("");
  const [appointmentNotes, setAppointmentNotes] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchCases();
    fetchNotes();
  }, []);

  async function fetchCases() {
    try {
      const user = await supabase.auth.getUser();
      
      // Get cases where provider has assignments or access
      const { data, error } = await supabase
        .from("cases")
        .select("id, client_label")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (err) {
      console.error("Error fetching cases:", err);
    }
  }

  async function fetchNotes() {
    try {
      const user = await supabase.auth.getUser();
      
      // Directly use case_notes table filtered for provider notes
      const { data, error } = await supabase
        .from("case_notes")
        .select("id, note_text, created_at, case_id, created_by")
        .eq("created_by", user.data.user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Map to provider note format
      const mappedNotes = (data || []).map(note => ({
        id: note.id,
        note_content: note.note_text,
        note_title: "Provider Note",
        created_at: note.created_at,
        case_id: note.case_id,
        provider_id: note.created_by
      }));
      
      setNotes(mappedNotes);
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  }

  async function handleSubmitNote() {
    if (!selectedCase || !noteText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a case and enter a note",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const user = await supabase.auth.getUser();

      // Insert into case_notes table
      const { error } = await supabase
        .from("case_notes")
        .insert({
          case_id: selectedCase,
          created_by: user.data.user?.id,
          note_text: noteText,
          visibility: 'shared'
        });

      if (error) throw error;

      toast({
        title: "Note Added",
        description: "Your note has been saved successfully"
      });

      setNoteText("");
      fetchNotes();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleScheduleAppointment() {
    if (!selectedCase || !appointmentTitle || !appointmentDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const user = await supabase.auth.getUser();

      // Get the case to find the client_id
      const { data: caseData } = await supabase
        .from("cases")
        .select("id")
        .eq("id", selectedCase)
        .single();

      if (!caseData) throw new Error("Case not found");

      // Get client from case_assignments
      const { data: assignmentData } = await supabase
        .from("case_assignments")
        .select("user_id")
        .eq("case_id", selectedCase)
        .eq("role", "CLIENT")
        .single();

      if (!assignmentData) throw new Error("Client not found for this case");

      const { error } = await supabase
        .from("client_appointments")
        .insert({
          case_id: selectedCase,
          client_id: assignmentData.user_id,
          provider_id: user.data.user?.id,
          provider_name: user.data.user?.user_metadata?.full_name || user.data.user?.email,
          title: appointmentTitle,
          appointment_date: format(appointmentDate, "yyyy-MM-dd"),
          appointment_time: appointmentTime || null,
          location: appointmentLocation || null,
          notes: appointmentNotes || null,
          status: "scheduled"
        });

      if (error) throw error;

      toast({
        title: "Appointment Scheduled",
        description: "The client and care team have been notified"
      });

      // Reset form
      setAppointmentTitle("");
      setAppointmentDate(new Date());
      setAppointmentTime("");
      setAppointmentLocation("");
      setAppointmentNotes("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Provider Portal</h1>
        <p className="text-muted-foreground mt-1">Manage your case notes and appointments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Notes Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            Add Case Note
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="case-select">Select Case</Label>
              <select
                id="case-select"
                value={selectedCase}
                onChange={(e) => setSelectedCase(e.target.value)}
                className="w-full mt-1 p-2 border border-border rounded-md bg-background"
              >
                <option value="">-- Select a case --</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.client_label || `Case ${c.id.slice(-8)}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="note-text">Note</Label>
              <Textarea
                id="note-text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter your case note here..."
                className="mt-1 min-h-[120px]"
              />
            </div>

            <Button
              onClick={handleSubmitNote}
              disabled={loading || !selectedCase || !noteText.trim()}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Note
            </Button>
          </div>

          {/* Recent Notes */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Notes</h3>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {notes.slice(0, 5).map((note) => (
                  <div key={note.id} className="p-3 rounded-lg border border-border bg-muted/20">
                    <p className="text-sm text-foreground">{note.note_content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No notes yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </Card>

        {/* Schedule Appointment Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Schedule Appointment
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="appt-case-select">Select Case</Label>
              <select
                id="appt-case-select"
                value={selectedCase}
                onChange={(e) => setSelectedCase(e.target.value)}
                className="w-full mt-1 p-2 border border-border rounded-md bg-background"
              >
                <option value="">-- Select a case --</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.client_label || `Case ${c.id.slice(-8)}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="appt-title">Appointment Title*</Label>
              <Input
                id="appt-title"
                value={appointmentTitle}
                onChange={(e) => setAppointmentTitle(e.target.value)}
                placeholder="e.g., Follow-up Visit"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Select Date*</Label>
              <Calendar
                mode="single"
                selected={appointmentDate}
                onSelect={setAppointmentDate}
                className="rounded-md border mt-1"
              />
            </div>

            <div>
              <Label htmlFor="appt-time">Time</Label>
              <Input
                id="appt-time"
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="appt-location">Location</Label>
              <Input
                id="appt-location"
                value={appointmentLocation}
                onChange={(e) => setAppointmentLocation(e.target.value)}
                placeholder="Enter location"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="appt-notes">Additional Notes</Label>
              <Textarea
                id="appt-notes"
                value={appointmentNotes}
                onChange={(e) => setAppointmentNotes(e.target.value)}
                placeholder="Any additional information..."
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleScheduleAppointment}
              disabled={loading || !selectedCase || !appointmentTitle || !appointmentDate}
              className="w-full"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Schedule Appointment
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
