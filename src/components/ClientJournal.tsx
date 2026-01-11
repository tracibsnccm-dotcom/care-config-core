import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BookOpen, Plus, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface JournalEntry {
  id: string;
  case_id: string;
  content: string | null;
  p1_physical_text: string | null;
  p2_psychological_text: string | null;
  p3_psychosocial_text: string | null;
  p4_professional_text: string | null;
  created_at: string;
  updated_at: string | null;
}

interface ClientJournalProps {
  caseId: string;
}

export function ClientJournal({ caseId }: ClientJournalProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [p1Physical, setP1Physical] = useState("");
  const [p2Psychological, setP2Psychological] = useState("");
  const [p3Psychosocial, setP3Psychosocial] = useState("");
  const [p4Professional, setP4Professional] = useState("");
  const [generalEntry, setGeneralEntry] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, [caseId]);

  async function fetchEntries() {
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_journal?case_id=eq.${caseId}&order=created_at.desc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load journal entries: ${response.status}`);
      }

      const data = await response.json();
      setEntries(data || []);
    } catch (err: any) {
      console.error("Error fetching journal entries:", err);
      toast.error("Failed to load journal entries");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    // Check if at least one field has content
    const hasContent = 
      p1Physical.trim() || 
      p2Psychological.trim() || 
      p3Psychosocial.trim() || 
      p4Professional.trim() || 
      generalEntry.trim();

    if (!hasContent) {
      toast.error("Please write something in at least one section");
      return;
    }

    try {
      setSubmitting(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Get client_id from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error("Could not identify user. Please log in again.");
      }
      const clientId = user.id;

      const entryData = {
        case_id: caseId,
        client_id: clientId,
        content: generalEntry.trim() || null,
        p1_physical_text: p1Physical.trim() || null,
        p2_psychological_text: p2Psychological.trim() || null,
        p3_psychosocial_text: p3Psychosocial.trim() || null,
        p4_professional_text: p4Professional.trim() || null,
        // Set boolean flags based on whether text exists
        p1_physical: !!p1Physical.trim(),
        p2_psychological: !!p2Psychological.trim(),
        p3_psychosocial: !!p3Psychosocial.trim(),
        p4_professional: !!p4Professional.trim()
      };

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_journal`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(entryData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save entry');
      }

      toast.success("Journal entry saved");
      setP1Physical("");
      setP2Psychological("");
      setP3Psychosocial("");
      setP4Professional("");
      setGeneralEntry("");
      fetchEntries();
    } catch (err: any) {
      console.error("Error saving entry:", err);
      toast.error(err.message || "Failed to save entry");
    } finally {
      setSubmitting(false);
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, 'MMM d, yyyy') + " at " + format(date, 'h:mm a');
  };

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-500" />
          My Journal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Intro Text */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-slate-700">
            Use this journal to document your recovery journey. Share your thoughts and experiences in any or all of the sections below. 
            Your entries are shared with your care team (RN Case Manager and attorney) to help support your treatment and legal case.
          </p>
        </div>

        {/* New Entry Form */}
        <div className="space-y-6">
          {/* 4Ps Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* P1 Physical */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Physical (P1)</Label>
              <p className="text-xs text-slate-500 mb-2">Pain, mobility, energy, sleep</p>
              <Textarea
                value={p1Physical}
                onChange={(e) => setP1Physical(e.target.value)}
                placeholder="How is your body feeling? Pain levels, mobility, energy, sleep quality..."
                className="min-h-[100px] resize-none"
                maxLength={5000}
              />
              <p className="text-xs text-slate-400 text-right">
                {p1Physical.length} / 5,000
              </p>
            </div>

            {/* P2 Psychological */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Psychological (P2)</Label>
              <p className="text-xs text-slate-500 mb-2">Mood, anxiety, stress, coping</p>
              <Textarea
                value={p2Psychological}
                onChange={(e) => setP2Psychological(e.target.value)}
                placeholder="How are you feeling emotionally? Mood, anxiety, stress, coping strategies..."
                className="min-h-[100px] resize-none"
                maxLength={5000}
              />
              <p className="text-xs text-slate-400 text-right">
                {p2Psychological.length} / 5,000
              </p>
            </div>

            {/* P3 Psychosocial */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Psychosocial (P3)</Label>
              <p className="text-xs text-slate-500 mb-2">Family, friends, resources, barriers</p>
              <Textarea
                value={p3Psychosocial}
                onChange={(e) => setP3Psychosocial(e.target.value)}
                placeholder="How is your support system? Family, friends, resources, barriers..."
                className="min-h-[100px] resize-none"
                maxLength={5000}
              />
              <p className="text-xs text-slate-400 text-right">
                {p3Psychosocial.length} / 5,000
              </p>
            </div>

            {/* P4 Professional */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Professional (P4)</Label>
              <p className="text-xs text-slate-500 mb-2">Work, daily activities, productivity</p>
              <Textarea
                value={p4Professional}
                onChange={(e) => setP4Professional(e.target.value)}
                placeholder="How is your ability to work and function? Daily activities, productivity, goals..."
                className="min-h-[100px] resize-none"
                maxLength={5000}
              />
              <p className="text-xs text-slate-400 text-right">
                {p4Professional.length} / 5,000
              </p>
            </div>
          </div>

          {/* General Entry */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">General Entry</Label>
            <p className="text-xs text-slate-500 mb-2">Additional thoughts, reflections, or notes</p>
            <Textarea
              value={generalEntry}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 10000) {
                  setGeneralEntry(value);
                }
              }}
              placeholder="Any additional thoughts, reflections, or notes..."
              className="min-h-[120px] resize-none"
              maxLength={10000}
            />
            <p className="text-xs text-slate-400 text-right">
              {generalEntry.length} / 10,000
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting || (!p1Physical.trim() && !p2Psychological.trim() && !p3Psychosocial.trim() && !p4Professional.trim() && !generalEntry.trim())}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Save Entry
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Entries List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse h-24 bg-slate-100 rounded"></div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Your Journal is Empty
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Start documenting your journey! Use the sections above to share your experiences with your care team.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(entry.created_at)}
                  </div>
                  
                  <div className="space-y-4">
                    {/* 4Ps Sections */}
                    {entry.p1_physical_text && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-slate-700">Physical (P1)</span>
                          <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">P1</span>
                        </div>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap bg-blue-50 p-3 rounded">
                          {entry.p1_physical_text}
                        </p>
                      </div>
                    )}

                    {entry.p2_psychological_text && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-slate-700">Psychological (P2)</span>
                          <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">P2</span>
                        </div>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap bg-purple-50 p-3 rounded">
                          {entry.p2_psychological_text}
                        </p>
                      </div>
                    )}

                    {entry.p3_psychosocial_text && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-slate-700">Psychosocial (P3)</span>
                          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">P3</span>
                        </div>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap bg-green-50 p-3 rounded">
                          {entry.p3_psychosocial_text}
                        </p>
                      </div>
                    )}

                    {entry.p4_professional_text && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-slate-700">Professional (P4)</span>
                          <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800">P4</span>
                        </div>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap bg-orange-50 p-3 rounded">
                          {entry.p4_professional_text}
                        </p>
                      </div>
                    )}

                    {/* General Entry */}
                    {entry.content && (
                      <div>
                        <span className="text-sm font-semibold text-slate-700 mb-2 block">General Entry</span>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50 p-3 rounded">
                          {entry.content}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
