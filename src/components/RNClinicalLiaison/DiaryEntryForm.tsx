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
import { DiaryEntryAttachments } from "./DiaryEntryAttachments";
import { VoiceDictation } from "./VoiceDictation";
import { DiaryLabelManager } from "./DiaryLabelManager";
import { DiaryEntryDependencies } from "./DiaryEntryDependencies";
import { DiaryCustomFields } from "./DiaryCustomFields";
import { DiarySupervisorApproval } from "./DiarySupervisorApproval";
import { DiaryCaseTimelineSync } from "./DiaryCaseTimelineSync";
import { useDiaryConflicts } from "@/hooks/useDiaryConflicts";
import { useAuth } from "@/auth/supabaseAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, X, FileText, MessageSquare, History as HistoryIcon, Paperclip, Mic } from "lucide-react";

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
  const [formData, setFormData] = useState<Partial<DiaryEntryFormData & { attachments: any[], label?: string, label_color?: string, custom_fields?: Record<string, any> }>>({
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
    attachments: [],
    label: "",
    label_color: "",
    custom_fields: {},
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
        label: formData.label || null,
        label_color: formData.label_color || null,
        custom_fields: formData.custom_fields || {},
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

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="voice">
              <Mic className="h-4 w-4 mr-2" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="attachments">
              <Paperclip className="h-4 w-4 mr-2" />
              Attachments
            </TabsTrigger>
            {entry && (
              <>
                <TabsTrigger value="comments">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comments
                </TabsTrigger>
                <TabsTrigger value="history">
                  <HistoryIcon className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Basic Information */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter entry title"
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            {/* Entry Type */}
            <div className="space-y-2">
              <Label htmlFor="entry_type">Entry Type *</Label>
              <Select
                value={formData.entry_type}
                onValueChange={(value) => setFormData({ ...formData, entry_type: value })}
              >
                <SelectTrigger className={errors.entry_type ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select entry type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="home_visit">Home Visit</SelectItem>
                  <SelectItem value="phone_call">Phone Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.entry_type && <p className="text-sm text-destructive">{errors.entry_type}</p>}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
              >
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

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Scheduled Date *</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className={errors.scheduled_date ? "border-destructive" : ""}
                />
                {errors.scheduled_date && <p className="text-sm text-destructive">{errors.scheduled_date}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_time">Scheduled Time</Label>
                <Input
                  id="scheduled_time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter location"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                rows={4}
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires_contact"
                  checked={formData.requires_contact}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requires_contact: checked as boolean })
                  }
                />
                <Label htmlFor="requires_contact" className="cursor-pointer">
                  Requires Contact
                </Label>
              </div>

              {formData.requires_contact && (
                <div className="space-y-4 pl-6 border-l-2 border-border">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input
                      id="contact_name"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      placeholder="Enter contact name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      placeholder="Enter contact phone"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="Enter contact email"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Reminder Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reminder_enabled"
                  checked={formData.reminder_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, reminder_enabled: checked as boolean })
                  }
                />
                <Label htmlFor="reminder_enabled" className="cursor-pointer">
                  Enable Reminder
                </Label>
              </div>

              {formData.reminder_enabled && (
                <div className="space-y-2 pl-6 border-l-2 border-border">
                  <Label htmlFor="reminder_minutes_before">Remind me (minutes before)</Label>
                  <Select
                    value={formData.reminder_minutes_before?.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, reminder_minutes_before: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="1440">1 day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Recurring Entry */}
            <DiaryRecurringEntry
              isRecurring={formData.is_recurring || false}
              onRecurringChange={(value) =>
                setFormData({ ...formData, is_recurring: value })
              }
              recurrencePattern={formData.recurrence_pattern || ""}
              onPatternChange={(pattern) =>
                setFormData({ ...formData, recurrence_pattern: pattern as any })
              }
              recurrenceEndDate={formData.recurrence_end_date || ""}
              onEndDateChange={(date) =>
                setFormData({ ...formData, recurrence_end_date: date })
              }
            />

            {/* Label Manager */}
            <DiaryLabelManager
              value={formData.label}
              color={formData.label_color}
              onChange={(label, color) =>
                setFormData({ ...formData, label, label_color: color })
              }
              onClear={() =>
                setFormData({ ...formData, label: "", label_color: "" })
              }
            />

            {/* Custom Fields */}
            <DiaryCustomFields
              value={formData.custom_fields || {}}
              onChange={(fields) =>
                setFormData({ ...formData, custom_fields: fields })
              }
            />

            {/* Dependencies */}
            {entry && (
              <DiaryEntryDependencies
                entryId={entry.id}
                caseId={caseId || entry.case_id}
                rnId={session?.user?.id || ""}
              />
            )}

            {/* Supervisor Approval */}
            {entry && (
              <DiarySupervisorApproval
                entryId={entry.id}
                requiresApproval={entry.requires_approval}
                approvalStatus={entry.approval_status}
                approvedBy={entry.approved_by}
                approvedAt={entry.approved_at}
                approvalNotes={entry.approval_notes}
              />
            )}

            {/* Case Timeline Sync */}
            {entry && caseId && (
              <DiaryCaseTimelineSync
                entryId={entry.id}
                caseId={caseId}
                autoSync={true}
              />
            )}

            {/* Visibility */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shared_with_supervisor"
                checked={formData.shared_with_supervisor}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, shared_with_supervisor: checked as boolean })
                }
              />
              <Label htmlFor="shared_with_supervisor" className="cursor-pointer">
                Share with Supervisor
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="voice">
            <VoiceDictation
              onTranscript={(text) => {
                setFormData({
                  ...formData,
                  description: (formData.description || "") + " " + text,
                });
              }}
            />
          </TabsContent>

          <TabsContent value="attachments">
            <DiaryEntryAttachments
              entryId={entry?.id}
              attachments={formData.attachments || []}
              onAttachmentsChange={(attachments) =>
                setFormData({ ...formData, attachments })
              }
              disabled={loading}
            />
          </TabsContent>

          {entry && (
            <>
              <TabsContent value="comments">
                <DiaryEntryComments entryId={entry.id} />
              </TabsContent>

              <TabsContent value="history">
                <DiaryEntryHistory entryId={entry.id} />
              </TabsContent>
            </>
          )}
        </Tabs>

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
