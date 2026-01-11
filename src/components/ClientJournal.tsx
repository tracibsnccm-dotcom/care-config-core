import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface JournalEntry {
  id: string;
  case_id: string;
  content: string;
  mood: string | null;
  p1_physical: boolean;
  p2_psychological: boolean;
  p3_psychosocial: boolean;
  p4_professional: boolean;
  created_at: string;
  updated_at: string | null;
}

interface ClientJournalProps {
  caseId: string;
}

const MOOD_OPTIONS = [
  { value: "excellent", label: "Excellent", icon: "😄" },
  { value: "good", label: "Good", icon: "😊" },
  { value: "okay", label: "Okay", icon: "😐" },
  { value: "poor", label: "Poor", icon: "😔" },
  { value: "very_poor", label: "Very Poor", icon: "😢" }
];

const FOUR_PS = [
  { id: "p1_physical", label: "Physical", description: "Pain, mobility, energy, sleep" },
  { id: "p2_psychological", label: "Psychological", description: "Mood, anxiety, stress, coping" },
  { id: "p3_psychosocial", label: "Psychosocial", description: "Family, friends, resources, barriers" },
  { id: "p4_professional", label: "Professional", description: "Work, daily activities, productivity" }
];

export function ClientJournal({ caseId }: ClientJournalProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState("");
  const [mood, setMood] = useState<string>("");
  const [p1_physical, setP1_physical] = useState(false);
  const [p2_psychological, setP2_psychological] = useState(false);
  const [p3_psychosocial, setP3_psychosocial] = useState(false);
  const [p4_professional, setP4_professional] = useState(false);
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
    if (!newEntry.trim()) {
      toast.error("Please write something first");
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
        content: newEntry.trim(),
        mood: mood || null,
        p1_physical,
        p2_psychological,
        p3_psychosocial,
        p4_professional
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
      setNewEntry("");
      setMood("");
      setP1_physical(false);
      setP2_psychological(false);
      setP3_psychosocial(false);
      setP4_professional(false);
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

  const getMoodEmoji = (moodValue: string | null) => {
    if (!moodValue) return null;
    const moodOption = MOOD_OPTIONS.find(m => m.value === moodValue);
    return moodOption ? moodOption.icon : null;
  };

  const getMoodLabel = (moodValue: string | null) => {
    if (!moodValue) return null;
    const moodOption = MOOD_OPTIONS.find(m => m.value === moodValue);
    return moodOption ? moodOption.label : null;
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
        {/* New Entry Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-700">Journal Entry</Label>
            <Textarea
              value={newEntry}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 10000) {
                  setNewEntry(value);
                }
              }}
              placeholder="Write your thoughts, reflections, or notes here... Document your progress and experiences for your care team."
              className="min-h-[120px] resize-none"
              maxLength={10000}
            />
            <p className="text-xs text-slate-500 text-right">
              {newEntry.length} / 10,000 characters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mood Selection */}
            <div className="space-y-2">
              <Label className="text-slate-700">How are you feeling? (Optional)</Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Select your mood..." />
                </SelectTrigger>
                <SelectContent>
                  {MOOD_OPTIONS.map((moodOption) => (
                    <SelectItem key={moodOption.value} value={moodOption.value}>
                      <span className="flex items-center gap-2">
                        <span>{moodOption.icon}</span>
                        <span>{moodOption.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 4Ps Tags */}
            <div className="space-y-2">
              <Label className="text-slate-700">Tag with 4Ps (Optional)</Label>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="p1_physical"
                    checked={p1_physical}
                    onCheckedChange={(checked) => setP1_physical(checked === true)}
                  />
                  <Label htmlFor="p1_physical" className="text-sm cursor-pointer">
                    Physical
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="p2_psychological"
                    checked={p2_psychological}
                    onCheckedChange={(checked) => setP2_psychological(checked === true)}
                  />
                  <Label htmlFor="p2_psychological" className="text-sm cursor-pointer">
                    Psychological
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="p3_psychosocial"
                    checked={p3_psychosocial}
                    onCheckedChange={(checked) => setP3_psychosocial(checked === true)}
                  />
                  <Label htmlFor="p3_psychosocial" className="text-sm cursor-pointer">
                    Psychosocial
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="p4_professional"
                    checked={p4_professional}
                    onCheckedChange={(checked) => setP4_professional(checked === true)}
                  />
                  <Label htmlFor="p4_professional" className="text-sm cursor-pointer">
                    Professional
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500">
              Journal entries are part of your secure case file and shared with your care team (RN Case Manager and attorney) to support your treatment and legal case.
            </p>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !newEntry.trim()}
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
                  Add Entry
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
              Start documenting your journey! Journal entries help your care team understand your progress and experiences better.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(entry.created_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.mood && (
                        <span className="text-sm text-slate-600 flex items-center gap-1">
                          {getMoodEmoji(entry.mood)}
                          <span>{getMoodLabel(entry.mood)}</span>
                        </span>
                      )}
                      {(entry.p1_physical || entry.p2_psychological || entry.p3_psychosocial || entry.p4_professional) && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {entry.p1_physical && (
                            <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">P1</span>
                          )}
                          {entry.p2_psychological && (
                            <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">P2</span>
                          )}
                          {entry.p3_psychosocial && (
                            <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">P3</span>
                          )}
                          {entry.p4_professional && (
                            <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800">P4</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{entry.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
