import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/auth/supabaseAuth";
import { FileText } from "lucide-react";

interface AppointmentNotesFormProps {
  appointmentId: string;
  caseId: string;
  onSuccess?: () => void;
}

export function AppointmentNotesForm({
  appointmentId,
  caseId,
  onSuccess,
}: AppointmentNotesFormProps) {
  const { user } = useAuth();
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [followUpInstructions, setFollowUpInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!clinicalNotes.trim()) {
      toast.error("Please enter clinical notes");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("appointment_notes").insert({
        appointment_id: appointmentId,
        provider_id: user.id,
        case_id: caseId,
        clinical_notes: clinicalNotes.trim(),
        follow_up_needed: followUpNeeded,
        follow_up_instructions: followUpInstructions.trim() || null,
      });

      if (error) throw error;

      toast.success("Appointment notes saved successfully");
      setClinicalNotes("");
      setFollowUpNeeded(false);
      setFollowUpInstructions("");
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        Post-Appointment Notes
      </h3>

      <div className="space-y-4">
        <div>
          <Label htmlFor="clinical-notes">Clinical Notes *</Label>
          <Textarea
            id="clinical-notes"
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Document assessment, treatment provided, observations..."
            rows={6}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {clinicalNotes.length} characters
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="follow-up"
            checked={followUpNeeded}
            onCheckedChange={(checked) => setFollowUpNeeded(checked as boolean)}
          />
          <Label htmlFor="follow-up" className="cursor-pointer">
            Follow-up appointment needed
          </Label>
        </div>

        {followUpNeeded && (
          <div>
            <Label htmlFor="follow-up-instructions">Follow-up Instructions</Label>
            <Textarea
              id="follow-up-instructions"
              value={followUpInstructions}
              onChange={(e) => setFollowUpInstructions(e.target.value)}
              placeholder="Recommended timeline, specific tests or treatments needed..."
              rows={3}
              className="mt-2"
            />
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={submitting || !clinicalNotes.trim()}
          className="w-full"
        >
          {submitting ? "Saving..." : "Save Notes"}
        </Button>
      </div>
    </Card>
  );
}
