import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";

interface ProviderCommentBoxProps {
  caseId?: string;
}

export function ProviderCommentBox({ caseId }: ProviderCommentBoxProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    if (!caseId) {
      toast.error("Please select a case first");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("provider_notes").insert([
        {
          case_id: caseId,
          provider_id: user!.id,
          note_content: comment.trim(),
          note_title: "Provider Comment",
        },
      ]);

      if (error) throw error;

      toast.success("Comment submitted successfully");
      setComment("");
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      toast.error("Failed to submit comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Comments & Notes</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Add comments or notes about this case for the RN Care Manager to review
      </p>
      <div className="space-y-4">
        <div>
          <Label htmlFor="comment">Your Comment</Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter your comments or observations about this case..."
            rows={6}
            maxLength={500}
            className="resize-none"
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">
              {comment.length} / 500 characters
            </p>
            {comment.length > 450 && (
              <p className="text-xs text-warning">
                {500 - comment.length} characters remaining
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !comment.trim() || !caseId}
          className="w-full bg-primary hover:bg-primary-dark"
        >
          <Send className="w-4 h-4 mr-2" />
          {submitting ? "Submitting..." : "Submit Comment"}
        </Button>
      </div>
    </Card>
  );
}
