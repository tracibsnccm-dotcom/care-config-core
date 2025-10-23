import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { sendProviderConfirmation } from "@/lib/webhooks";
import { WEBHOOK_CONFIG } from "@/config/webhooks";
import { Pill, Activity, Brain, AlertCircle, Save, Trash2, Home, FileText } from "lucide-react";

interface MedRow {
  name: string;
  dose: string;
  purpose: string;
  prescriber: string;
  notes: string;
}

interface PostMedRow extends MedRow {
  start_date: string;
}

interface TreatmentRow {
  therapy: string;
  frequency: string;
  provider: string;
  start_date: string;
  notes: string;
}

type TabType = "meds" | "symptoms" | "stress" | "sdoh" | "care" | "review";

const SDOH_OPTIONS = [
  "Transportation",
  "Money/Cost",
  "Childcare/Eldercare",
  "Housing Instability",
  "Food Insecurity",
  "Work Schedule/Employer",
  "Language/Literacy",
  "Technology/Access",
  "Safety/Domestic Violence",
  "Mental Health Access",
  "Insurance/Benefits",
];

export default function ClientJournal() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("meds");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Medication states
  const [preInjuryMeds, setPreInjuryMeds] = useState<MedRow[]>([
    { name: "", dose: "", purpose: "", prescriber: "", notes: "" },
  ]);
  const [postInjuryMeds, setPostInjuryMeds] = useState<PostMedRow[]>([
    { name: "", dose: "", purpose: "", start_date: "", prescriber: "", notes: "" },
  ]);
  const [treatments, setTreatments] = useState<TreatmentRow[]>([
    { therapy: "", frequency: "", provider: "", start_date: "", notes: "" },
  ]);

  // Symptom scores
  const [painScore, setPainScore] = useState("");
  const [depressionScore, setDepressionScore] = useState("");
  const [anxietyScore, setAnxietyScore] = useState("");
  const [symptomNotes, setSymptomNotes] = useState("");

  // Stress
  const [stressTotal, setStressTotal] = useState("");
  const [stressNotes, setStressNotes] = useState("");

  // SDOH
  const [sdohFlags, setSdohFlags] = useState<string[]>([]);
  const [sdohOther, setSdohOther] = useState("");

  // Care Plan
  const [carePlan, setCarePlan] = useState("");

  const getCaseId = () => {
    if ((window as any).RCMS_CASE_ID) return (window as any).RCMS_CASE_ID;
    const params = new URLSearchParams(window.location.search);
    return params.get("case_id") || "RCMS-TEST";
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        case_id: getCaseId(),
        timestamp: new Date().toISOString(),
        meds: {
          pre_injury: preInjuryMeds.filter(m => m.name || m.dose || m.purpose),
          post_injury: postInjuryMeds.filter(m => m.name || m.dose || m.purpose),
        },
        treatments: treatments.filter(t => t.therapy || t.provider),
        scores: {
          pain: painScore ? parseInt(painScore) : null,
          depression: depressionScore ? parseInt(depressionScore) : null,
          anxiety: anxietyScore ? parseInt(anxietyScore) : null,
          stress_total: stressTotal ? parseInt(stressTotal) : null,
        },
        notes: {
          symptoms: symptomNotes || null,
          stress: stressNotes || null,
        },
        sdoh_flags: sdohFlags,
        sdoh_other: sdohOther || null,
        care_plan: carePlan || null,
      };

      const response = await fetch(WEBHOOK_CONFIG.PROVIDER_CONFIRMATION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RCMS-Token": WEBHOOK_CONFIG.SECURITY_TOKEN,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.redirected) {
        toast({
          title: "Entry Saved",
          description: "Your journal entry has been saved to your case record.",
        });
        setActiveTab("review");
      } else {
        throw new Error("Webhook error");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not save entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setPreInjuryMeds([{ name: "", dose: "", purpose: "", prescriber: "", notes: "" }]);
    setPostInjuryMeds([{ name: "", dose: "", purpose: "", start_date: "", prescriber: "", notes: "" }]);
    setTreatments([{ therapy: "", frequency: "", provider: "", start_date: "", notes: "" }]);
    setPainScore("");
    setDepressionScore("");
    setAnxietyScore("");
    setSymptomNotes("");
    setStressTotal("");
    setStressNotes("");
    setSdohFlags([]);
    setSdohOther("");
    setCarePlan("");
    toast({ title: "Cleared", description: "All entries have been reset." });
  };

  const tabs = [
    { id: "meds" as TabType, label: "Medications", icon: Pill },
    { id: "symptoms" as TabType, label: "Pain • Depression • Anxiety", icon: Activity },
    { id: "stress" as TabType, label: "Stress Checklist", icon: Brain },
    { id: "sdoh" as TabType, label: "SDOH Survey", icon: Home },
    { id: "care" as TabType, label: "Preliminary Care Plan", icon: FileText },
    { id: "review" as TabType, label: "Review & Save", icon: Save },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Reconcile <span className="text-accent font-extrabold">C.A.R.E.</span> — Client Journal & Medications
            </CardTitle>
            <CardDescription className="text-primary-foreground/90">
              Enter medications, symptoms, SDOH, and a preliminary care plan. Entries are saved securely to your case.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={activeTab === id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(id)}
                  className={activeTab === id ? "bg-accent text-accent-foreground hover:bg-accent/90" : "text-primary-foreground border border-primary-foreground/20"}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Medications Tab */}
        {activeTab === "meds" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5" />
                Medication & Treatment Record
              </CardTitle>
              <CardDescription>
                Include prescriptions, OTC meds, supplements, and vitamins.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pre-Injury Meds */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm">Pre-Injury / Chronic Medications</h3>
                <div className="space-y-2">
                  {preInjuryMeds.map((med, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 border rounded-lg">
                      <Input placeholder="Medication" value={med.name} onChange={e => {
                        const updated = [...preInjuryMeds];
                        updated[idx].name = e.target.value;
                        setPreInjuryMeds(updated);
                      }} />
                      <Input placeholder="Dose" value={med.dose} onChange={e => {
                        const updated = [...preInjuryMeds];
                        updated[idx].dose = e.target.value;
                        setPreInjuryMeds(updated);
                      }} />
                      <Input placeholder="Purpose" value={med.purpose} onChange={e => {
                        const updated = [...preInjuryMeds];
                        updated[idx].purpose = e.target.value;
                        setPreInjuryMeds(updated);
                      }} />
                      <Input placeholder="Prescriber" value={med.prescriber} onChange={e => {
                        const updated = [...preInjuryMeds];
                        updated[idx].prescriber = e.target.value;
                        setPreInjuryMeds(updated);
                      }} />
                      <Input placeholder="Notes" value={med.notes} onChange={e => {
                        const updated = [...preInjuryMeds];
                        updated[idx].notes = e.target.value;
                        setPreInjuryMeds(updated);
                      }} />
                      <Button variant="ghost" size="sm" onClick={() => {
                        setPreInjuryMeds(preInjuryMeds.filter((_, i) => i !== idx));
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  setPreInjuryMeds([...preInjuryMeds, { name: "", dose: "", purpose: "", prescriber: "", notes: "" }]);
                }}>
                  + Add Pre-Injury Med
                </Button>
              </div>

              {/* Post-Injury Meds */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm">Post-Injury / New Medications</h3>
                <div className="space-y-2">
                  {postInjuryMeds.map((med, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-2 p-3 border rounded-lg">
                      <Input placeholder="Medication" value={med.name} onChange={e => {
                        const updated = [...postInjuryMeds];
                        updated[idx].name = e.target.value;
                        setPostInjuryMeds(updated);
                      }} />
                      <Input placeholder="Dose" value={med.dose} onChange={e => {
                        const updated = [...postInjuryMeds];
                        updated[idx].dose = e.target.value;
                        setPostInjuryMeds(updated);
                      }} />
                      <Input placeholder="Purpose" value={med.purpose} onChange={e => {
                        const updated = [...postInjuryMeds];
                        updated[idx].purpose = e.target.value;
                        setPostInjuryMeds(updated);
                      }} />
                      <Input type="date" value={med.start_date} onChange={e => {
                        const updated = [...postInjuryMeds];
                        updated[idx].start_date = e.target.value;
                        setPostInjuryMeds(updated);
                      }} />
                      <Input placeholder="Prescriber" value={med.prescriber} onChange={e => {
                        const updated = [...postInjuryMeds];
                        updated[idx].prescriber = e.target.value;
                        setPostInjuryMeds(updated);
                      }} />
                      <Input placeholder="Notes" value={med.notes} onChange={e => {
                        const updated = [...postInjuryMeds];
                        updated[idx].notes = e.target.value;
                        setPostInjuryMeds(updated);
                      }} />
                      <Button variant="ghost" size="sm" onClick={() => {
                        setPostInjuryMeds(postInjuryMeds.filter((_, i) => i !== idx));
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  setPostInjuryMeds([...postInjuryMeds, { name: "", dose: "", purpose: "", start_date: "", prescriber: "", notes: "" }]);
                }}>
                  + Add Post-Injury Med
                </Button>
              </div>

              {/* Treatments */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm">Non-Medication Treatments</h3>
                <div className="space-y-2">
                  {treatments.map((tx, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 border rounded-lg">
                      <Input placeholder="Treatment" value={tx.therapy} onChange={e => {
                        const updated = [...treatments];
                        updated[idx].therapy = e.target.value;
                        setTreatments(updated);
                      }} />
                      <Input placeholder="Frequency" value={tx.frequency} onChange={e => {
                        const updated = [...treatments];
                        updated[idx].frequency = e.target.value;
                        setTreatments(updated);
                      }} />
                      <Input placeholder="Provider" value={tx.provider} onChange={e => {
                        const updated = [...treatments];
                        updated[idx].provider = e.target.value;
                        setTreatments(updated);
                      }} />
                      <Input type="date" value={tx.start_date} onChange={e => {
                        const updated = [...treatments];
                        updated[idx].start_date = e.target.value;
                        setTreatments(updated);
                      }} />
                      <Input placeholder="Notes" value={tx.notes} onChange={e => {
                        const updated = [...treatments];
                        updated[idx].notes = e.target.value;
                        setTreatments(updated);
                      }} />
                      <Button variant="ghost" size="sm" onClick={() => {
                        setTreatments(treatments.filter((_, i) => i !== idx));
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  setTreatments([...treatments, { therapy: "", frequency: "", provider: "", start_date: "", notes: "" }]);
                }}>
                  + Add Treatment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Symptoms Tab */}
        {activeTab === "symptoms" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Pain, Depression & Anxiety Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="painScore">Pain (0–10)</Label>
                  <Input
                    id="painScore"
                    type="number"
                    min="0"
                    max="10"
                    placeholder="e.g., 6"
                    value={painScore}
                    onChange={e => setPainScore(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depressionScore">Depression — RCMS scale</Label>
                  <Input
                    id="depressionScore"
                    type="number"
                    min="0"
                    max="99"
                    placeholder="enter score"
                    value={depressionScore}
                    onChange={e => setDepressionScore(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anxietyScore">Anxiety — RCMS scale</Label>
                  <Input
                    id="anxietyScore"
                    type="number"
                    min="0"
                    max="99"
                    placeholder="enter score"
                    value={anxietyScore}
                    onChange={e => setAnxietyScore(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="symptomNotes">Notes (triggers, what helped, changes since last entry)</Label>
                <Textarea
                  id="symptomNotes"
                  placeholder="Optional notes…"
                  value={symptomNotes}
                  onChange={e => setSymptomNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stress Tab */}
        {activeTab === "stress" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Stress Checklist
              </CardTitle>
              <CardDescription>
                Enter your total or key items (the full checklist is in your packet).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stressTotal">Stress Total (0–10 or count)</Label>
                  <Input
                    id="stressTotal"
                    type="number"
                    min="0"
                    max="99"
                    placeholder="e.g., 4"
                    value={stressTotal}
                    onChange={e => setStressTotal(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stressNotes">Stress Notes (optional)</Label>
                  <Input
                    id="stressNotes"
                    placeholder="Key stressors this week…"
                    value={stressNotes}
                    onChange={e => setStressNotes(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SDOH Tab */}
        {activeTab === "sdoh" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Social Determinants of Health (SDOH) Survey
              </CardTitle>
              <CardDescription>
                Select anything that may affect appointments, recovery, or daily life.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SDOH_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center space-x-2 p-2 border rounded-lg">
                    <Checkbox
                      id={`sdoh-${option}`}
                      checked={sdohFlags.includes(option)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSdohFlags([...sdohFlags, option]);
                        } else {
                          setSdohFlags(sdohFlags.filter((f) => f !== option));
                        }
                      }}
                    />
                    <Label
                      htmlFor={`sdoh-${option}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sdohOther">Other / Details (optional)</Label>
                <Textarea
                  id="sdohOther"
                  placeholder="Add context or barriers not listed…"
                  value={sdohOther}
                  onChange={(e) => setSdohOther(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Care Plan Tab */}
        {activeTab === "care" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Preliminary Care Plan (ODG / MCG)
              </CardTitle>
              <CardDescription>
                Outline the expected pathway based on client-reported symptoms and guideline references (e.g., PT duration, imaging triggers, referral criteria). Mark as preliminary until records are reviewed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="carePlan"
                placeholder="Example: 4–6 weeks of conservative care (PT, NSAIDs). If no improvement, consider MRI and ortho referral. Estimated TTD 2–4 weeks pending job demands…"
                value={carePlan}
                onChange={(e) => setCarePlan(e.target.value)}
                rows={8}
              />
            </CardContent>
          </Card>
        )}

        {/* Review Tab */}
        {activeTab === "review" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="w-5 h-5" />
                Review & Save
              </CardTitle>
              <CardDescription>
                Your entry will post to the RCMS Google Apps Script webhook and be recorded in your sheet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Saving..." : "Save Entry to Case"}
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>This journal is for your personal tracking and coordination only.</strong><br />
                  It does not replace medical or mental-health evaluation.<br />
                  Bring it to your <strong>medical, behavioral health, chiropractic appointments, and RCMS check-ins</strong> to guide care planning.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
