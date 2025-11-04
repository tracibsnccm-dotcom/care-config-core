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
import { Save, X } from "lucide-react";

interface DiaryEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  entry?: any;
  caseId?: string;
  prefillData?: Partial<DiaryEntryFormData>;
}

export function DiaryEntryForm({ open, onOpenChange, onSuccess, entry, caseId, prefillData }: DiaryEntryFormProps) {
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

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Client follow-up call"
              />
              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="entry-type">Entry Type *</Label>
              <Select value={formData.entry_type} onValueChange={(value) => setFormData({ ...formData, entry_type: value })}>
                <SelectTrigger id="entry-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone_call">Phone Call</SelectItem>
                  <SelectItem value="text_message">Text Message</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="fax">Fax</SelectItem>
                  <SelectItem value="client_followup">Client Follow-up</SelectItem>
                  <SelectItem value="provider_coordination">Provider Coordination</SelectItem>
                  <SelectItem value="appointment_confirmation">Appointment Confirmation</SelectItem>
                  <SelectItem value="medication_reconciliation">Medication Reconciliation</SelectItem>
                  <SelectItem value="care_plan_review">Care Plan Review</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.entry_type && <p className="text-xs text-destructive mt-1">{errors.entry_type}</p>}
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger id="priority">
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

            <div>
              <Label htmlFor="scheduled-date">Scheduled Date *</Label>
              <Input
                id="scheduled-date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
              {errors.scheduled_date && <p className="text-xs text-destructive mt-1">{errors.scheduled_date}</p>}
            </div>

            <div>
              <Label htmlFor="scheduled-time">Time (Optional)</Label>
              <Input
                id="scheduled-time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details about this entry..."
              rows={3}
            />
          </div>

          {/* Contact Information */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                id="requires-contact"
                checked={formData.requires_contact}
                onCheckedChange={(checked) => setFormData({ ...formData, requires_contact: !!checked })}
              />
              <Label htmlFor="requires-contact" className="cursor-pointer">This entry requires contact information</Label>
            </div>

            {formData.requires_contact && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="col-span-2">
                  <Label htmlFor="contact-name">Contact Name</Label>
                  <Input
                    id="contact-name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Provider or client name"
                  />
                </div>

                <div>
                  <Label htmlFor="contact-phone">Phone Number</Label>
                  <Input
                    id="contact-phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                  {errors.contact_phone && <p className="text-xs text-destructive mt-1">{errors.contact_phone}</p>}
                </div>

                <div>
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="contact@example.com"
                  />
                  {errors.contact_email && <p className="text-xs text-destructive mt-1">{errors.contact_email}</p>}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Office address or phone number location"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Reminder Settings */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                id="reminder-enabled"
                checked={formData.reminder_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: !!checked })}
              />
              <Label htmlFor="reminder-enabled" className="cursor-pointer">Set reminder</Label>
            </div>

            {formData.reminder_enabled && (
              <div>
                <Label htmlFor="reminder-time">Remind me before</Label>
                <Select 
                  value={formData.reminder_minutes_before?.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, reminder_minutes_before: parseInt(value) })}
                >
                  <SelectTrigger id="reminder-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="1440">1 day</SelectItem>
                    <SelectItem value="2880">2 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Recurring Entry */}
          <DiaryRecurringEntry
            isRecurring={formData.is_recurring || false}
            onRecurringChange={(value) => setFormData({ ...formData, is_recurring: value })}
            recurrencePattern={formData.recurrence_pattern || ""}
            onPatternChange={(value) => setFormData({ ...formData, recurrence_pattern: value as any })}
            recurrenceEndDate={formData.recurrence_end_date || ""}
            onEndDateChange={(value) => setFormData({ ...formData, recurrence_end_date: value })}
          />

          {/* Visibility */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="shared-supervisor"
              checked={formData.shared_with_supervisor}
              onCheckedChange={(checked) => setFormData({ ...formData, shared_with_supervisor: !!checked })}
            />
            <Label htmlFor="shared-supervisor" className="cursor-pointer">Share with supervisor</Label>
          </div>
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
