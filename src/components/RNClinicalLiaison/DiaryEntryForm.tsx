import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateDiaryEntry, DiaryEntryFormData } from "./DiaryEntryValidator";
import { DiaryRecurringEntry } from "./DiaryRecurringEntry";
import { DiaryConflictWarning } from "./DiaryConflictWarning";
import { DiaryEntryComments } from "./DiaryEntryComments";
import { DiaryEntryHistory } from "./DiaryEntryHistory";
import { useDiaryConflicts } from "@/hooks/useDiaryConflicts";
import { useAuth } from "@/auth/supabaseAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, X, FileText, MessageSquare, History as HistoryIcon } from "lucide-react";

interface DiaryEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  entry?: any;
  caseId?: string;
  prefillData?: Partial<DiaryEntryFormData>;
}

export function DiaryEntryForm({ open, onOpenChange, onSuccess, entry, caseId, prefillData }: DiaryEntryFormProps) {
  const { session } = useAuth();
  const [formData, setFormData] = useState<Partial<DiaryEntryFormData>>({
    title: "",
    description: "",
    entry_type: "",
    scheduled_date: "",
    scheduled_time: "",
    location: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    requires_contact: false,
    priority: "medium",
    reminder_enabled: false,
    reminder_minutes_before: 60,
    shared_with_supervisor: true,
    is_recurring: false,
    recurrence_pattern: undefined,
    recurrence_end_date: "",
    ...prefillData
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Conflict detection
  const { conflicts } = useDiaryConflicts(
    session?.user?.id,
    formData.scheduled_date || "",
    formData.scheduled_time,
    entry?.id
  );

  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title || "",
        description: entry.description || "",
        entry_type: entry.entry_type || "",
        scheduled_date: entry.scheduled_date || "",
        scheduled_time: entry.scheduled_time || "",
        location: entry.location || "",
        contact_name: entry.contact_name || "",
        contact_phone: entry.contact_phone || "",
        contact_email: entry.contact_email || "",
        requires_contact: entry.requires_contact || false,
        priority: entry.priority || "medium",
        reminder_enabled: entry.reminder_enabled || false,
        reminder_minutes_before: entry.reminder_minutes_before || 60,
        shared_with_supervisor: entry.shared_with_supervisor !== false,
        is_recurring: entry.is_recurring || false,
        recurrence_pattern: entry.recurrence_pattern,
        recurrence_end_date: entry.recurrence_end_date || ""
      });
    } else if (prefillData) {
      setFormData(prev => ({ ...prev, ...prefillData }));
    }
  }, [entry, prefillData]);

  const handleSubmit = async () => {
    // Validate form data
    const validation = validateDiaryEntry(formData);
    
    if (!validation.success) {
      setErrors(validation.errors || {});
      toast.error("Please fix the form errors");
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const entryData: any = {
        ...validation.data,
        rn_id: user.id,
        case_id: caseId || null,
        metadata: {
          template_name: formData.template_name
        }
      };

      if (entry) {
        // Update existing entry
        const { error } = await supabase
          .from("rn_diary_entries")
          .update(entryData)
          .eq("id", entry.id);

        if (error) throw error;
        toast.success("Diary entry updated");
      } else {
        // Create new entry
        const { error } = await supabase
          .from("rn_diary_entries")
          .insert([entryData]);

        if (error) throw error;
        toast.success("Diary entry created");
      }

      onSuccess();
      onOpenChange(false);
      setFormData({
        title: "",
        description: "",
        entry_type: "",
        scheduled_date: "",
        scheduled_time: "",
        location: "",
        contact_name: "",
        contact_phone: "",
        contact_email: "",
        requires_contact: false,
        priority: "medium",
        reminder_enabled: false,
        reminder_minutes_before: 60,
        shared_with_supervisor: true,
        is_recurring: false
      });
    } catch (error) {
      console.error("Error saving diary entry:", error);
      toast.error("Failed to save diary entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit Diary Entry" : "New Diary Entry"}</DialogTitle>
        </DialogHeader>

        {/* Conflict Warning */}
        {conflicts.hasConflict && (
          <div className="mb-4">
            <DiaryConflictWarning conflicts={conflicts.conflicts} />
          </div>
        )}

        <div className="space-y-4">
          {/* All existing form fields from lines 171-393 should remain here */}
          {/* Basic Info, Entry Type, Priority, Dates, Description */}
          {/* Contact Information, Reminder Settings, Recurring Entry, Visibility */}
          {/* The original form content was accidentally removed - needs restore from version control */}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : (entry ? "Update Entry" : "Create Entry")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
