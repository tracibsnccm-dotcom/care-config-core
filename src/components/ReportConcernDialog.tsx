import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReportConcernDialogProps {
  caseId: string;
  onSuccess?: () => void;
}

export function ReportConcernDialog({ caseId, onSuccess }: ReportConcernDialogProps) {
  const [concernAbout, setConcernAbout] = useState<string>("");
  const [concernDescription, setConcernDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!concernAbout || !concernDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the assigned RN for this case
      const { data: assignment } = await supabase
        .from("case_assignments")
        .select("user_id")
        .eq("case_id", caseId)
        .eq("role", "RN_CCM")
        .single();

      // Insert identified concern with client info
      const { error: insertError } = await supabase
        .from("concerns")
        .insert({
          case_id: caseId,
          client_id: user.id,
          concern_description: concernDescription.trim(),
          provider_name: concernAbout,
          concern_category: "care_concern",
          concern_status: "Open",
          assigned_rn: assignment?.user_id,
        });

      if (insertError) throw insertError;

      // Create in-app message notification for RN CM and Admin
      if (assignment?.user_id && concernAbout !== "RN_CCM") {
        await supabase.from("messages").insert({
          case_id: caseId,
          sender_id: user.id,
          recipient_role: "RN_CCM",
          subject: "New Concern Reported",
          message_text: `A client has reported a concern about ${concernAbout}. Please review in the Concerns section.`,
          status: "pending",
        });
      }

      // Audit log
      await supabase.from("audit_logs").insert({
        action: "concern_reported",
        case_id: caseId,
        actor_id: user.id,
        actor_role: "CLIENT",
        meta: {
          concern_about: concernAbout,
        },
      });

      toast({
        title: "Concern Submitted",
        description: "Thank you for sharing your concern. We'll review it promptly.",
      });

      // Reset form
      setConcernAbout("");
      setConcernDescription("");
      
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting concern:", error);
      toast({
        title: "Submission Failed",
        description: "Unable to submit your concern. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle>Report a Concern</CardTitle>
        </div>
        <CardDescription>
          Share a concern about your care or experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your concern will be reviewed by our care team and routed to the appropriate personnel for follow-up.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="concern-about" className="required">
              Who is the concern about?
            </Label>
            <Select value={concernAbout} onValueChange={setConcernAbout}>
              <SelectTrigger id="concern-about">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RN_CCM">RN Care Manager</SelectItem>
                <SelectItem value="ATTORNEY">Attorney</SelectItem>
                <SelectItem value="PROVIDER">Provider</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concern-description" className="required">
              Describe your concern
            </Label>
            <Textarea
              id="concern-description"
              value={concernDescription}
              onChange={(e) => setConcernDescription(e.target.value)}
              placeholder="Please provide details about your concern..."
              className="min-h-[150px]"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Concern"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
