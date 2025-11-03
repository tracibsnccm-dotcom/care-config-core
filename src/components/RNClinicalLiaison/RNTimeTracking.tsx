import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Save, TrendingUp } from "lucide-react";

interface RNTimeTrackingProps {
  caseId: string;
  attorneyId?: string;
}

const activityTypes = [
  { value: "medical_record_review", label: "Medical Record Review", multiplier: 2.5 },
  { value: "provider_communication", label: "Provider Communication", multiplier: 3 },
  { value: "appointment_coordination", label: "Appointment Coordination", multiplier: 2 },
  { value: "treatment_plan_review", label: "Treatment Plan Review", multiplier: 2.5 },
  { value: "insurance_authorization", label: "Insurance Authorization", multiplier: 4 },
  { value: "care_plan_development", label: "Care Plan Development", multiplier: 2 },
  { value: "client_education", label: "Client Education", multiplier: 1.5 },
  { value: "documentation", label: "Clinical Documentation", multiplier: 1.8 },
  { value: "case_research", label: "Case Research", multiplier: 2 },
  { value: "team_coordination", label: "Team Coordination", multiplier: 1.5 },
];

export function RNTimeTracking({ caseId, attorneyId }: RNTimeTrackingProps) {
  const [activityType, setActivityType] = useState("");
  const [description, setDescription] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedActivity = activityTypes.find(a => a.value === activityType);
  const estimatedSavings = selectedActivity && timeSpent 
    ? Math.round(parseFloat(timeSpent) * selectedActivity.multiplier)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityType || !timeSpent) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("rn_time_entries").insert({
        case_id: caseId,
        rn_user_id: user.id,
        attorney_id: attorneyId,
        activity_type: activityType,
        activity_description: description,
        time_spent_minutes: parseInt(timeSpent),
        estimated_attorney_time_saved_minutes: estimatedSavings,
        hourly_rate_used: 350, // Default attorney hourly rate
      });

      if (error) throw error;

      toast.success("Time entry logged successfully");
      setActivityType("");
      setDescription("");
      setTimeSpent("");
    } catch (error) {
      console.error("Error logging time:", error);
      toast.error("Failed to log time entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Log Time Entry</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="activity-type">Activity Type *</Label>
          <Select value={activityType} onValueChange={setActivityType}>
            <SelectTrigger>
              <SelectValue placeholder="Select activity type" />
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map((activity) => (
                <SelectItem key={activity.value} value={activity.value}>
                  {activity.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="time-spent">Time Spent (minutes) *</Label>
          <Input
            id="time-spent"
            type="number"
            min="1"
            value={timeSpent}
            onChange={(e) => setTimeSpent(e.target.value)}
            placeholder="30"
          />
        </div>

        <div>
          <Label htmlFor="description">Activity Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you did..."
            rows={3}
          />
        </div>

        {selectedActivity && timeSpent && (
          <Card className="p-4 bg-muted/50 border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium">Estimated Value</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Based on typical attorney time for this activity
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Attorney Time Saved</div>
                <div className="text-xl font-bold text-primary">{estimatedSavings} min</div>
              </div>
              <div>
                <div className="text-muted-foreground">Estimated Cost Savings</div>
                <div className="text-xl font-bold text-green-600">
                  ${Math.round((estimatedSavings / 60) * 350)}
                </div>
              </div>
            </div>
          </Card>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Log Time Entry"}
        </Button>
      </form>
    </Card>
  );
}
