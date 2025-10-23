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

export default function ClientCheckins() {
  const { cases, setCases, log } = useApp();
  const [forCase, setForCase] = useState(cases[0]?.id ?? "");
  const [pain, setPain] = useState(3);
  const [note, setNote] = useState("");
  const [quick4ps, setQuick4ps] = useState<FourPs>({
    physical: 50,
    psychological: 50,
    psychosocial: 50,
    professional: 50,
  });

  function submit() {
    if (!forCase) {
      toast.error("Please select a case");
      return;
    }

    setCases((arr) =>
      arr.map((c) =>
        c.id === forCase
          ? {
              ...c,
              checkins: [
                ...(c.checkins || []),
                { ts: new Date().toISOString(), pain, note, fourPs: quick4ps },
              ],
              status: c.status === "NEW" ? "IN_PROGRESS" : c.status,
            }
          : c
      )
    );
    log("CHECKIN_SUBMIT", forCase);

    // Warn if worsening (naive heuristic)
    const caseObj = cases.find((x) => x.id === forCase);
    const prev = caseObj?.checkins?.slice(-3).map((ci) => ci.pain) ?? [];
    const avg = prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : 0;
    
    if (pain - avg >= 2) {
      toast.error("Warning: Escalating pain trend detected", {
        description: "Consider scheduling a provider consultation.",
      });
    } else {
      toast.success("Check-in submitted successfully");
    }

    // Reset form
    setPain(3);
    setNote("");
    setQuick4ps({ physical: 50, psychological: 50, psychosocial: 50, professional: 50 });
  }

  const selectedCase = cases.find((c) => c.id === forCase);
  const recentCheckins = selectedCase?.checkins?.slice(-5).reverse() ?? [];

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
        </div>
      </div>
    </AppLayout>
  );
}
