import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookText, Plus, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CaraAssistant } from "./CaraAssistant";

interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
  is_shared: boolean;
}

interface ClientJournalProps {
  caseId: string;
}

export function ClientJournal({ caseId }: ClientJournalProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, [caseId]);

  async function fetchEntries() {
    try {
      setLoading(true);
      // Mock data for now - in production, create a journal_entries table
      setEntries([]);
    } catch (err: any) {
      console.error("Error fetching journal entries:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!newEntry.trim()) {
      toast.error("Please write something first");
      return;
    }

    try {
      setSubmitting(true);
      const user = await supabase.auth.getUser();
      
      // Mock submission - in production, insert to journal_entries table
      const entry: JournalEntry = {
        id: Date.now().toString(),
        content: newEntry,
        created_at: new Date().toISOString(),
        is_shared: false,
      };

      setEntries([entry, ...entries]);
      setNewEntry("");
      toast.success("Journal entry saved");
    } catch (err: any) {
      console.error("Error saving entry:", err);
      toast.error("Failed to save entry");
    } finally {
      setSubmitting(false);
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCaraApply = (text: string, isAIAssisted: boolean) => {
    setNewEntry(text);
  };

  return (
    <Card className="p-6 border-primary/20">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
        <BookText className="w-5 h-5 text-primary" />
        Personal Journal
      </h2>

      {/* CARA Assistant */}
      <CaraAssistant journalText={newEntry} onApply={handleCaraApply} />

      {/* New Entry Form */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">New Entry</p>
          <span className="text-xs text-muted-foreground">
            {newEntry.length} / 10,000
          </span>
        </div>
        <Textarea
          value={newEntry}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= 10000) {
              setNewEntry(value);
            }
          }}
          placeholder="Write your thoughts, reflections, or notes here... Document your progress and experiences for your care team."
          className="min-h-[120px] mb-3 resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Journal entries are part of your secure case file and shared with your care team (RN Case Manager and attorney) to support your treatment and legal case. These entries help document your progress and experiences.
          </p>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !newEntry.trim()}
            size="sm"
            className="bg-rcms-gold text-rcms-black hover:bg-rcms-black hover:text-rcms-gold transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            {submitting ? "Saving..." : "Add Entry"}
          </Button>
        </div>
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse h-24 bg-muted rounded"></div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rcms-pale-gold flex items-center justify-center">
            <BookText className="w-8 h-8 text-rcms-gold" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Your Journal is Empty
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Start documenting your journey! Journal entries help your care team understand your progress and experiences better.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 rounded-lg border border-border bg-muted/20"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Clock className="w-3 h-3" />
                {formatTimestamp(entry.created_at)}
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{entry.content}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
