import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { LabeledSelect } from "@/components/LabeledSelect";
import { LabeledInput } from "@/components/LabeledInput";
import { LabeledTextarea } from "@/components/LabeledTextarea";
import { useApp } from "@/context/AppContext";
import { FourPs } from "@/config/rcms";
import { Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fmtDate } from "@/lib/store";
import { Sparkline } from "@/components/Sparkline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export default function ClientCheckins() {
  const { cases, setCases, log } = useApp();
  const [forCase, setForCase] = useState(cases[0]?.id ?? "");
  const [pain, setPain] = useState(3);
  const [depression, setDepression] = useState(0);
  const [anxiety, setAnxiety] = useState(0);
  const [note, setNote] = useState("");
  const [quick4ps, setQuick4ps] = useState<FourPs>({
    physical: 2,
    psychological: 2,
    psychosocial: 2,
    professional: 2,
  });

  // SDOH state (0-4 scale)
  const [sdohScores, setSdohScores] = useState({
    housing: 0,
    food: 0,
    transport: 0,
    insurance: 0,
    financial: 0,
    employment: 0,
    social_support: 0,
    safety: 0,
    healthcare_access: 0,
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
          p_physical: quick4ps.physical * 25,
          p_psychological: quick4ps.psychological * 25,
          p_psychosocial: quick4ps.psychosocial * 25,
          p_purpose: quick4ps.professional * 25,
          // Add SDOH tracking
          sdoh_housing: sdohScores.housing,
          sdoh_food: sdohScores.food,
          sdoh_transport: sdohScores.transport,
          sdoh_insurance: sdohScores.insurance,
          sdoh_financial: sdohScores.financial,
          sdoh_employment: sdohScores.employment,
          sdoh_social_support: sdohScores.social_support,
          sdoh_safety: sdohScores.safety,
          sdoh_healthcare_access: sdohScores.healthcare_access,
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

      // Check 4P scores (convert to 0-100 for thresholding)
      const low4Ps = Object.entries(quick4ps).filter(([_, value]) => (value * 25) <= 30);
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
      setQuick4ps({ physical: 2, psychological: 2, psychosocial: 2, professional: 2 });
      setSdohScores({
        housing: 0,
        food: 0,
        transport: 0,
        insurance: 0,
        financial: 0,
        employment: 0,
        social_support: 0,
        safety: 0,
        healthcare_access: 0,
      });
    } catch (error) {
      console.error("Error submitting check-in:", error);
      toast.error("Failed to submit check-in. Please try again.");
    }
  }

  const selectedCase = cases.find((c) => c.id === forCase);
  const recentCheckins = selectedCase?.checkins?.slice(-5).reverse() ?? [];

  // Progress tracker helpers
  type Period = 'day' | 'week' | 'month';
  
  function formatDateForPeriod(ts: string, period: Period): string {
    const d = new Date(ts);
    if (period === 'day') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (period === 'week') return `Week ${Math.ceil(d.getDate() / 7)}`;
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }

  function aggregateCheckins(period: Period) {
    const checkins = selectedCase?.checkins || [];
    if (checkins.length === 0) return [];

    // Group by period
    const groups: Record<string, any[]> = {};
    checkins.forEach(ci => {
      const date = new Date(ci.ts);
      let key: string;
      
      if (period === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(ci);
    });

    // Aggregate data
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, items]) => ({
        date: formatDateForPeriod(items[0].ts, period),
        pain: Math.round((items.reduce((sum, i) => sum + (i.pain || 0), 0) / items.length) * 10) / 10,
        depression: Math.round((items.reduce((sum, i) => sum + (i.depression || 0), 0) / items.length) * 10) / 10,
        anxiety: Math.round((items.reduce((sum, i) => sum + (i.anxiety || 0), 0) / items.length) * 10) / 10,
        physical: Math.round((items.reduce((sum, i) => sum + (((i.fourPs?.physical || 0) > 4 ? (i.fourPs?.physical || 0) / 25 : (i.fourPs?.physical || 0))), 0) / items.length) * 10) / 10,
        psychological: Math.round((items.reduce((sum, i) => sum + (((i.fourPs?.psychological || 0) > 4 ? (i.fourPs?.psychological || 0) / 25 : (i.fourPs?.psychological || 0))), 0) / items.length) * 10) / 10,
        psychosocial: Math.round((items.reduce((sum, i) => sum + (((i.fourPs?.psychosocial || 0) > 4 ? (i.fourPs?.psychosocial || 0) / 25 : (i.fourPs?.psychosocial || 0))), 0) / items.length) * 10) / 10,
        professional: Math.round((items.reduce((sum, i) => sum + (((i.fourPs?.professional || 0) > 4 ? (i.fourPs?.professional || 0) / 25 : (i.fourPs?.professional || 0))), 0) / items.length) * 10) / 10,
      }));
  }

  function getTrendColor(current: number, previous: number, isHigherBetter: boolean): string {
    if (!previous) return "hsl(var(--muted-foreground))";
    const diff = current - previous;
    if (Math.abs(diff) < 0.5) return "hsl(var(--warning))"; // stable
    if (isHigherBetter) {
      return diff > 0 ? "hsl(var(--success))" : "hsl(var(--destructive))";
    } else {
      return diff < 0 ? "hsl(var(--success))" : "hsl(var(--destructive))";
    }
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Client Check-ins</h1>
          <p className="text-muted-foreground mt-1">Track your wellbeing and progress over time — including pain, mood, stress, and The 4Ps of Wellness (Physical, Psychological, Psychosocial, and Professional).</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Check-in Form */}
          <Card className="p-6 border-border lg:col-span-2">
            <h2 className="text-xl font-semibold text-foreground mb-6">How are you feeling today?</h2>

            <div className="space-y-6">
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

              <LabeledTextarea
                label="Note (optional)"
                value={note}
                onChange={setNote}
                placeholder="What's important for us to know about how you're feeling today?"
                maxLength={1000}
                rows={4}
              />

              <div className="rounded-lg border border-border bg-card p-4 mb-4">
                <h3 className="text-sm font-semibold text-foreground">How to Score the 4Ps &amp; SDOH</h3>
                <p className="text-xs text-muted-foreground mt-1">Each category measures <strong>distress or impairment</strong>, not wellness. Use this scale to rate your impairment:</p>
                <ul className="mt-3 space-y-1 text-xs text-foreground">
                  <li><span className="font-semibold">0</span> — Doing just fine - No problems with my daily activities</li>
                  <li><span className="font-semibold">1</span> — A little tricky sometimes - Mostly able to do what I need to</li>
                  <li><span className="font-semibold">2</span> — Pretty difficult at times - Have to push through to get things done</li>
                  <li><span className="font-semibold">3</span> — Really hard most days - Struggle with regular tasks and activities</li>
                  <li><span className="font-semibold">4</span> — Extremely difficult - Can't do normal daily things without help</li>
                </ul>
              </div>
              <div>
                <Label className="text-sm font-medium mb-3 block">Quick 4Ps Assessment</Label>
                <TooltipProvider>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="text-xs font-medium">
                          Physical (pain, fatigue, sleep, mobility): {quick4ps.physical}/4
                        </Label>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">Physical relates to your body's comfort and energy level — pain, fatigue, sleep quality, and mobility.</p>
                          </TooltipContent>
                        </UITooltip>
                      </div>
                      <Slider
                        value={[quick4ps.physical]}
                        onValueChange={([value]) =>
                          setQuick4ps((p) => ({ ...p, physical: value }))
                        }
                        max={4}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="text-xs font-medium">
                          Psychological (mood, coping, stress): {quick4ps.psychological}/4
                        </Label>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">Psychological relates to mood, coping, stress, and emotional wellbeing.</p>
                          </TooltipContent>
                        </UITooltip>
                      </div>
                      <Slider
                        value={[quick4ps.psychological]}
                        onValueChange={([value]) =>
                          setQuick4ps((p) => ({ ...p, psychological: value }))
                        }
                        max={4}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="text-xs font-medium">
                          Psychosocial (relationships, finances, transportation, support): {quick4ps.psychosocial}/4
                        </Label>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">Psychosocial covers social and environmental stability — relationships, finances, transportation, and support systems.</p>
                          </TooltipContent>
                        </UITooltip>
                      </div>
                      <Slider
                        value={[quick4ps.psychosocial]}
                        onValueChange={([value]) =>
                          setQuick4ps((p) => ({ ...p, psychosocial: value }))
                        }
                        max={4}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="text-xs font-medium">
                          Professional (job, school, or home-based role): {quick4ps.professional}/4
                        </Label>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">Professional relates to your main occupational role — including your job, school responsibilities, or home-based duties.</p>
                          </TooltipContent>
                        </UITooltip>
                      </div>
                      <Slider
                        value={[quick4ps.professional]}
                        onValueChange={([value]) =>
                          setQuick4ps((p) => ({ ...p, professional: value }))
                        }
                        max={4}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </TooltipProvider>
              </div>

              {/* SDOH Tracking (0-4 Scale) */}
              <div className="pt-4 border-t border-border">
                <Label className="text-sm font-medium mb-3 block">Social Determinants of Health (SDOH) - Optional</Label>
                <p className="text-xs text-muted-foreground mb-4">Rate your current situation: 0 = doing fine, 4 = severe difficulty</p>
                <div className="space-y-4">
                  {[
                    { key: 'housing', label: 'Housing Stability' },
                    { key: 'food', label: 'Food Security' },
                    { key: 'transport', label: 'Transportation' },
                    { key: 'insurance', label: 'Insurance Coverage' },
                    { key: 'financial', label: 'Financial Resources' },
                    { key: 'employment', label: 'Employment Status' },
                    { key: 'social_support', label: 'Social Support' },
                    { key: 'safety', label: 'Safety & Security' },
                    { key: 'healthcare_access', label: 'Healthcare Access' },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">{label}</Label>
                        <span className="text-xs font-semibold">{(sdohScores as any)[key]}/4</span>
                      </div>
                      <Slider
                        value={[(sdohScores as any)[key]]}
                        onValueChange={([value]) => setSdohScores((s) => ({ ...s, [key]: value }))}
                        max={4}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  ))}
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
                <Tabs defaultValue="day" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="day">Daily</TabsTrigger>
                    <TabsTrigger value="week">Weekly</TabsTrigger>
                    <TabsTrigger value="month">Monthly</TabsTrigger>
                  </TabsList>
                  
                  {(["day", "week", "month"] as const).map((period) => {
                    const data = aggregateCheckins(period);
                    const latest = data[data.length - 1];
                    const previous = data[data.length - 2];
                    
                    return (
                      <TabsContent key={period} value={period} className="space-y-6">
                        {/* Symptom Trends */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-foreground">Symptom Trends (0-10)</h3>
                            {latest && (
                              <div className="flex gap-2 text-xs">
                                <span className={latest.pain >= 7 ? "text-destructive font-semibold" : ""}>
                                  Pain: {latest.pain}
                                </span>
                                <span className={latest.depression >= 7 ? "text-destructive font-semibold" : ""}>
                                  Depression: {latest.depression}
                                </span>
                                <span className={latest.anxiety >= 7 ? "text-destructive font-semibold" : ""}>
                                  Anxiety: {latest.anxiety}
                                </span>
                              </div>
                            )}
                          </div>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis 
                                dataKey="date" 
                                stroke="hsl(var(--muted-foreground))"
                                style={{ fontSize: '12px' }}
                              />
                              <YAxis 
                                domain={[0, 10]} 
                                stroke="hsl(var(--muted-foreground))"
                                style={{ fontSize: '12px' }}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--popover))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '12px'
                                }}
                              />
                              <Legend wrapperStyle={{ fontSize: '12px' }} />
                              <Line 
                                type="monotone" 
                                dataKey="pain" 
                                stroke="#ef4444" 
                                strokeWidth={2}
                                name="Pain"
                                dot={{ fill: '#ef4444', r: 4 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="depression" 
                                stroke="#8b5cf6" 
                                strokeWidth={2}
                                name="Depression"
                                dot={{ fill: '#8b5cf6', r: 4 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="anxiety" 
                                stroke="#f59e0b" 
                                strokeWidth={2}
                                name="Anxiety"
                                dot={{ fill: '#f59e0b', r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                          {latest && previous && (
                            <div className="flex gap-4 mt-2 text-xs">
                              <span style={{ color: getTrendColor(latest.pain, previous.pain, false) }}>
                                Pain {latest.pain > previous.pain ? '↑' : latest.pain < previous.pain ? '↓' : '→'}
                              </span>
                              <span style={{ color: getTrendColor(latest.depression, previous.depression, false) }}>
                                Depression {latest.depression > previous.depression ? '↑' : latest.depression < previous.depression ? '↓' : '→'}
                              </span>
                              <span style={{ color: getTrendColor(latest.anxiety, previous.anxiety, false) }}>
                                Anxiety {latest.anxiety > previous.anxiety ? '↑' : latest.anxiety < previous.anxiety ? '↓' : '→'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 4Ps Progress */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-foreground">4Ps Progress (0-4)</h3>
                            {latest && (
                              <div className="flex gap-2 text-xs">
                                <span className={latest.physical <= 1 ? "text-destructive font-semibold" : ""}>
                                  Physical: {latest.physical}
                                </span>
                                <span className={latest.psychological <= 1 ? "text-destructive font-semibold" : ""}>
                                  Psychological: {latest.psychological}
                                </span>
                                <span className={latest.psychosocial <= 1 ? "text-destructive font-semibold" : ""}>
                                  Psychosocial: {latest.psychosocial}
                                </span>
                                <span className={latest.professional <= 1 ? "text-destructive font-semibold" : ""}>
                                  Professional: {latest.professional}
                                </span>
                              </div>
                            )}
                          </div>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis 
                                dataKey="date" 
                                stroke="hsl(var(--muted-foreground))"
                                style={{ fontSize: '12px' }}
                              />
                              <YAxis 
                                domain={[0, 4]} 
                                stroke="hsl(var(--muted-foreground))"
                                style={{ fontSize: '12px' }}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--popover))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '12px'
                                }}
                              />
                              <Legend wrapperStyle={{ fontSize: '12px' }} />
                              <Line 
                                type="monotone" 
                                dataKey="physical" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                name="Physical"
                                dot={{ fill: '#10b981', r: 4 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="psychological" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                name="Psychological"
                                dot={{ fill: '#3b82f6', r: 4 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="psychosocial" 
                                stroke="#ec4899" 
                                strokeWidth={2}
                                name="Psychosocial"
                                dot={{ fill: '#ec4899', r: 4 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="professional" 
                                stroke="#6366f1" 
                                strokeWidth={2}
                                name="Professional"
                                dot={{ fill: '#6366f1', r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                          {latest && previous && (
                            <div className="flex gap-4 mt-2 text-xs">
                              <span style={{ color: getTrendColor(latest.physical, previous.physical, true) }}>
                                Physical {latest.physical > previous.physical ? '↑' : latest.physical < previous.physical ? '↓' : '→'}
                              </span>
                              <span style={{ color: getTrendColor(latest.psychological, previous.psychological, true) }}>
                                Psychological {latest.psychological > previous.psychological ? '↑' : latest.psychological < previous.psychological ? '↓' : '→'}
                              </span>
                              <span style={{ color: getTrendColor(latest.psychosocial, previous.psychosocial, true) }}>
                                Psychosocial {latest.psychosocial > previous.psychosocial ? '↑' : latest.psychosocial < previous.psychosocial ? '↓' : '→'}
                              </span>
                              <span style={{ color: getTrendColor(latest.professional, previous.professional, true) }}>
                                Professional {latest.professional > previous.professional ? '↑' : latest.professional < previous.professional ? '↓' : '→'}
                              </span>
                            </div>
                          )}
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
