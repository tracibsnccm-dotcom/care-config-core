import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
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
import { AlertCircle, Check, Save, HelpCircle, ArrowRight, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { maskName } from "@/lib/access";
import { IntakeProgressBar, useIntakePercent, scheduleClientReminders } from "@/modules/rcms-intake-extras";
import { IntakeMedConditionsSection } from "@/components/MedsConditionsSection";
import { IntakeWelcome } from "@/components/IntakeWelcome";
import { ClientIdService, type ClientType } from "@/lib/clientIdService";
import { IntakeSaveBar } from "@/components/IntakeSaveBar";
import { CaraFloatingButton } from "@/components/CaraFloatingButton";
import { CaraGate } from "@/components/CaraGate";
import { useAutosave } from "@/hooks/useAutosave";
import { useInactivityDetection } from "@/hooks/useInactivityDetection";
import { MedicationAutocomplete } from "@/components/MedicationAutocomplete";
import { FileUploadZone } from "@/components/FileUploadZone";
import { InactivityModal } from "@/components/InactivityModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function IntakeWizard() {
  const navigate = useNavigate();
  const { setCases, log } = useApp();
  const { toast } = useToast();
  const [showWelcome, setShowWelcome] = useState(true);
  const [step, setStep] = useState(0);
  const [sensitiveTag, setSensitiveTag] = useState(false);
  const [showCaraModal, setShowCaraModal] = useState(false);
  const [medications, setMedications] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [hasMeds, setHasMeds] = useState<string>('');
  
  // Mental health screening
  const [mentalHealth, setMentalHealth] = useState({
    depression: '',
    selfHarm: '',
    anxiety: '',
    wantHelp: false,
  });

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

  const [attorneyCode, setAttorneyCode] = useState("");
  const [clientType, setClientType] = useState<ClientType>('I');

  const [consent, setConsent] = useState<Consent>({
    signed: false,
    scope: { shareWithAttorney: false, shareWithProviders: false },
    restrictedAccess: false,
  });

  const [fourPs, setFourPs] = useState<FourPs>({
    physical: 0,
    psychological: 0,
    psychosocial: 0,
    professional: 0,
  });

  const [sdoh, setSdoh] = useState<SDOH>({
    housing: 0,
    food: 0,
    transport: 0,
    insuranceGap: 0,
    financial: 0,
    employment: 0,
    social_support: 0,
    safety: 0,
    healthcare_access: 0,
    income_range: undefined,
  });

  // Client-friendly score labels
  const scoreLabels: Record<number, string> = {
    0: "Doing just fine - No problems with my daily activities",
    1: "A little tricky sometimes - Mostly able to do what I need to",
    2: "Pretty difficult at times - Have to push through to get things done",
    3: "Really hard most days - Struggle with regular tasks and activities",
    4: "Extremely difficult - Can't do normal daily things without help"
  };

  // Auto-create RN tasks for high-severity SDOH
  const handleSDOHChange = async (domain: string, severity: number) => {
    setSdoh((s) => ({ ...s, [domain]: severity }));
    
    if (severity >= 3 && draftId) {
      try {
        await supabase.functions.invoke('rn-task-automation', {
          body: {
            type: 'sdoh_followup',
            domain: `s_${domain}`,
            severity,
            draft_id: draftId,
            case_id: null, // Will be linked after case creation
          }
        });
      } catch (error) {
        console.error('Error creating SDOH task:', error);
      }
    }
  };

  // Handle income with poverty flagging
  const handleIncomeChange = async (income_range: string) => {
    setSdoh((s) => ({ ...s, income_range }));
    
    // Poverty line flags (below $30k for simplicity)
    const povertyRanges = ['Under $15,000', '$15,000 - $29,999'];
    
    if (povertyRanges.includes(income_range) && draftId) {
      try {
        await supabase.functions.invoke('rn-task-automation', {
          body: {
            type: 'income_poverty_flag',
            income_range,
            draft_id: draftId,
            case_id: null,
          }
        });
      } catch (error) {
        console.error('Error creating poverty flag:', error);
      }
    }
  };

  const [medsBlock, setMedsBlock] = useState({ 
    conditions: "",
    meds: "",
    allergies: "",
    attested: false,
    valid: false 
  });

  const addOrRemoveInjury = (txt: string) => {
    setIntake((v) => ({
      ...v,
      injuries: v.injuries.includes(txt)
        ? v.injuries.filter((i) => i !== txt)
        : [...v.injuries, txt],
    }));
  };

  async function submit() {
    const masked = maskName(client.fullName || "");
    
    // Generate client ID
    const clientIdResult = await ClientIdService.generateClientId({
      attorneyCode: clientType !== 'I' ? attorneyCode : undefined,
      type: clientType
    });
    
    if (!clientIdResult.success) {
      alert(`Error generating client ID: ${clientIdResult.error}`);
      return;
    }
    
    const newCase: Case = {
      id: "C-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      firmId: "firm-001",
      client: { ...client, displayNameMasked: masked },
      intake: {
        ...intake,
        // Include medical info from medsBlock
        conditions: medsBlock.conditions,
        medList: medsBlock.meds,
        allergies: medsBlock.allergies,
        medsAttested: medsBlock.attested,
      },
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
    
    // Schedule client reminders via Supabase edge function
    scheduleClientReminders(undefined, newCase as any);
    
    alert(`Case ${newCase.id} created with Client ID: ${clientIdResult.clientId}. Status: ${newCase.status}`);
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
      fourPs: fourPs.physical !== 0 || fourPs.psychological !== 0 || fourPs.psychosocial !== 0 || fourPs.professional !== 0,
      sdoh: (typeof sdoh.housing === 'number' && sdoh.housing > 0) || 
            (typeof sdoh.food === 'number' && sdoh.food > 0) || 
            (typeof sdoh.transport === 'number' && sdoh.transport > 0) || 
            (typeof sdoh.insuranceGap === 'number' && sdoh.insuranceGap > 0) ||
            !!(sdoh.financial || sdoh.employment || sdoh.social_support || sdoh.safety || sdoh.healthcare_access),
    },
  }), [intake, consent, fourPs, sdoh]);

  const progressPercent = useIntakePercent(intakeMeta);

  const formData = useMemo(() => ({
    client,
    consent,
    intake,
    fourPs,
    sdoh,
    medsBlock,
    sensitiveTag,
    medications,
    uploadedFiles,
    mentalHealth,
    hasMeds,
  }), [client, consent, intake, fourPs, sdoh, medsBlock, sensitiveTag, medications, uploadedFiles, mentalHealth, hasMeds]);

  // Autosave functionality
  const { loadDraft, deleteDraft, saveNow } = useAutosave({
    formData,
    step,
    enabled: !showWelcome,
    debounceMs: 3000,
  });

  // Inactivity detection
  const { isInactive, dismissInactivity } = useInactivityDetection({
    enabled: !showWelcome,
    timeoutMs: 15 * 60 * 1000, // 15 minutes
  });

  // Normalize legacy 0-100 fourPs values to 0-4 scale
  const normalizeFourPs = (fp: FourPs): FourPs => {
    const to04 = (v: number) => {
      if (v <= 4) return Math.max(0, Math.min(4, Math.round(v)));
      // Legacy 0-100 -> map to 0-4
      return Math.max(0, Math.min(4, Math.round(v / 25)));
    };
    return {
      physical: to04(fp.physical as number),
      psychological: to04(fp.psychological as number),
      psychosocial: to04(fp.psychosocial as number),
      professional: to04(fp.professional as number),
    };
  };

  // Load draft on mount
  useEffect(() => {
    async function loadSavedDraft() {
      const draft = await loadDraft();
      if (draft && draft.formData) {
        const data = draft.formData as any;
        if (data.client) setClient(data.client);
        if (data.consent) setConsent(data.consent);
        if (data.intake) setIntake(data.intake);
        if (data.fourPs) setFourPs(normalizeFourPs(data.fourPs));
        if (data.sdoh) setSdoh(data.sdoh);
        if (data.medsBlock) setMedsBlock(data.medsBlock);
        if (data.medications) setMedications(data.medications);
        if (data.mentalHealth) setMentalHealth(data.mentalHealth);
        if (data.hasMeds) setHasMeds(data.hasMeds);
        if (typeof data.sensitiveTag === 'boolean') setSensitiveTag(data.sensitiveTag);
        if (typeof data.step === 'number') setStep(data.step);
        
        toast({
          title: "Draft Loaded",
          description: `Resuming from ${new Date(draft.updatedAt).toLocaleString()}`,
        });
      }
    }
    loadSavedDraft();
  }, []);

  // Monitor mental health responses for risk flagging
  useEffect(() => {
    if (mentalHealth.selfHarm === 'yes' || mentalHealth.selfHarm === 'unsure') {
      // Create urgent task for RN follow-up
      const flagRisk = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Create alert in database
          const { error } = await supabase.from('case_alerts').insert({
            case_id: null, // Will be associated when case is created
            alert_type: 'mental_health_crisis',
            severity: 'high',
            message: 'Client indicated potential self-harm during intake. Immediate RN follow-up required.',
            created_by: user.id,
            disclosure_scope: 'internal',
            metadata: {
              response: mentalHealth.selfHarm,
              consent_attorney: consent.scope.shareWithAttorney,
            },
          });

          if (error) throw error;

          toast({
            title: "Response Flagged",
            description: "Your response has been flagged for immediate RN Care Manager attention. If you're in danger, call 911 or 988 now.",
            variant: "destructive",
          });
        } catch (error) {
          console.error('Failed to flag risk:', error);
        }
      };
      flagRisk();
    }
  }, [mentalHealth.selfHarm]);

  return (
    <AppLayout>
      {!showWelcome && (
        <IntakeSaveBar formData={formData} onSaveExit={() => navigate('/dashboard')} />
      )}
      <div className="p-8 max-w-5xl mx-auto">
        {showWelcome ? (
          <IntakeWelcome
            client={client}
            consent={consent}
            sensitiveTag={sensitiveTag}
            onClientChange={setClient}
            onConsentChange={setConsent}
            onSensitiveChange={setSensitiveTag}
            onContinue={() => setShowWelcome(false)}
          />
        ) : (
          <>
            <CaraGate onAskCara={() => setShowCaraModal(true)} />
            
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Client Intake Wizard</h1>
              <p className="text-muted-foreground mt-1">Complete the intake process step by step</p>
            </div>

            <Stepper
              step={step}
              setStep={setStep}
              labels={["Consent", "Incident", "Medical", "Mental Health", "4Ps + SDOH", "Review"]}
            />
            
            {/* Client Type & Attorney Code */}
            <Card className="p-4 border-border mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledSelect
                  label="Intake Type"
                  value={clientType}
                  onChange={(v) => setClientType(v as ClientType)}
                  options={['I', 'D', 'R']}
                />
                {clientType !== 'I' && (
                  <LabeledInput
                    label="Attorney Code"
                    value={attorneyCode}
                    onChange={setAttorneyCode}
                    placeholder="e.g., SMI, JON"
                  />
                )}
              </div>
            </Card>

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
                onClick={() => {
                  setConsent((c) => ({
                    ...c,
                    signed: true,
                    signedAt: new Date().toISOString(),
                  }));
                  setStep(1);
                }}
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
            <div className="mt-6">
              <Button 
                onClick={() => setStep(2)}
                disabled={!requiredIncidentOk}
                className="w-full sm:w-auto"
              >
                Continue to Medical History
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Medical History */}
        {step === 2 && (
          <div className="space-y-6">
            <Card className="p-6 border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Medical History & Medications
              </h3>
              
              <div className="mb-6">
                <Label className="mb-3 block">Do you currently take any medications?</Label>
                <RadioGroup value={hasMeds} onValueChange={setHasMeds}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="meds-yes" />
                    <Label htmlFor="meds-yes" className="cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="meds-no" />
                    <Label htmlFor="meds-no" className="cursor-pointer">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unsure" id="meds-unsure" />
                    <Label htmlFor="meds-unsure" className="cursor-pointer">I'm not sure</Label>
                  </div>
                </RadioGroup>
                {hasMeds === 'unsure' && (
                  <Alert className="mt-3">
                    <AlertDescription>
                      No problem! You can add what you remember or upload a photo of your medication bottles later.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {hasMeds === 'yes' && (
                <MedicationAutocomplete 
                  medications={medications}
                  onMedicationsChange={setMedications}
                />
              )}
            </Card>

            <FileUploadZone
              onFilesUploaded={(files) => setUploadedFiles(prev => [...prev, ...files])}
              draftId={draftId || undefined}
            />
            
            <div className="mt-6">
              <Button 
                onClick={() => setStep(3)}
                disabled={hasMeds === ''}
                className="w-full sm:w-auto"
              >
                Continue to Mental Health
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              {hasMeds === '' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Please answer the medication question to continue
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Mental Health & Well-Being */}
        {step === 3 && (
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Mental Health & Well-Being Check-In
            </h3>
            
            {(mentalHealth.selfHarm === 'yes' || mentalHealth.selfHarm === 'unsure') && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>We've flagged your response for immediate RN Care Manager attention.</strong>
                  <br />
                  If you're in danger, please call <strong>911</strong> or <strong>988</strong> (Suicide & Crisis Lifeline) now.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">
                  In the past 2 weeks, have you felt down, depressed, or hopeless?
                </Label>
                <RadioGroup value={mentalHealth.depression} onValueChange={(v) => setMentalHealth(prev => ({ ...prev, depression: v }))}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="dep-yes" />
                    <Label htmlFor="dep-yes" className="cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="dep-no" />
                    <Label htmlFor="dep-no" className="cursor-pointer">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unsure" id="dep-unsure" />
                    <Label htmlFor="dep-unsure" className="cursor-pointer">Not sure</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="mb-3 block">
                  Have you had thoughts about harming yourself?
                </Label>
                <RadioGroup value={mentalHealth.selfHarm} onValueChange={(v) => setMentalHealth(prev => ({ ...prev, selfHarm: v }))}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="harm-yes" />
                    <Label htmlFor="harm-yes" className="cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="harm-no" />
                    <Label htmlFor="harm-no" className="cursor-pointer">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unsure" id="harm-unsure" />
                    <Label htmlFor="harm-unsure" className="cursor-pointer">Not sure</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="mb-3 block">
                  In the past 2 weeks, have you felt nervous, anxious, or on edge?
                </Label>
                <RadioGroup value={mentalHealth.anxiety} onValueChange={(v) => setMentalHealth(prev => ({ ...prev, anxiety: v }))}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="anx-yes" />
                    <Label htmlFor="anx-yes" className="cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="anx-no" />
                    <Label htmlFor="anx-no" className="cursor-pointer">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unsure" id="anx-unsure" />
                    <Label htmlFor="anx-unsure" className="cursor-pointer">Not sure</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-accent rounded-lg">
                <Checkbox
                  id="want-help"
                  checked={mentalHealth.wantHelp}
                  onCheckedChange={(checked) => setMentalHealth(prev => ({ ...prev, wantHelp: checked as boolean }))}
                />
                <Label htmlFor="want-help" className="cursor-pointer">
                  Would you like RN Care Management to assist with mental health resources?
                </Label>
              </div>
            </div>
            
            <div className="mt-6">
              <Button 
                onClick={() => setStep(4)}
                className="w-full sm:w-auto"
              >
                Continue to 4Ps & SDOH
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: 4Ps & SDOH */}
        {step === 4 && (
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
              Optional 4Ps & SDOH
            </h3>
            
            {/* Scoring Directions */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3 mb-6">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                How to Score the 4Ps & SDOH
              </h4>
              <p className="text-sm text-muted-foreground">
                Each category measures <strong>distress or impairment</strong>, not wellness. How to Use this scale to rate your impairment:
              </p>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 items-start">
                  <span className="font-semibold">0</span>
                  <span className="text-muted-foreground">Doing just fine - No problems with my daily activities</span>

                  <span className="font-semibold">1</span>
                  <span className="text-muted-foreground">A little tricky sometimes - Mostly able to do what I need to</span>

                  <span className="font-semibold">2</span>
                  <span className="text-muted-foreground">Pretty difficult at times - Have to push through to get things done</span>

                  <span className="font-semibold">3</span>
                  <span className="text-muted-foreground">Really hard most days - Struggle with regular tasks and activities</span>

                  <span className="font-semibold">4</span>
                  <span className="text-muted-foreground">Extremely difficult - Can't do normal daily things without help</span>
                </div>
              </div>
            </div>

            <TooltipProvider>
              <div className="grid gap-6 sm:grid-cols-2 mb-6">
                {(["physical", "psychological", "psychosocial", "professional"] as const).map(
                  (k) => {
                    const labels = {
                      physical: "Physical (pain, fatigue, sleep, mobility)",
                      psychological: "Psychological (mood, focus, stress, coping)",
                      psychosocial: "Psychosocial (relationships, finances, transportation, support)",
                      professional: "Professional (job, school, or home-based role)"
                    };
                    
                    const tooltips = {
                      physical: "Physical relates to your body's comfort and energy level. This includes (but is not limited to) pain, fatigue, sleep quality, and mobility.",
                      psychological: "Psychological reflects your emotional and mental wellbeing. This includes (but is not limited to) mood, focus, stress level, and coping ability.",
                      psychosocial: "Psychosocial covers your social and environmental stability. This includes (but is not limited to) relationships, finances, transportation, and support systems.",
                      professional: "Professional relates to your main occupational role — including your job, school responsibilities, or home-based duties for stay-at-home parents or spouses. This includes (but is not limited to) satisfaction, stress, workload, and burnout risk in that environment."
                    };
                    
                    const scoreLabels: Record<number, string> = {
                      0: "Doing just fine - No problems with my daily activities",
                      1: "A little tricky sometimes - Mostly able to do what I need to",
                      2: "Pretty difficult at times - Have to push through to get things done",
                      3: "Really hard most days - Struggle with regular tasks and activities",
                      4: "Extremely difficult - Can't do normal daily things without help"
                    };
                    
                     return (
                      <div key={k}>
                        <div className="flex items-center gap-2 mb-2">
                          <Label className="text-sm font-medium">
                            {labels[k]}: {fourPs[k]}
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">{tooltips[k]}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Slider
                          value={[fourPs[k]]}
                          onValueChange={([value]) =>
                            setFourPs((p) => ({ ...p, [k]: value }))
                          }
                          max={4}
                          step={1}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          {scoreLabels[fourPs[k]]}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </TooltipProvider>

            {/* SDOH Domains with 0-4 Scale */}
            <div className="space-y-6">
              <h4 className="font-semibold text-foreground">Social Determinants of Health (SDOH)</h4>
              <p className="text-sm text-muted-foreground italic p-3 bg-muted/30 rounded-md border border-border/50">
                Answers to these questions are strictly voluntary and are only used to help determine if we can help provide access and information to resources you may be eligible for and benefit from.
              </p>
              
              {[
                { key: 'housing', label: 'Housing Stability' },
                { key: 'food', label: 'Food Security' },
                { key: 'transport', label: 'Transportation' },
                { key: 'insuranceGap', label: 'Insurance Coverage' },
                { key: 'financial', label: 'Financial Resources' },
                { key: 'employment', label: 'Employment Status' },
                { key: 'social_support', label: 'Social Support Network' },
                { key: 'safety', label: 'Safety & Security' },
                { key: 'healthcare_access', label: 'Healthcare Access' },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{label}</Label>
                    <span className="text-sm font-semibold text-primary">
                      {(sdoh as any)[key]}/4
                    </span>
                  </div>
                  <Slider
                    value={[(sdoh as any)[key] || 0]}
                    onValueChange={([value]) => handleSDOHChange(key, value)}
                    max={4}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground italic">
                    {scoreLabels[(sdoh as any)[key] || 0]}
                  </p>
                </div>
              ))}

              {/* Income Range with Poverty Flagging */}
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="income-range" className="text-sm font-medium">
                  Household Income Range (optional)
                </Label>
                <select
                  id="income-range"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={sdoh.income_range || ''}
                  onChange={(e) => handleIncomeChange(e.target.value)}
                >
                  <option value="">Prefer not to say</option>
                  <option value="Under $15,000">Under $15,000</option>
                  <option value="$15,000 - $29,999">$15,000 - $29,999</option>
                  <option value="$30,000 - $49,999">$30,000 - $49,999</option>
                  <option value="$50,000 - $74,999">$50,000 - $74,999</option>
                  <option value="$75,000 - $99,999">$75,000 - $99,999</option>
                  <option value="$100,000+">$100,000+</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  This helps us identify resources you may be eligible for
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <Button 
                onClick={() => setStep(5)}
                className="w-full sm:w-auto"
              >
                Continue to Review
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
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
              <Button variant="secondary" onClick={() => setStep(4)}>
                Back
              </Button>
            </div>
          </Card>
        )}

            <WizardNav 
              step={step} 
              setStep={setStep} 
              last={5}
              canAdvance={step === 2 ? hasMeds !== '' : true}
            />
            
            <InactivityModal
              isOpen={isInactive}
              onContinue={dismissInactivity}
              onSaveExit={async () => {
                await saveNow();
                navigate('/dashboard');
              }}
            />
          </>
        )}
      </div>
      <CaraFloatingButton />
    </AppLayout>
  );
}
