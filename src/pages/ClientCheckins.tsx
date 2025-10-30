import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { LabeledInput } from "@/components/LabeledInput";
import { LabeledSelect } from "@/components/LabeledSelect";
import { Calendar, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { useClientCheckins } from "@/hooks/useClientCheckins";
import { CheckinChart } from "@/components/CheckinChart";
import { CheckinHistoryModal } from "@/components/CheckinHistoryModal";
import { createEmergencyAlert } from "@/lib/emergencyAlerts";

export default function ClientCheckins() {
  const { user } = useAuth();
  const [caseId, setCaseId] = useState<string>("");
  const [caseOptions, setCaseOptions] = useState<string[]>([]);
  const [pain, setPain] = useState(3);
  const [depression, setDepression] = useState(3);
  const [anxiety, setAnxiety] = useState(3);
  const [note, setNote] = useState("");
  const [quick4ps, setQuick4ps] = useState({
    physical: 50,
    psychological: 50,
    psychosocial: 50,
    purpose: 50,
  });
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const { checkins, loading, refetch } = useClientCheckins(caseId);

  // Get client's case on mount
  useEffect(() => {
    if (user) {
      fetchClientCase();
    }
  }, [user]);

  async function fetchClientCase() {
    try {
      const { data, error } = await supabase
        .from('case_assignments')
        .select('case_id')
        .eq('user_id', user!.id)
        .eq('role', 'CLIENT');

      if (error) throw error;
      const ids = (data || []).map((d: any) => d.case_id);
      setCaseOptions(ids);
      if (!caseId && ids.length) setCaseId(ids[0]);
    } catch (error: any) {
      console.error('Error fetching case:', error);
    }
  }

  async function submit() {
    if (!caseId || !user) {
      toast.error("Unable to submit check-in");
      return;
    }

    setSubmitting(true);
    try {
      // Insert check-in
      const { error } = await supabase
        .from('client_checkins')
        .insert({
          case_id: caseId,
          client_id: user.id,
          pain_scale: pain,
          depression_scale: depression,
          anxiety_scale: anxiety,
          note: note || null,
          p_physical: quick4ps.physical,
          p_psychological: quick4ps.psychological,
          p_psychosocial: quick4ps.psychosocial,
          p_purpose: quick4ps.purpose,
        });

      if (error) throw error;

      // Check for immediate alert thresholds
      const triggerImmediate = 
        pain >= 7 || 
        [quick4ps.physical, quick4ps.psychological, quick4ps.psychosocial, quick4ps.purpose].some(v => v <= 30);

      if (triggerImmediate) {
        const severity = pain >= 8 || Object.values(quick4ps).some(v => v <= 20) ? 'high' : 'medium';
        await createEmergencyAlert({
          caseId,
          clientId: user.id,
          alertType: 'wellness_check',
          severity: severity as 'high' | 'medium',
          internalMessage: `Check-in threshold exceeded: Pain ${pain}/10, Physical ${quick4ps.physical}, Psychological ${quick4ps.psychological}, Psychosocial ${quick4ps.psychosocial}, Purpose ${quick4ps.purpose}`,
          minimalMessage: `Recent client check-in suggests increased risk. Review recommended.`,
          metadata: { 
            pain_scale: pain, 
            fourPs: quick4ps,
            trigger: pain >= 7 ? 'high_pain' : 'low_4p'
          },
        });
        toast.warning("Alert sent to care team", {
          description: "Your care manager will review your check-in.",
        });
      }

      // Check for trend alert: 3 consecutive high-pain readings
      const { data: recentCheckins } = await supabase
        .from('client_checkins')
        .select('pain_scale')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentCheckins && recentCheckins.length === 3) {
        const allHighPain = recentCheckins.every(c => c.pain_scale >= 7);
        if (allHighPain) {
          await createEmergencyAlert({
            caseId,
            clientId: user.id,
            alertType: 'crisis',
            severity: 'critical',
            internalMessage: `Trend alert: sustained high pain. Pain ≥7 for 3 consecutive check-ins (${recentCheckins.map(c => c.pain_scale).join(', ')})`,
            minimalMessage: `Client experiencing sustained high pain levels. Immediate review recommended.`,
            metadata: {
              trigger: 'consecutive_high_pain',
              consecutive_count: 3,
              pain_scores: recentCheckins.map(c => c.pain_scale),
            },
          });
        }
      }

      if (!triggerImmediate) {
        toast.success("Check-in submitted successfully");
      }

      // Reset form
      setPain(3);
      setDepression(3);
      setAnxiety(3);
      setNote("");
      setQuick4ps({ physical: 50, psychological: 50, psychosocial: 50, purpose: 50 });
      
      refetch();
    } catch (error: any) {
      toast.error("Failed to submit check-in: " + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  const recentCheckins = checkins.slice(0, 5);

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Client Check-ins</h1>
          <p className="text-muted-foreground mt-1">Track pain levels and progress over time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Check-in Form */}
          <Card className="p-6 border-border lg:col-span-2">
            <h2 className="text-xl font-semibold text-foreground mb-6">Submit Check-in</h2>

            {!caseId ? (
              <p className="text-sm text-muted-foreground">Loading your case...</p>
            ) : (
              <div className="space-y-6">
                <LabeledSelect
                  label="Select Case"
                  value={caseId || "Select a case..."}
                  onChange={setCaseId}
                  options={["Select a case...", ...caseOptions]}
                />
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Pain Scale: {pain}/10
                  </Label>
                  <Slider
                    value={[pain]}
                    onValueChange={([value]) => setPain(value)}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>No Pain</span>
                    <span>Moderate</span>
                    <span>Severe</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Depression Scale: {depression}/10
                  </Label>
                  <Slider
                    value={[depression]}
                    onValueChange={([value]) => setDepression(value)}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Not at all</span>
                    <span>Moderate</span>
                    <span>Severe</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Anxiety Scale: {anxiety}/10
                  </Label>
                  <Slider
                    value={[anxiety]}
                    onValueChange={([value]) => setAnxiety(value)}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Not at all</span>
                    <span>Moderate</span>
                    <span>Severe</span>
                  </div>
                </div>

                <LabeledInput
                  label="Note (optional)"
                  value={note}
                  onChange={setNote}
                  placeholder="Short note about your condition..."
                />

                <div>
                  <Label className="text-sm font-medium mb-3 block">Quick 4P's Assessment</Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(["physical", "psychological", "psychosocial", "purpose"] as const).map(
                      (k) => (
                        <div key={k}>
                          <Label className="text-xs font-medium capitalize mb-2 block">
                            {k === 'purpose' ? 'professional' : k}: {quick4ps[k]}
                          </Label>
                          <Slider
                            value={[quick4ps[k]]}
                            onValueChange={([value]) =>
                              setQuick4ps((p) => ({ ...p, [k]: value }))
                            }
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>

                <Button onClick={submit} className="w-full" disabled={submitting}>
                  <Calendar className="w-4 h-4 mr-2" />
                  {submitting ? "Submitting..." : "Submit Check-in"}
                </Button>
              </div>
            )}
          </Card>

          {/* Recent Check-ins */}
          <Card className="p-6 border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recent Check-ins
              </h2>
              {caseId && checkins.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Full History
                </Button>
              )}
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading check-ins...</p>
            ) : !caseId ? (
              <p className="text-sm text-muted-foreground">No case assigned</p>
            ) : recentCheckins.length === 0 ? (
              <p className="text-sm text-muted-foreground">No check-ins yet</p>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {recentCheckins.map((checkin, idx) => {
                    const isPainIncreasing =
                      idx < recentCheckins.length - 1 &&
                      checkin.pain_scale > recentCheckins[idx + 1].pain_scale;
                    
                    return (
                      <div
                        key={checkin.id}
                        className="p-3 bg-muted rounded-lg border border-border"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-muted-foreground">
                            Submitted: {format(new Date(checkin.created_at), 'MMM dd yyyy · h:mm a')} CST
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              Pain: {checkin.pain_scale}/10
                            </span>
                            {isPainIncreasing && (
                              <AlertTriangle className="w-4 h-4 text-warning" />
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground mb-1">
                          {checkin.depression_scale !== null && (
                            <span>Depression: {checkin.depression_scale}/10</span>
                          )}
                          {checkin.anxiety_scale !== null && (
                            <span>Anxiety: {checkin.anxiety_scale}/10</span>
                          )}
                        </div>
                        {checkin.note && (
                          <p className="text-xs text-muted-foreground">{checkin.note}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {checkins.length > 0 && (
                  <div className="mt-4">
                    <CheckinChart checkins={checkins} maxEntries={7} title="Last 7 Check-ins" />
                  </div>
                )}

                <Alert className="mt-4">
                  <AlertDescription className="text-xs">
                    Tracking {checkins.length} total check-in
                    {checkins.length !== 1 ? "s" : ""}. Trends help identify escalating issues.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </Card>
        </div>
      </div>

      {caseId && (
        <CheckinHistoryModal 
          open={showHistory} 
          onOpenChange={setShowHistory} 
          caseId={caseId} 
        />
      )}
    </AppLayout>
  );
}
