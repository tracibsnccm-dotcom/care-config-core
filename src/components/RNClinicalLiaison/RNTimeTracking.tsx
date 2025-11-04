import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Save, TrendingUp, Play, Pause, Square, Edit } from "lucide-react";
import { useRNTimer } from "@/hooks/useRNTimer";

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
  const timer = useRNTimer();
  const [activityType, setActivityType] = useState("");
  const [description, setDescription] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("timer");

  const selectedActivity = activityTypes.find(a => a.value === activityType);
  const currentMinutes = activeTab === "timer" ? timer.minutes : parseInt(manualTime) || 0;
  const estimatedSavings = selectedActivity && currentMinutes > 0
    ? Math.round(currentMinutes * selectedActivity.multiplier)
    : 0;

  const handleTimerSubmit = async () => {
    if (!activityType) {
      toast.error("Please select an activity type");
      return;
    }

    const timeSpentMinutes = timer.stop();
    if (timeSpentMinutes === 0) {
      toast.error("Timer must run for at least 1 minute");
      timer.reset();
      return;
    }

    await saveTimeEntry(timeSpentMinutes);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityType || !manualTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    await saveTimeEntry(parseInt(manualTime));
  };

  const saveTimeEntry = async (timeSpentMinutes: number) => {
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
        time_spent_minutes: timeSpentMinutes,
        estimated_attorney_time_saved_minutes: estimatedSavings,
        hourly_rate_used: 350,
      });

      if (error) throw error;

      toast.success("Time entry logged successfully");
      setActivityType("");
      setDescription("");
      setManualTime("");
      timer.reset();
    } catch (error) {
      console.error("Error logging time:", error);
      toast.error("Failed to log time entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Track Time on Case
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timer" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Timer
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          {/* Timer Tab */}
          <TabsContent value="timer" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="timer-activity-type">Activity Type *</Label>
                <Select value={activityType} onValueChange={setActivityType} disabled={timer.isRunning}>
                  <SelectTrigger id="timer-activity-type">
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
                <Label htmlFor="timer-description">Activity Description</Label>
                <Textarea
                  id="timer-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you're working on..."
                  rows={3}
                />
              </div>

              <Card className="p-6 bg-muted/50 border-primary/20">
                <div className="text-center space-y-4">
                  <div className="text-4xl font-mono font-bold text-primary">
                    {timer.formattedTime}
                  </div>
                  <div className="flex gap-2 justify-center">
                    {!timer.isRunning && timer.elapsedSeconds === 0 && (
                      <Button
                        onClick={timer.start}
                        disabled={!activityType}
                        className="flex-1 max-w-xs"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start Timer
                      </Button>
                    )}
                    {timer.isRunning && (
                      <Button onClick={timer.pause} variant="outline" className="flex-1 max-w-xs">
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </Button>
                    )}
                    {!timer.isRunning && timer.elapsedSeconds > 0 && (
                      <>
                        <Button onClick={timer.start} variant="outline">
                          <Play className="mr-2 h-4 w-4" />
                          Resume
                        </Button>
                        <Button
                          onClick={handleTimerSubmit}
                          disabled={loading}
                          className="flex-1"
                        >
                          <Square className="mr-2 h-4 w-4" />
                          {loading ? "Saving..." : "Stop & Save"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>

              {selectedActivity && timer.minutes > 0 && (
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
            </div>
          </TabsContent>

          {/* Manual Entry Tab */}
          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <Label htmlFor="manual-activity-type">Activity Type *</Label>
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger id="manual-activity-type">
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
                <Label htmlFor="manual-time">Time Spent (minutes) *</Label>
                <Input
                  id="manual-time"
                  type="number"
                  min="1"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  placeholder="30"
                />
              </div>

              <div>
                <Label htmlFor="manual-description">Activity Description</Label>
                <Textarea
                  id="manual-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you did..."
                  rows={3}
                />
              </div>

              {selectedActivity && manualTime && (
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
