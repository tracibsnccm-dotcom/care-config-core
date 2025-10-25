import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/Stepper";
import { WizardNav } from "@/components/WizardNav";
import { Chip } from "@/components/Chip";
import { LabeledInput } from "@/components/LabeledInput";
import { LabeledSelect } from "@/components/LabeledSelect";
import { RestrictedBanner } from "@/components/RestrictedBanner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useApp } from "@/context/AppContext";
import { fmtDate } from "@/lib/store";
import {
  Client,
  Intake,
  Consent,
  FourPs,
  SDOH,
  Case,
  IncidentType,
  InitialTreatment,
  Gender,
} from "@/config/rcms";
import { AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { maskName } from "@/lib/access";
import { IntakeProgressBar, useIntakePercent, scheduleClientReminders } from "@/modules/rcms-intake-extras";

export default function IntakeWizard() {
  const navigate = useNavigate();
  const { setCases, log } = useApp();
  const [step, setStep] = useState(0);
  const [sensitiveTag, setSensitiveTag] = useState(false);

  const [intake, setIntake] = useState<Intake>({
    incidentType: "MVA",
    incidentDate: new Date().toISOString().slice(0, 10),
    initialTreatment: "ED",
    injuries: [],
    severitySelfScore: 5,
  });

  const [client, setClient] = useState<Client>({
    rcmsId: "RCMS-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
    attyRef: "AT-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
    dobMasked: "1985-XX-XX",
    gender: "prefer_not_to_say",
    state: "TX",
  });

  const [consent, setConsent] = useState<Consent>({
    signed: false,
    scope: { shareWithAttorney: false, shareWithProviders: false },
    restrictedAccess: false,
  });

  const [fourPs, setFourPs] = useState<FourPs>({
    physical: 50,
    psychological: 50,
    psychosocial: 50,
    professional: 50,
  });

  const [sdoh, setSdoh] = useState<SDOH>({
    housing: false,
    food: false,
    transport: false,
    insuranceGap: false,
  });

  const addOrRemoveInjury = (txt: string) => {
    setIntake((v) => ({
      ...v,
      injuries: v.injuries.includes(txt)
        ? v.injuries.filter((i) => i !== txt)
        : [...v.injuries, txt],
    }));
  };

  function submit() {
    const masked = maskName(client.fullName || "");
    const newCase: Case = {
      id: "C-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      firmId: "firm-001",
      client: { ...client, displayNameMasked: masked },
      intake,
      fourPs,
      sdoh,
      consent: { ...consent, restrictedAccess: sensitiveTag || consent.restrictedAccess },
      flags: [],
      status: consent.signed ? "NEW" : "AWAITING_CONSENT",
      checkins: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (sensitiveTag) newCase.flags.push("SENSITIVE");
    setCases((arr) => [newCase, ...arr]);
    log("INTAKE_SUBMIT", newCase.id);
    
    // Schedule client reminders via Google Apps Script
    const gasUrl = import.meta.env.VITE_GAS_URL;
    scheduleClientReminders({ webAppUrl: gasUrl }, newCase as any);
    
    alert(`Case ${newCase.id} created. Status: ${newCase.status}`);
    navigate("/cases");
  }

  const requiredIncidentOk = !!intake.incidentDate && !!intake.incidentType;

  // Calculate intake progress
  const intakeMeta = useMemo(() => ({
    startedAt: new Date().toISOString(),
    completedAt: null,
    required: {
      incident: !!intake.incidentDate && !!intake.incidentType,
      injuries: intake.injuries.length > 0,
      consent: consent.signed,
    },
    optional: {
      fourPs: fourPs.physical !== 50 || fourPs.psychological !== 50 || fourPs.psychosocial !== 50 || fourPs.professional !== 50,
      sdoh: sdoh.housing || sdoh.food || sdoh.transport || sdoh.insuranceGap,
    },
  }), [intake, consent, fourPs, sdoh]);

  const progressPercent = useIntakePercent(intakeMeta);

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Client Intake Wizard</h1>
          <p className="text-muted-foreground mt-1">Complete the intake process step by step</p>
        </div>

        <Stepper
          step={step}
          setStep={setStep}
          labels={["Consent", "Incident", "Treatment", "4Ps + SDOH", "Review"]}
        />

        {/* Progress Bar */}
        <div className="mt-4">
          <IntakeProgressBar percent={progressPercent} />
        </div>

        {/* Step 0: Consent */}
        {step === 0 && (
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Welcome & Consent Gate</h3>
            <p className="text-sm text-muted-foreground mb-6">
              You must consent for us to share information with your attorney and providers.
            </p>
            
            <div className="mb-6">
              <LabeledInput
                label="Client full name (stored, gated)"
                value={client.fullName || ""}
                onChange={(v) => setClient((c) => ({ ...c, fullName: v }))}
                placeholder="e.g., Sue Smith"
              />
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="consent-attorney"
                  checked={consent.scope.shareWithAttorney}
                  onCheckedChange={(checked) =>
                    setConsent((c) => ({
                      ...c,
                      scope: { ...c.scope, shareWithAttorney: checked as boolean },
                    }))
                  }
                />
                <Label htmlFor="consent-attorney" className="text-sm font-medium cursor-pointer">
                  Authorize sharing with attorney
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="consent-providers"
                  checked={consent.scope.shareWithProviders}
                  onCheckedChange={(checked) =>
                    setConsent((c) => ({
                      ...c,
                      scope: { ...c.scope, shareWithProviders: checked as boolean },
                    }))
                  }
                />
                <Label htmlFor="consent-providers" className="text-sm font-medium cursor-pointer">
                  Authorize sharing with providers
                </Label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <Button
                onClick={() =>
                  setConsent((c) => ({
                    ...c,
                    signed: true,
                    signedAt: new Date().toISOString(),
                  }))
                }
              >
                <Check className="w-4 h-4 mr-2" />
                Agree & Continue
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setConsent((c) => ({ ...c, signed: false }));
                  setStep(1);
                }}
                title="Data kept 14 days; case = AWAITING_CONSENT"
              >
                Not now
              </Button>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
              <Checkbox
                id="sensitive-tag"
                checked={sensitiveTag}
                onCheckedChange={(checked) => setSensitiveTag(checked as boolean)}
              />
              <Label htmlFor="sensitive-tag" className="text-sm font-medium cursor-pointer">
                Mark as Sensitive Case (sexual assault, minor, hate-crime)
              </Label>
            </div>
          </Card>
        )}

        {/* Step 1: Incident Details */}
        {step === 1 && (
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Incident Details</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <LabeledSelect
                label="Incident Type"
                value={intake.incidentType}
                onChange={(v) => setIntake((x) => ({ ...x, incidentType: v as IncidentType }))}
                options={["MVA", "WorkComp", "Other"]}
              />
              <LabeledInput
                label="Incident Date"
                type="date"
                value={intake.incidentDate}
                onChange={(v) => setIntake((x) => ({ ...x, incidentDate: v }))}
              />
              <LabeledSelect
                label="Initial Treatment"
                value={intake.initialTreatment}
                onChange={(v) =>
                  setIntake((x) => ({ ...x, initialTreatment: v as InitialTreatment }))
                }
                options={["ED", "UrgentCare", "PCP", "Chiro", "None"]}
              />
            </div>
            {!requiredIncidentOk && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Incident type & date are required.</AlertDescription>
              </Alert>
            )}
          </Card>
        )}

        {/* Step 2: Injuries & Severity */}
        {step === 2 && (
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Injuries & Severity</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {["Head injury", "Back pain", "Whiplash", "Concussion", "Laceration"].map(
                (chip) => (
                  <Chip
                    key={chip}
                    active={intake.injuries.includes(chip)}
                    onClick={() => addOrRemoveInjury(chip)}
                    label={chip}
                  />
                )
              )}
            </div>

            <LabeledInput
              className="mb-6"
              label="Other injuries (comma-separated)"
              placeholder="e.g., shoulder strain, knee pain"
              value=""
              onChange={(v) => {
                const parts = v
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                setIntake((prev) => ({
                  ...prev,
                  injuries: Array.from(new Set([...prev.injuries, ...parts])),
                }));
              }}
            />

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Self-reported severity: {intake.severitySelfScore}/10
              </Label>
              <Slider
                value={[intake.severitySelfScore]}
                onValueChange={([value]) =>
                  setIntake((x) => ({
                    ...x,
                    severitySelfScore: value as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
                  }))
                }
                max={10}
                step={1}
                className="w-full"
              />
            </div>
          </Card>
        )}

        {/* Step 3: 4Ps & SDOH */}
        {step === 3 && (
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Optional 4Ps & SDOH (complete within 24–72 hours)
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 mb-6">
              {(["physical", "psychological", "psychosocial", "professional"] as const).map(
                (k) => (
                  <div key={k}>
                    <Label className="text-sm font-medium capitalize mb-2 block">
                      {k}: {fourPs[k]}
                    </Label>
                    <Slider
                      value={[fourPs[k]]}
                      onValueChange={([value]) =>
                        setFourPs((p) => ({ ...p, [k]: value }))
                      }
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(["housing", "food", "transport", "insuranceGap"] as const).map((k) => (
                <div key={k} className="flex items-center space-x-3">
                  <Checkbox
                    id={`sdoh-${k}`}
                    checked={sdoh[k]}
                    onCheckedChange={(checked) =>
                      setSdoh((s) => ({ ...s, [k]: checked as boolean }))
                    }
                  />
                  <Label
                    htmlFor={`sdoh-${k}`}
                    className="text-sm font-medium capitalize cursor-pointer"
                  >
                    {k.replace(/([A-Z])/g, " $1")}
                  </Label>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Review & Submit</h3>
            {sensitiveTag && <RestrictedBanner />}
            
            <div className="space-y-3 text-sm mb-6">
              <div className="flex py-2 border-b border-border">
                <span className="font-medium w-40">RCMS ID:</span>
                <span className="select-none text-muted-foreground" title="PHI block">
                  {client.rcmsId}
                </span>
              </div>
              <div className="flex py-2 border-b border-border">
                <span className="font-medium w-40">DOB:</span>
                <span className="select-none text-muted-foreground">{client.dobMasked}</span>
              </div>
              <div className="flex py-2 border-b border-border">
                <span className="font-medium w-40">Incident:</span>
                <span className="text-muted-foreground">
                  {intake.incidentType} on {fmtDate(intake.incidentDate)}
                </span>
              </div>
              <div className="flex py-2 border-b border-border">
                <span className="font-medium w-40">Initial treatment:</span>
                <span className="text-muted-foreground">{intake.initialTreatment}</span>
              </div>
              <div className="flex py-2 border-b border-border">
                <span className="font-medium w-40">Injuries:</span>
                <span className="text-muted-foreground">
                  {intake.injuries.join(", ") || "—"}
                </span>
              </div>
              <div className="flex py-2 border-b border-border">
                <span className="font-medium w-40">Consent:</span>
                <span className="text-muted-foreground">
                  {consent.signed ? "Signed" : "Not signed"}
                  {consent.signed && consent.signedAt && ` @ ${fmtDate(consent.signedAt)}`}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={submit} aria-label="Submit intake">
                Submit Intake
              </Button>
              <Button variant="secondary" onClick={() => setStep(3)}>
                Back
              </Button>
            </div>
          </Card>
        )}

        <WizardNav step={step} setStep={setStep} last={4} />
      </div>
    </AppLayout>
  );
}
