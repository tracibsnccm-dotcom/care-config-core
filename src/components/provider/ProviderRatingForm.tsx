import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/auth/supabaseAuth";

interface ProviderRatingFormProps {
  providerId: string;
  appointmentId?: string;
  onSuccess?: () => void;
}

export function ProviderRatingForm({ providerId, appointmentId, onSuccess }: ProviderRatingFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to submit a rating");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("provider_ratings").insert({
        provider_id: providerId,
        client_id: user.id,
        appointment_id: appointmentId,
        rating,
        review_text: reviewText.trim() || null,
      });

      if (error) throw error;

      toast.success("Thank you for your feedback!");
      setRating(0);
      setReviewText("");
      onSuccess?.();
    } catch (error: any) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Rate Your Experience</h3>

      {/* Star Rating */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hoveredRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">
          Share your experience (optional)
        </label>
        <Textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="How was your appointment? What did you appreciate?"
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {reviewText.length}/500 characters
        </p>
      </div>

      <Button onClick={handleSubmit} disabled={submitting || rating === 0} className="w-full">
        {submitting ? "Submitting..." : "Submit Rating"}
      </Button>
    </Card>
  );
}
