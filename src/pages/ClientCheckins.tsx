import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { LabeledSelect } from "@/components/LabeledSelect";
import { LabeledInput } from "@/components/LabeledInput";
import { useApp } from "@/context/AppContext";
import { FourPs } from "@/config/rcms";
import { Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fmtDate } from "@/lib/store";
import { Sparkline } from "@/components/Sparkline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export default function ClientCheckins() {
  const { cases, setCases, log } = useApp();
  const [forCase, setForCase] = useState(cases[0]?.id ?? "");
  const [pain, setPain] = useState(3);
  const [depression, setDepression] = useState(0);
  const [anxiety, setAnxiety] = useState(0);
  const [note, setNote] = useState("");
  const [quick4ps, setQuick4ps] = useState<FourPs>({
    physical: 50,
    psychological: 50,
    psychosocial: 50,
    professional: 50,
  });

  async function submit() {
    if (!forCase) {
      toast.error("Please select a case");
      return;
    }

    try {
      // Insert check-in to database
      const { data: checkinData, error: checkinError } = await supabase
        .from("client_checkins")
        .insert({
          case_id: forCase,
          client_id: (await supabase.auth.getUser()).data.user?.id,
          pain_scale: pain,
          depression_scale: depression,
          anxiety_scale: anxiety,
          p_physical: quick4ps.physical,
          p_psychological: quick4ps.psychological,
          p_psychosocial: quick4ps.psychosocial,
          p_purpose: quick4ps.professional,
          note: note || null,
        })
        .select()
        .single();

      if (checkinError) throw checkinError;

      // Check for immediate alerts
      const alerts = [];
      const caseObj = cases.find((x) => x.id === forCase);
      const clientName = caseObj?.client?.displayNameMasked || caseObj?.client?.attyRef || "Client";

      if (pain >= 7) {
        alerts.push({
          case_id: forCase,
          alert_type: "pain_threshold",
          severity: "high",
          message: `${clientName} reported pain level ${pain}/10. Review recommended.`,
          disclosure_scope: "internal",
          metadata: { pain, depression, anxiety, timestamp: new Date().toISOString() },
        });
      }

      if (depression >= 7) {
        alerts.push({
          case_id: forCase,
          alert_type: "depression_threshold",
          severity: "high",
          message: `${clientName} reported depression level ${depression}/10. Review recommended.`,
          disclosure_scope: "internal",
          metadata: { pain, depression, anxiety, timestamp: new Date().toISOString() },
        });
      }

      if (anxiety >= 7) {
        alerts.push({
          case_id: forCase,
          alert_type: "anxiety_threshold",
          severity: "high",
          message: `${clientName} reported anxiety level ${anxiety}/10. Review recommended.`,
          disclosure_scope: "internal",
          metadata: { pain, depression, anxiety, timestamp: new Date().toISOString() },
        });
      }

      // Check 4P scores
      const low4Ps = Object.entries(quick4ps).filter(([_, value]) => value <= 30);
      if (low4Ps.length > 0) {
        const dimensions = low4Ps.map(([key]) => key).join(", ");
        alerts.push({
          case_id: forCase,
          alert_type: "4p_low_score",
          severity: "medium",
          message: `${clientName} has low 4P scores (${dimensions} ≤ 30). RN review recommended.`,
          disclosure_scope: "internal",
          metadata: { fourPs: quick4ps, timestamp: new Date().toISOString() },
        });
      }

      // Check for trend alerts (3 consecutive high readings)
      const { data: recentCheckins } = await supabase
        .from("client_checkins")
        .select("pain_scale, depression_scale, anxiety_scale")
        .eq("case_id", forCase)
        .order("created_at", { ascending: false })
        .limit(3);

      if (recentCheckins && recentCheckins.length === 3) {
        const allPainHigh = recentCheckins.every((c) => c.pain_scale >= 7);
        const allDepressionHigh = recentCheckins.every((c) => c.depression_scale >= 7);
        const allAnxietyHigh = recentCheckins.every((c) => c.anxiety_scale >= 7);

        if (allPainHigh) {
          alerts.push({
            case_id: forCase,
            alert_type: "pain_trend",
            severity: "critical",
            message: `${clientName} has reported pain ≥ 7 for 3 consecutive check-ins. Immediate review required.`,
            disclosure_scope: "internal",
            metadata: { trend: "pain", checkins: recentCheckins, timestamp: new Date().toISOString() },
          });
        }

        if (allDepressionHigh) {
          alerts.push({
            case_id: forCase,
            alert_type: "depression_trend",
            severity: "critical",
            message: `${clientName} has reported depression ≥ 7 for 3 consecutive check-ins. Immediate review required.`,
            disclosure_scope: "internal",
            metadata: { trend: "depression", checkins: recentCheckins, timestamp: new Date().toISOString() },
          });
        }

        if (allAnxietyHigh) {
          alerts.push({
            case_id: forCase,
            alert_type: "anxiety_trend",
            severity: "critical",
            message: `${clientName} has reported anxiety ≥ 7 for 3 consecutive check-ins. Immediate review required.`,
            disclosure_scope: "internal",
            metadata: { trend: "anxiety", checkins: recentCheckins, timestamp: new Date().toISOString() },
          });
        }
      }

      // Insert all alerts
      if (alerts.length > 0) {
        const { error: alertError } = await supabase.from("case_alerts").insert(alerts);
        if (alertError) console.error("Error creating alerts:", alertError);
      }

      // Update local state for UI
      setCases((arr) =>
        arr.map((c) =>
          c.id === forCase
            ? {
                ...c,
                checkins: [
                  ...(c.checkins || []),
                  { ts: new Date().toISOString(), pain, depression, anxiety, note, fourPs: quick4ps },
                ],
                status: c.status === "NEW" ? "IN_PROGRESS" : c.status,
              }
            : c
        )
      );
      log("CHECKIN_SUBMIT", forCase);

      toast.success("Check-in submitted successfully");
      if (alerts.length > 0) {
        toast.info(`${alerts.length} alert(s) created for RN review`);
      }

      // Reset form
      setPain(3);
      setDepression(0);
      setAnxiety(0);
      setNote("");
      setQuick4ps({ physical: 50, psychological: 50, psychosocial: 50, professional: 50 });
    } catch (error) {
      console.error("Error submitting check-in:", error);
      toast.error("Failed to submit check-in. Please try again.");
    }
  }

  const selectedCase = cases.find((c) => c.id === forCase);
  const recentCheckins = selectedCase?.checkins?.slice(-5).reverse() ?? [];

  // Progress tracker helpers (client-side only, original data)
  type Period = 'day' | 'week' | 'month';
  function bucket(ts: string, period: Period) {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    if (period === 'day') return `${y}-${m}-${day}`;
    if (period === 'week') {
      // ISO week approximation
      const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = (tmp.getUTCDay() + 6) % 7;
      tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3);
      const firstThursday = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4));
      const week = 1 + Math.round(((tmp.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
      return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
    }
    return `${y}-${m}`; // month
  }
  function toSeries(period: Period) {
    const map: Record<string, number[]> = {};
    (selectedCase?.checkins || []).forEach(ci => {
      const b = bucket(ci.ts, period);
      if (!map[b]) map[b] = [];
      map[b].push(ci.pain);
    });
    const entries = Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, arr]) => ({ label: k, value: Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 100) / 100 }));
    return entries;
  }

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

            <div className="space-y-6">
              <LabeledSelect
                label="Select Case"
                value={forCase || "Select a case..."}
                onChange={setForCase}
                options={["Select a case...", ...cases.map((c) => c.id)]}
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
                  How depressed or down did you feel today? {depression}/10
                </Label>
                <Slider
                  value={[depression]}
                  onValueChange={([value]) => setDepression(value)}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>0 = not at all, 10 = extremely</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  How anxious or nervous did you feel today? {anxiety}/10
                </Label>
                <Slider
                  value={[anxiety]}
                  onValueChange={([value]) => setAnxiety(value)}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>0 = not at all, 10 = extremely</span>
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
                  {(["physical", "psychological", "psychosocial", "professional"] as const).map(
                    (k) => (
                      <div key={k}>
                        <Label className="text-xs font-medium capitalize mb-2 block">
                          {k}: {quick4ps[k]}
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

              <Button onClick={submit} className="w-full" disabled={!forCase}>
                <Calendar className="w-4 h-4 mr-2" />
                Submit Check-in
              </Button>
            </div>
          </Card>

          {/* Right column */}
          <div className="space-y-6">
            {/* Recent Check-ins */}
            <Card className="p-6 border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recent Check-ins
              </h2>

              {!selectedCase ? (
                <p className="text-sm text-muted-foreground">Select a case to view history</p>
              ) : recentCheckins.length === 0 ? (
                <p className="text-sm text-muted-foreground">No check-ins yet</p>
              ) : (
                <div className="space-y-3">
                  {recentCheckins.map((checkin, idx) => {
                    const isPainIncreasing =
                      idx < recentCheckins.length - 1 &&
                      checkin.pain > recentCheckins[idx + 1].pain;
                    
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-muted rounded-lg border border-border"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-muted-foreground">
                            {fmtDate(checkin.ts)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              Pain: {checkin.pain}/10
                            </span>
                            {isPainIncreasing && (
                              <AlertTriangle className="w-4 h-4 text-warning" />
                            )}
                          </div>
                        </div>
                        {checkin.note && (
                          <p className="text-xs text-muted-foreground">{checkin.note}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedCase && recentCheckins.length > 0 && (
                <Alert className="mt-4">
                  <AlertDescription className="text-xs">
                    Tracking {recentCheckins.length} recent check-in
                    {recentCheckins.length !== 1 ? "s" : ""}. Trends help identify escalating
                    issues.
                  </AlertDescription>
                </Alert>
              )}
            </Card>

            {/* 📈 Progress Tracker */}
            <Card className="p-6 border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">📈 Progress Tracker</h2>
              {!selectedCase || (selectedCase.checkins || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                <Tabs defaultValue="day">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="day">Daily</TabsTrigger>
                    <TabsTrigger value="week">Weekly</TabsTrigger>
                    <TabsTrigger value="month">Monthly</TabsTrigger>
                  </TabsList>
                  {(["day", "week", "month"] as const).map((p) => {
                    const s = toSeries(p);
                    return (
                      <TabsContent key={p} value={p}>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">{s.length} points</div>
                          <div className="text-sm font-medium">Avg pain trend</div>
                        </div>
                        <div className="mt-2">
                          <Sparkline values={s.map((x) => x.value)} width={300} height={48} />
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
