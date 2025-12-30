import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Case {
  id: string;
  client_label: string;
  client_number: string;
}

interface Note {
  id: string;
  note_content: string;
  note_title: string;
  created_at: string;
  case_id: string;
}

export function ProviderNotes() {
  const [cases, setCases] = useState<Case[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [noteText, setNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (selectedCase) {
      fetchNotes();
    }
  }, [selectedCase]);

  async function fetchCases() {
    try {
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

  async function fetchNotes() {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("provider_notes")
        .select("*")
        .eq("case_id", selectedCase)
        .eq("provider_id", user.data.user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err: any) {
      console.error("Error fetching notes:", err);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedCase || !noteText.trim()) {
      toast.error("Please select a case and enter note text");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("provider_notes")
        .insert({
          case_id: selectedCase,
          provider_id: user.data.user?.id,
          note_title: "Provider Note",
          note_content: noteText.trim(),
        });

      if (error) throw error;

      toast.success("Note added successfully");
      setNoteText("");
      fetchNotes();
    } catch (err: any) {
      console.error("Error creating note:", err);
      toast.error("Failed to add note");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Provider Notes</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Add notes about your cases for the RN and attorney
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="case">Select Case *</Label>
            <Select value={selectedCase} onValueChange={setSelectedCase}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a case" />
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
            <Label htmlFor="note">Note *</Label>
            <Textarea
              id="note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your note here..."
              rows={6}
              className="resize-none"
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            <Plus className="h-4 w-4 mr-2" />
            {isSubmitting ? "Adding Note..." : "Add Note"}
          </Button>
        </form>
      </Card>

      {selectedCase && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Previous Notes</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-24 bg-muted rounded"></div>
              ))}
            </div>
          ) : notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 border border-border rounded-lg bg-background"
                >
                  <p className="text-sm text-muted-foreground mb-2">
                    {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  {note.note_title && note.note_title !== "Provider Note" && (
                    <p className="font-semibold mb-1">{note.note_title}</p>
                  )}
                  <p className="text-foreground whitespace-pre-wrap">{note.note_content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notes yet for this case
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
