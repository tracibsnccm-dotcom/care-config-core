import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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
import { AlertCircle, Check, Save, HelpCircle, ArrowRight, Info, Shield, FileText, Phone, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { maskName } from "@/lib/access";
import { IntakeProgressBar, useIntakePercent, scheduleClientReminders } from "@/modules/rcms-intake-extras";
import { IntakeMedConditionsSection } from "@/components/MedsConditionsSection";
import { type MedicationEntry } from "@/components/IntakeMedicationRecord";
import { IntakeMedicationAllergies, type AllergyEntry } from "@/components/IntakeMedicationAllergies";
import { IntakePreInjuryMedications } from "@/components/IntakePreInjuryMedications";
import { IntakePostInjuryMedications } from "@/components/IntakePostInjuryMedications";
import { IntakePreInjuryTreatments, type TreatmentEntry } from "@/components/IntakePreInjuryTreatments";
import { IntakePostInjuryTreatments } from "@/components/IntakePostInjuryTreatments";
import { IntakeBehavioralHealthMedications, type BHMedicationEntry } from "@/components/IntakeBehavioralHealthMedications";
import { IntakeWelcome } from "@/components/IntakeWelcome";
import { IntakePhysicalPreDiagnosisSelector } from "@/components/IntakePhysicalPreDiagnosisSelector";
import { IntakePhysicalPostDiagnosisSelector } from "@/components/IntakePhysicalPostDiagnosisSelector";
import { IntakeBehavioralHealthDiagnosisSelector } from "@/components/IntakeBehavioralHealthDiagnosisSelector";
import { LabeledTextarea } from "@/components/LabeledTextarea";
import { ClientIdService } from "@/lib/clientIdService";
import { IntakeSaveBar } from "@/components/IntakeSaveBar";
import { IntakeCompletionChecklist } from "@/components/IntakeCompletionChecklist";
import { IntakeNextStepsTimeline } from "@/components/IntakeNextStepsTimeline";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { CaraFloatingButton } from "@/components/CaraFloatingButton";
import { CaraGate } from "@/components/CaraGate";
import { AssessmentSnapshotExplainer } from "@/components/AssessmentSnapshotExplainer";
import { useAutosave } from "@/hooks/useAutosave";
import { useInactivityDetection } from "@/hooks/useInactivityDetection";
import { MedicationAutocomplete } from "@/components/MedicationAutocomplete";
import { FileUploadZone } from "@/components/FileUploadZone";
import { InactivityModal } from "@/components/InactivityModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { supabaseGet, supabaseInsert, supabaseUpdate } from '@/lib/supabaseRest';
import { IntakeSensitiveExperiences, type SensitiveExperiencesData, type SensitiveExperiencesProgress } from "@/components/IntakeSensitiveExperiences";
import { analyzeSensitiveExperiences, buildSdohUpdates } from "@/lib/sensitiveExperiencesFlags";
import { saveMentalHealthScreening } from "@/lib/sensitiveDisclosuresHelper";
import { CLIENT_INTAKE_WINDOW_HOURS, formatHMS, CLIENT_DOCUMENTS } from "@/constants/compliance";
import { Input } from "@/components/ui/input";
import { Printer } from "lucide-react";

// Generate temporary intake ID in INT-YYMMDD-##X format
function generateIntakeId(attorneyCode: string | null, sequenceToday: number): string {
  const today = new Date();
  const yy = today.getFullYear().toString().slice(-2);
  const mm = (today.getMonth() + 1).toString().padStart(2, '0');
  const dd = today.getDate().toString().padStart(2, '0');
  const seq = sequenceToday.toString().padStart(2, '0');
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randomLetter = letters[Math.floor(Math.random() * letters.length)];
  return `INT-${yy}${mm}${dd}-${seq}${randomLetter}`;
}

export default function IntakeWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Check if consents were completed before allowing intake access
  useEffect(() => {
    const consentSessionId = sessionStorage.getItem("rcms_consent_session_id");
    const consentsCompleted = sessionStorage.getItem("rcms_consents_completed");
    
    if (!consentSessionId || !consentsCompleted) {
      // Redirect to consent flow
      window.location.href = "/client-consent";
    }
  }, []);

  // Load available attorneys on mount (for dropdown display if needed)
  useEffect(() => {
    const loadAttorneys = async () => {
      console.log('IntakeWizard: Loading attorneys...');
      const { data, error } = await supabaseGet(
        'rc_users',
        'select=id,full_name,attorney_code&role=eq.attorney&order=full_name.asc'
      );
      console.log('IntakeWizard: Attorney load result', { data, error });
      if (error) {
        console.error('IntakeWizard: Failed to load attorneys', error);
        return;
      }
      if (data) {
        const attorneys = Array.isArray(data) ? data : [data];
        const filtered = attorneys.filter(a => a.attorney_code);
        console.log('IntakeWizard: Filtered attorneys', filtered);
        setAvailableAttorneys(filtered);
      }
    };
    loadAttorneys();
  }, []);

  // Read attorney selection from URL parameters (set in ClientConsent)
  useEffect(() => {
    const urlAttorneyId = searchParams.get('attorney_id');
    const urlAttorneyCode = searchParams.get('attorney_code');
    console.log('IntakeWizard: Read from URL params', { urlAttorneyId, urlAttorneyCode });
    if (urlAttorneyId) setSelectedAttorneyId(urlAttorneyId);
    if (urlAttorneyCode) setAttorneyCode(urlAttorneyCode);
  }, [searchParams]);
  
  const [showWelcome, setShowWelcome] = useState(false); // Skip welcome - consents already signed
  const [step, setStep] = useState(0); // Step 0 is now Incident Details (was Step 1)
  const [sensitiveTag, setSensitiveTag] = useState(false);
  const [showCaraModal, setShowCaraModal] = useState(false);
  const [medications, setMedications] = useState<any[]>([]);
  const [preInjuryMeds, setPreInjuryMeds] = useState<MedicationEntry[]>([]);
  const [postInjuryMeds, setPostInjuryMeds] = useState<MedicationEntry[]>([]);
  const [preInjuryTreatments, setPreInjuryTreatments] = useState<TreatmentEntry[]>([]);
  const [postInjuryTreatments, setPostInjuryTreatments] = useState<TreatmentEntry[]>([]);
  const [medAllergies, setMedAllergies] = useState<AllergyEntry[]>([]);
  const [bhPreMeds, setBhPreMeds] = useState<BHMedicationEntry[]>([]);
  const [bhPostMeds, setBhPostMeds] = useState<BHMedicationEntry[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [hasMeds, setHasMeds] = useState<string>('');
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null); // Track case ID for saving disclosures
  const [sensitiveProgress, setSensitiveProgress] = useState<SensitiveExperiencesProgress | null>(null);
  const [intakeStartedAt, setIntakeStartedAt] = useState<Date | null>(null); // Track when intake was first started
  const [clientWindowExpired, setClientWindowExpired] = useState(false);
  const [clientMsRemaining, setClientMsRemaining] = useState<number>(0);
  
  // Electronic signature state
  const [clientEsign, setClientEsign] = useState<{
    agreed: boolean;
    signerFullName: string;
    signerInitials: string;
  }>({
    agreed: false,
    signerFullName: "",
    signerInitials: "",
  });
  
  // Mental health screening
  const [mentalHealth, setMentalHealth] = useState({
    depression: '',
    selfHarm: '',
    anxiety: '',
    wantHelp: false,
  });

  // Sensitive experiences
  const [sensitiveExperiences, setSensitiveExperiences] = useState<SensitiveExperiencesData>({
    substanceUse: [],
    safetyTrauma: [],
    stressors: [],
    consentAttorney: 'unset',
    consentProvider: 'unset',
  });

  const [intake, setIntake] = useState<Intake>({
    incidentType: "MVA",
    incidentDate: new Date().toISOString().slice(0, 10),
    initialTreatment: "ED",
    injuries: [],
    severitySelfScore: 5,
  });

  // Incident narrative state
  const [incidentNarrative, setIncidentNarrative] = useState("");
  const [incidentNarrativeExtra, setIncidentNarrativeExtra] = useState("");
  
  // Diagnosis state - split by category
  const [physicalPreDiagnoses, setPhysicalPreDiagnoses] = useState<string[]>([]);
  const [physicalPreNotes, setPhysicalPreNotes] = useState("");
  const [physicalPostDiagnoses, setPhysicalPostDiagnoses] = useState<string[]>([]);
  const [physicalPostNotes, setPhysicalPostNotes] = useState("");
  const [bhPreDiagnoses, setBhPreDiagnoses] = useState<string[]>([]);
  const [bhPostDiagnoses, setBhPostDiagnoses] = useState<string[]>([]);
  const [bhNotes, setBhNotes] = useState("");

  const [client, setClient] = useState<Client>({
    rcmsId: "",
    attyRef: "AT-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
    dobMasked: "1985-XX-XX",
    gender: "prefer_not_to_say",
    state: "TX",
  });

  const [attorneyCode, setAttorneyCode] = useState("");
  const [availableAttorneys, setAvailableAttorneys] = useState<{id: string, full_name: string, attorney_code: string}[]>([]);
  const [selectedAttorneyId, setSelectedAttorneyId] = useState<string>("");

  // Consents are already signed at the beginning of the intake process
  const [consent, setConsent] = useState<Consent>({
    signed: true, // Already signed in consent flow
    scope: { shareWithAttorney: true, shareWithProviders: true }, // Default to true since already consented
    restrictedAccess: false,
  });

  const [fourPs, setFourPs] = useState<FourPs>({
    physical: 3,
    psychological: 3,
    psychosocial: 3,
    professional: 3,
  });

  const [sdoh, setSdoh] = useState<SDOH>({
    housing: 3,
    food: 3,
    transport: 3,
    insuranceGap: 3,
    financial: 3,
    employment: 3,
    social_support: 3,
    safety: 3,
    healthcare_access: 3,
    income_range: undefined,
  });

  // Client-friendly score labels
  const scoreLabels: Record<number, string> = {
    1: "Extremely difficult - Can't do normal daily things without help",
    2: "Really hard most days - Struggle with regular tasks and activities",
    3: "Pretty difficult at times - Have to push through to get things done",
    4: "A little tricky sometimes - Mostly able to do what I need to",
    5: "Doing just fine - No problems with my daily activities"
  };

  // Auto-create RN tasks for high-severity SDOH
  const handleSDOHChange = async (domain: string, severity: number) => {
    setSdoh((s) => ({ ...s, [domain]: Math.floor(severity) }));
    
    if (severity <= 2 && draftId) {
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
    console.log('IntakeWizard: Submit started');
    
    // Check if client window has expired
    if (clientWindowExpired) {
      toast({
        title: "Intake Window Expired",
        description: "Your 7-day intake window has expired. Please restart the intake process.",
        variant: "destructive",
      });
      return;
    }

    const masked = maskName(client.fullName || "");
    
    // Generate client ID - use 'R' (referral) as default type when attorney is involved
    const clientIdResult = await ClientIdService.generateClientId({
      attorneyCode: attorneyCode || undefined,
      type: attorneyCode ? 'R' : 'I' // 'R' for referral with attorney, 'I' for internal if no attorney
    });
    
    if (!clientIdResult.success) {
      alert(`Error generating client ID: ${clientIdResult.error}`);
      return;
    }
    
    const newCase: Case = {
      id: crypto.randomUUID(),
      firmId: "firm-001",
      client: { ...client, displayNameMasked: masked },
      intake: {
        ...intake,
        // Include medical info from medsBlock
        conditions: medsBlock.conditions,
        medList: medsBlock.meds,
        allergies: medsBlock.allergies,
        medsAttested: medsBlock.attested,
        // Include new fields
        incidentNarrative,
        incidentNarrativeExtra,
        physicalPreDiagnoses,
        physicalPreNotes,
        physicalPostDiagnoses,
        physicalPostNotes,
        bhPreDiagnoses,
        bhPostDiagnoses,
        bhNotes,
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
    
    // Look up attorney by selectedAttorneyId or attorney_code
    console.log('IntakeWizard handleSubmit: Attorney values', { selectedAttorneyId, attorneyCode });
    let attorneyId: string | null = selectedAttorneyId || null;
    if (!attorneyId && attorneyCode) {
      const { data: attorneyData } = await supabaseGet(
        'rc_users',
        `select=id&attorney_code=eq.${attorneyCode}&role=eq.attorney&limit=1`
      );
      if (attorneyData) {
        const attorney = Array.isArray(attorneyData) ? attorneyData[0] : attorneyData;
        attorneyId = attorney?.id || null;
      }
    }

    console.log('IntakeWizard handleSubmit: Resolved attorneyId', attorneyId);

    // First, create the case in rc_cases table
    console.log('IntakeWizard: About to insert rc_cases');
    const { error: caseError } = await supabaseInsert("rc_cases", {
      id: newCase.id,
      client_id: null, // Will be linked later
      attorney_id: attorneyId, // Assign attorney if found
      case_type: intake.incidentType || 'MVA',
      case_status: 'intake_pending',
      created_at: new Date().toISOString(),
    });

    console.log('IntakeWizard: rc_cases result', { error: caseError });

    if (caseError) {
      console.error("Error creating case:", caseError);
      toast({
        title: "Error",
        description: "Failed to create case. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Store case ID for sensitive disclosures
    setCreatedCaseId(newCase.id);
    
    // Note: setCases and log removed - IntakeWizard is now public and doesn't use AppContext
    // setCases((arr) => [newCase, ...arr]);
    console.log("INTAKE_SUBMIT", newCase.id);
    
    // Schedule client reminders via Supabase edge function
    scheduleClientReminders(undefined, newCase as any);
    
    // Create initial client_checkin from intake 4Ps & SDOH for baseline tracking
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { error: checkinError } = await supabaseInsert("rc_client_checkins", {
          case_id: newCase.id,
          client_id: userData.user.id,
          pain_scale: 5,
          depression_scale: 0,
          anxiety_scale: 0,
          p_physical: Math.floor(fourPs.physical) || 1,
          p_psychological: Math.floor(fourPs.psychological) || 1,
          p_psychosocial: Math.floor(fourPs.psychosocial) || 1,
          p_purpose: Math.floor(fourPs.professional) || 1,
          sdoh_housing: sdoh.housing || 3,
          sdoh_food: sdoh.food || 3,
          sdoh_transport: sdoh.transport || 3,
          sdoh_insurance: sdoh.insuranceGap || 3,
          sdoh_financial: sdoh.financial || 3,
          sdoh_employment: sdoh.employment || 3,
          sdoh_social_support: sdoh.social_support || 3,
          sdoh_safety: sdoh.safety || 3,
          sdoh_healthcare_access: sdoh.healthcare_access || 3,
          sdoh_income_range: sdoh.income_range || null,
          note: "Baseline from intake assessment"
        } as any);
        
        if (checkinError) {
          console.error("Error creating baseline check-in:", checkinError);
        }

        // Save medications from intake to client_medications table
        const allMeds = [
          ...preInjuryMeds.filter(m => m.brandName.trim() || m.genericName.trim()).map(med => ({
            case_id: newCase.id,
            client_id: userData.user.id,
            medication_name: med.brandName || med.genericName,
            dosage: med.dose || null,
            frequency: med.frequency || null,
            prescribing_doctor: med.prescriber || null,
            start_date: med.startDate || null,
            side_effects: med.notes || null,
            injury_timing: 'pre-injury',
            is_active: true,
          })),
          ...postInjuryMeds.filter(m => m.brandName.trim() || m.genericName.trim()).map(med => ({
            case_id: newCase.id,
            client_id: userData.user.id,
            medication_name: med.brandName || med.genericName,
            dosage: med.dose || null,
            frequency: med.frequency || null,
            prescribing_doctor: med.prescriber || null,
            start_date: med.startDate || null,
            side_effects: med.notes || null,
            injury_timing: 'post-injury',
            is_active: true,
          })),
        ];

        if (allMeds.length > 0) {
          // Insert medications one by one since supabaseInsert handles single objects
          for (const med of allMeds) {
            const { error: medsError } = await supabaseInsert("rc_client_medications", med);
            if (medsError) {
              console.error("Error saving medication:", medsError);
            }
          }
        }

        // Save treatments from intake to client_treatments table
        const allTreatments = [
          ...preInjuryTreatments.filter(t => t.provider.trim() || t.type.trim()).map(treatment => ({
            case_id: newCase.id,
            client_id: userData.user.id,
            treatment_name: `${treatment.type}${treatment.provider ? ' - ' + treatment.provider : ''}`,
            provider: treatment.provider || null,
            frequency: treatment.frequency || null,
            start_date: treatment.startDate || null,
            notes: treatment.notes || null,
            injury_timing: 'pre_injury',
            is_active: true,
          })),
          ...postInjuryTreatments.filter(t => t.provider.trim() || t.type.trim()).map(treatment => ({
            case_id: newCase.id,
            client_id: userData.user.id,
            treatment_name: `${treatment.type}${treatment.provider ? ' - ' + treatment.provider : ''}`,
            provider: treatment.provider || null,
            frequency: treatment.frequency || null,
            start_date: treatment.startDate || null,
            notes: treatment.notes || null,
            injury_timing: 'post_injury',
            is_active: true,
          })),
        ];

        if (allTreatments.length > 0) {
          const { error: treatmentsError } = await supabase
            .from("client_treatments")
            .insert(allTreatments);
          
          if (treatmentsError) {
            console.error("Error saving treatments:", treatmentsError);
          }
        }

        // Save allergies if provided
        if (medAllergies && medAllergies.length > 0) {
          const allergiesData = medAllergies.filter(a => a.medication.trim()).map(allergy => ({
            case_id: newCase.id,
            client_id: userData.user.id,
            allergen_name: allergy.medication,
            reaction: allergy.reaction || null,
            severity: allergy.severity || null,
            notes: null,
            reported_date: new Date().toISOString().split('T')[0],
            is_active: true,
          }));

          if (allergiesData.length > 0) {
            const { error: allergiesError } = await supabase
              .from("client_allergies")
              .insert(allergiesData);
            
            if (allergiesError) {
              console.error("Error saving allergies:", allergiesError);
            }
          }
        }

        // Process sensitive experiences and create safety alerts
        const sensitiveFlags = analyzeSensitiveExperiences(sensitiveExperiences);
        
        if (sensitiveFlags.length > 0) {
          // Create case alerts for RN CM
          const alertsData = sensitiveFlags.map(flag => ({
            case_id: newCase.id,
            alert_type: flag.alertType,
            message: flag.message,
            severity: flag.severity,
            disclosure_scope: flag.disclosureScope,
            created_by: userData.user.id,
            metadata: {
              notification_priority: flag.notificationPriority,
              flag_level: flag.level,
              flag_color: flag.color,
              consent_attorney: sensitiveExperiences.consentAttorney,
              consent_provider: sensitiveExperiences.consentProvider,
              additional_details: sensitiveExperiences.additionalDetails || null,
              section_skipped: sensitiveExperiences.sectionSkipped || false,
            }
          }));

          // Insert alerts one by one since supabaseInsert handles single objects
          for (const alert of alertsData) {
            const { error: alertsError } = await supabaseInsert("case_alerts", alert);
            if (alertsError) {
              console.error("Error creating safety alert:", alertsError);
            }
          }

          // Update SDOH flags in cases table
          const sdohUpdates = buildSdohUpdates(sensitiveFlags);
          
          if (Object.keys(sdohUpdates).length > 0) {
            // Merge with existing SDOH data
            const updatedSdoh = {
              ...newCase.sdoh,
              sensitive_experiences_flags: sdohUpdates,
              sensitive_experiences_detected_at: new Date().toISOString()
            };

            const { error: sdohError } = await supabaseUpdate(
              "rc_cases",
              `id=eq.${newCase.id}`,
              { sdoh: updatedSdoh }
            );
            
            if (sdohError) {
              console.error("Error updating SDOH flags:", sdohError);
            }
          }
        }

        // Record intake completion in rc_client_intakes table (MVP: gates Client Portal access per-case)
        // Build intake_json payload with all intake data
        const nowISO = new Date().toISOString();
        const intakeJson = {
          client: {
            ...client,
            displayNameMasked: masked,
          },
          intake: {
            ...intake,
            conditions: medsBlock.conditions,
            medList: medsBlock.meds,
            allergies: medsBlock.allergies,
            medsAttested: medsBlock.attested,
            incidentNarrative,
            incidentNarrativeExtra,
            physicalPreDiagnoses,
            physicalPreNotes,
            physicalPostDiagnoses,
            physicalPostNotes,
            bhPreDiagnoses,
            bhPostDiagnoses,
            bhNotes,
          },
          fourPs,
          sdoh,
          consent: { ...consent, restrictedAccess: sensitiveTag || consent.restrictedAccess },
          flags: newCase.flags,
          status: newCase.status,
          createdAt: newCase.created_at,
          updatedAt: newCase.updated_at,
          compliance: {
            client_esign: {
              signed: true,
              signed_at: nowISO,
              signer_full_name: clientEsign.signerFullName.trim(),
              signer_initials: clientEsign.signerInitials.trim() || null,
              signature_method: "typed_name",
              documents: {
                privacy_policy: {
                  version: "v1.0",
                  text: CLIENT_DOCUMENTS.clientPrivacyPolicyText,
                },
                hipaa_notice: {
                  version: "v1.0",
                  text: CLIENT_DOCUMENTS.clientHipaaNoticeText,
                },
                consent_to_care: {
                  version: "v1.0",
                  text: CLIENT_DOCUMENTS.clientConsentToCareText,
                },
              },
            },
          },
        };

        // Get attorney_id from rc_cases if available, otherwise use attorneyCode as text
        let attorneyIdText: string | null = attorneyCode || null;
        
        // Try to get actual attorney_id from rc_cases
        if (newCase.id) {
          try {
            const { data: caseData } = await supabaseGet<any>(
              'rc_cases',
              `select=attorney_id&id=eq.${newCase.id}`
            );
            
            if (caseData && Array.isArray(caseData) && caseData.length > 0 && caseData[0]?.attorney_id) {
              attorneyIdText = caseData[0].attorney_id;
            }
          } catch (err) {
            // If rc_cases doesn't exist or query fails, use attorneyCode as fallback
            console.log('Using attorneyCode as attorney_id fallback');
          }
        }

        // Set compliance timestamps
        const now = new Date();
        const submittedAt = now.toISOString();
        const attorneyConfirmDeadlineAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(); // +48 hours

        // Insert intake record with compliance workflow fields
        console.log('IntakeWizard: About to insert rc_client_intakes');
        const { error: intakeCompletionError } = await supabaseInsert("rc_client_intakes", {
          case_id: newCase.id,
          intake_json: intakeJson,
          intake_status: 'submitted_pending_attorney',
          intake_submitted_at: submittedAt,
          attorney_confirm_deadline_at: attorneyConfirmDeadlineAt,
        });
        
        console.log('IntakeWizard: rc_client_intakes result', { error: intakeCompletionError });
        
        if (intakeCompletionError) {
          console.error("Error recording intake completion:", intakeCompletionError);
          // Don't block submission if this fails, but log it
        }
      }
    } catch (error) {
      console.error("Error creating baseline check-in:", error);
    }
    
    toast({
      title: "Intake Submitted Successfully",
      description: `Case ${newCase.id} created with Client ID: ${clientIdResult.clientId}. Your intake is now pending attorney confirmation.`,
    });
    
    // Clear draft and session storage after successful submission
    await deleteDraft();
    sessionStorage.removeItem("rcms_consent_session_id");
    sessionStorage.removeItem("rcms_consents_completed");
    
    // Set flag so next visit clears the form (new intake)
    sessionStorage.setItem('rcms_intake_submitted', 'true');
    
    // Navigate to client portal (will show pending confirmation screen)
    navigate("/client-portal");
  }

  const generatePDFSummary = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(15, 42, 106); // Navy
    doc.text("Reconcile C.A.R.E. Intake Summary", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: "center" });
    
    let yPos = 45;
    
    // Client Information
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Client Information", 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`RCMS ID: ${client.rcmsId}`, 20, yPos);
    yPos += 6;
    doc.text(`DOB: ${client.dobMasked}`, 20, yPos);
    yPos += 6;
    doc.text(`Attorney: ${attorneyCode || "N/A"}`, 20, yPos);
    yPos += 12;
    
    // Incident Details
    doc.setFontSize(14);
    doc.text("Incident Details", 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Type: ${intake.incidentType}`, 20, yPos);
    yPos += 6;
    doc.text(`Date: ${fmtDate(intake.incidentDate)}`, 20, yPos);
    yPos += 6;
    doc.text(`Initial Treatment: ${intake.initialTreatment}`, 20, yPos);
    yPos += 6;
    doc.text(`Injuries: ${intake.injuries.join(", ") || "None specified"}`, 20, yPos);
    yPos += 12;
    
    // Assessment Snapshot
    doc.setFontSize(14);
    doc.text("Assessment Snapshot", 20, yPos);
    yPos += 10;
    
    const allValues = [
      fourPs.physical, fourPs.psychological, fourPs.psychosocial, fourPs.professional,
      typeof sdoh.housing === 'number' ? sdoh.housing : 3,
      typeof sdoh.transport === 'number' ? sdoh.transport : 3,
      typeof sdoh.food === 'number' ? sdoh.food : 3,
      typeof sdoh.insuranceGap === 'number' ? sdoh.insuranceGap : 3,
      typeof sdoh.financial === 'number' ? sdoh.financial : 3,
      typeof sdoh.employment === 'number' ? sdoh.employment : 3,
      typeof sdoh.social_support === 'number' ? sdoh.social_support : 3,
      typeof sdoh.safety === 'number' ? sdoh.safety : 3,
      typeof sdoh.healthcare_access === 'number' ? sdoh.healthcare_access : 3
    ];
    const avgScore = Math.floor(allValues.reduce((a, b) => a + b, 0) / allValues.length);
    const severity = parseFloat(avgScore) >= 4.5 ? 'Stable' :
                     parseFloat(avgScore) >= 3.5 ? 'Mild' :
                     parseFloat(avgScore) >= 2.5 ? 'Moderate' : 'Critical';
    
    doc.setFontSize(10);
    doc.text(`Overall Score: ${avgScore} (${severity})`, 20, yPos);
    yPos += 6;
    doc.text(`Physical: ${fourPs.physical} | Psychological: ${fourPs.psychological} | Psychosocial: ${fourPs.psychosocial} | Professional: ${fourPs.professional}`, 20, yPos);
    yPos += 12;
    
    // Medications
    if (preInjuryMeds.length > 0 || postInjuryMeds.length > 0) {
      doc.setFontSize(14);
      doc.text("Medications", 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      if (preInjuryMeds.length > 0) {
        doc.text("Pre-Injury:", 20, yPos);
        yPos += 6;
        preInjuryMeds.forEach(med => {
          const medName = med.brandName || med.genericName;
          if (medName && medName.trim()) {
            doc.text(`  • ${medName}${med.dose ? ` (${med.dose})` : ''}`, 25, yPos);
            yPos += 5;
          }
        });
      }
      if (postInjuryMeds.length > 0) {
        yPos += 3;
        doc.text("Post-Injury:", 20, yPos);
        yPos += 6;
        postInjuryMeds.forEach(med => {
          const medName = med.brandName || med.genericName;
          if (medName && medName.trim()) {
            doc.text(`  • ${medName}${med.dose ? ` (${med.dose})` : ''}`, 25, yPos);
            yPos += 5;
          }
        });
      }
      yPos += 8;
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.text("This is a summary of your intake submission. Keep this for your records.", pageWidth / 2, footerY, { align: "center" });
    doc.text("CONFIDENTIAL - HIPAA Protected Information", pageWidth / 2, footerY + 5, { align: "center" });
    
    // Save the PDF
    doc.save(`Reconcile-CARE-Intake-Summary-${new Date().toISOString().split('T')[0]}.pdf`);
  };

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
      fourPs: fourPs.physical !== 3 || fourPs.psychological !== 3 || fourPs.psychosocial !== 3 || fourPs.professional !== 3,
      sdoh: (typeof sdoh.housing === 'number' && sdoh.housing !== 3) || 
            (typeof sdoh.food === 'number' && sdoh.food !== 3) || 
            (typeof sdoh.transport === 'number' && sdoh.transport !== 3) || 
            (typeof sdoh.insuranceGap === 'number' && sdoh.insuranceGap !== 3) ||
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
    preInjuryMeds,
    postInjuryMeds,
    preInjuryTreatments,
    postInjuryTreatments,
    medAllergies,
    uploadedFiles,
    mentalHealth,
    hasMeds,
    incidentNarrative,
    incidentNarrativeExtra,
    physicalPreDiagnoses,
    physicalPreNotes,
    physicalPostDiagnoses,
    physicalPostNotes,
    bhPreDiagnoses,
    bhPostDiagnoses,
    bhNotes,
    bhPreMeds,
    bhPostMeds,
  }), [client, consent, intake, fourPs, sdoh, medsBlock, sensitiveTag, medications, preInjuryMeds, postInjuryMeds, preInjuryTreatments, postInjuryTreatments, medAllergies, uploadedFiles, mentalHealth, hasMeds, incidentNarrative, incidentNarrativeExtra, physicalPreDiagnoses, physicalPreNotes, physicalPostDiagnoses, physicalPostNotes, bhPreDiagnoses, bhPostDiagnoses, bhNotes, bhPreMeds, bhPostMeds]);

  // Autosave functionality
  const { loadDraft, deleteDraft, saveNow } = useAutosave({
    formData,
    step,
    enabled: !showWelcome,
    debounceMs: 3000,
  });

  // Clear old draft if starting fresh intake with new attorney
  useEffect(() => {
    const urlAttorneyId = searchParams.get('attorney_id');
    const storedAttorneyId = sessionStorage.getItem('rcms_current_attorney_id');
    const intakeSubmitted = sessionStorage.getItem('rcms_intake_submitted');
    
    // Clear data if: different attorney OR previous intake was submitted
    if ((urlAttorneyId && urlAttorneyId !== storedAttorneyId) || intakeSubmitted === 'true') {
      // Clear storage first
      sessionStorage.clear();
      
      // Set new attorney ID before anything else
      if (urlAttorneyId) {
        sessionStorage.setItem('rcms_current_attorney_id', urlAttorneyId);
      }
      
      // Delete draft and reload after it completes
      deleteDraft().then(() => {
        window.location.reload();
      }).catch(() => {
        // Reload even if delete fails
        window.location.reload();
      });
      return;
    }
  }, [searchParams, deleteDraft]);

  // Generate intake ID when attorney code is available
  useEffect(() => {
    async function generateId() {
      // Regenerate if no ID, or if ID is in old RCMS-XXXX format (not INT- format)
      const needsNewId = !client.rcmsId || (client.rcmsId && !client.rcmsId.startsWith('INT-'));
      if (!attorneyCode || !needsNewId) return;
      
      // Count today's intakes to get sequence number
      const today = new Date();
      const yy = today.getFullYear().toString().slice(-2);
      const mm = (today.getMonth() + 1).toString().padStart(2, '0');
      const dd = today.getDate().toString().padStart(2, '0');
      const todayPrefix = `INT-${yy}${mm}${dd}-`;
      
      try {
        const { data: todayIntakes } = await supabaseGet(
          'rc_client_intakes',
          `select=id,intake_json&intake_json->>rcmsId=like.${todayPrefix}*`
        );
        
        const count = Array.isArray(todayIntakes) ? todayIntakes.length : 0;
        const newId = generateIntakeId(attorneyCode, count + 1);
        
        setClient(prev => ({ ...prev, rcmsId: newId }));
      } catch (error) {
        console.error('Error generating intake ID:', error);
        // Fallback - just use sequence 1
        const newId = generateIntakeId(attorneyCode, 1);
        setClient(prev => ({ ...prev, rcmsId: newId }));
      }
    }
    
    generateId();
  }, [attorneyCode, client.rcmsId]);

  // Inactivity detection
  const { isInactive, dismissInactivity } = useInactivityDetection({
    enabled: !showWelcome,
    timeoutMs: 15 * 60 * 1000, // 15 minutes
  });

  // Normalize legacy 0-100 fourPs values to 1-5 scale
  const normalizeFourPs = (fp: FourPs): FourPs => {
    const to15 = (v: number) => {
      if (v >= 1 && v <= 5) return Math.max(1, Math.min(5, Math.round(v)));
      // Legacy 0-4 -> map to 1-5 (0->1, 1->2, 2->3, 3->4, 4->5)
      if (v <= 4) return Math.max(1, Math.min(5, Math.round(v) + 1));
      // Legacy 0-100 -> map to 1-5
      return Math.max(1, Math.min(5, Math.round((v / 25) + 1)));
    };
    return {
      physical: to15(fp.physical as number),
      psychological: to15(fp.psychological as number),
      psychosocial: to15(fp.psychosocial as number),
      professional: to15(fp.professional as number),
    };
  };

  // Load draft on mount and set intake started time
  useEffect(() => {
    async function loadSavedDraft() {
      const draft = await loadDraft();
      
      // Set intake started time from draft or now
      if (!intakeStartedAt) {
        if (draft?.createdAt) {
          setIntakeStartedAt(new Date(draft.createdAt));
        } else {
          setIntakeStartedAt(new Date());
        }
      }
      
      if (draft && draft.formData) {
      const data = draft.formData as any;
        if (data.client) setClient(data.client);
        if (data.consent) setConsent(data.consent);
        if (data.intake) setIntake(data.intake);
        if (data.fourPs) setFourPs(normalizeFourPs(data.fourPs));
        if (data.sdoh) setSdoh(data.sdoh);
        if (data.medsBlock) setMedsBlock(data.medsBlock);
        if (data.medications) setMedications(data.medications);
        if (data.preInjuryMeds) setPreInjuryMeds(data.preInjuryMeds);
        if (data.postInjuryMeds) setPostInjuryMeds(data.postInjuryMeds);
        if (data.preInjuryTreatments) setPreInjuryTreatments(data.preInjuryTreatments);
        if (data.postInjuryTreatments) setPostInjuryTreatments(data.postInjuryTreatments);
        if (data.medAllergies) setMedAllergies(data.medAllergies);
        if (data.mentalHealth) setMentalHealth(data.mentalHealth);
        if (data.hasMeds) setHasMeds(data.hasMeds);
        if (data.incidentNarrative) setIncidentNarrative(data.incidentNarrative);
        if (data.incidentNarrativeExtra) setIncidentNarrativeExtra(data.incidentNarrativeExtra);
        if (data.physicalPreDiagnoses) setPhysicalPreDiagnoses(data.physicalPreDiagnoses);
        if (data.physicalPreNotes) setPhysicalPreNotes(data.physicalPreNotes);
        if (data.physicalPostDiagnoses) setPhysicalPostDiagnoses(data.physicalPostDiagnoses);
        if (data.physicalPostNotes) setPhysicalPostNotes(data.physicalPostNotes);
        if (data.bhPreDiagnoses) setBhPreDiagnoses(data.bhPreDiagnoses);
        if (data.bhPostDiagnoses) setBhPostDiagnoses(data.bhPostDiagnoses);
        if (data.bhNotes) setBhNotes(data.bhNotes);
        if (data.bhPreMeds) setBhPreMeds(data.bhPreMeds);
        if (data.bhPostMeds) setBhPostMeds(data.bhPostMeds);
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

  // Update client window expiration check every second
  useEffect(() => {
    if (!intakeStartedAt) return;

    const checkExpiration = () => {
      const deadline = new Date(intakeStartedAt.getTime() + CLIENT_INTAKE_WINDOW_HOURS * 60 * 60 * 1000);
      const now = new Date();
      setClientWindowExpired(now >= deadline);
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 1000);

    return () => clearInterval(interval);
  }, [intakeStartedAt]);

  // Update client countdown every second
  useEffect(() => {
    if (!intakeStartedAt) return;
    
    const updateCountdown = () => {
      const deadline = new Date(intakeStartedAt.getTime() + CLIENT_INTAKE_WINDOW_HOURS * 60 * 60 * 1000);
      const remaining = deadline.getTime() - Date.now();
      setClientMsRemaining(remaining);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [intakeStartedAt]);

  // Monitor mental health responses for risk flagging
  useEffect(() => {
    if (mentalHealth.selfHarm === 'yes' || mentalHealth.selfHarm === 'unsure') {
      // Create urgent task for RN follow-up
      const flagRisk = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Save to sensitive disclosures if we have a case ID
          if (createdCaseId) {
            await saveMentalHealthScreening({
              caseId: createdCaseId,
              itemCode: 'self_harm',
              response: mentalHealth.selfHarm as 'yes' | 'no' | 'unsure',
            });
          }

          // Create alert in database
          const { error } = await supabaseInsert('case_alerts', {
            case_id: createdCaseId || null, // Will be associated when case is created
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
  }, [mentalHealth.selfHarm, createdCaseId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {!showWelcome && (
        <IntakeSaveBar formData={formData} onSaveExit={() => navigate('/dashboard')} />
      )}
      <div className="max-w-4xl mx-auto py-8 px-4">
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
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Client Intake Wizard</h1>
                  <p className="text-muted-foreground mt-1">Complete the intake process step by step</p>
                </div>
                {intakeStartedAt && (
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Time Remaining</div>
                    <div className={`text-lg font-mono font-bold ${clientWindowExpired ? 'text-destructive' : 'text-primary'}`}>
                      {(() => {
                        if (clientMsRemaining <= 0) {
                          return "EXPIRED";
                        }
                        const days = Math.floor(clientMsRemaining / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((clientMsRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((clientMsRemaining % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((clientMsRemaining % (1000 * 60)) / 1000);
                        return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                      })()}
                    </div>
                  </div>
                )}
              </div>
              {clientWindowExpired && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your 7-day intake window has expired. Please restart the intake process.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Stepper
              step={step}
              setStep={setStep}
              labels={["Incident", "Medical", "Mental Health", "4Ps + SDOH", "Review"]}
            />
            
            {/* Progress Bar */}
            <div className="mt-4">
              <IntakeProgressBar percent={progressPercent} />
            </div>

        {/* Step 0: Incident Details (previously Step 1) */}
        {step === 0 && (
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Incident Details</h3>
            
            {/* Attorney Display (read-only, selected in ClientConsent) */}
            {(selectedAttorneyId || attorneyCode) && (
              <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                <h4 className="text-sm font-semibold mb-2">Attorney</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedAttorneyId && availableAttorneys.find(a => a.id === selectedAttorneyId)
                    ? `${availableAttorneys.find(a => a.id === selectedAttorneyId)?.full_name} (${availableAttorneys.find(a => a.id === selectedAttorneyId)?.attorney_code})`
                    : attorneyCode
                    ? `Attorney Code: ${attorneyCode}`
                    : 'Not selected'}
                </p>
              </div>
            )}

            {/* Show Intake ID right after attorney */}
            {client.rcmsId && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                <h4 className="text-lg font-semibold text-blue-900 mb-2">📝 Your Intake ID</h4>
                <p className="text-3xl font-mono font-bold text-blue-900 mb-3">{client.rcmsId}</p>
                <div className="bg-amber-50 border border-amber-300 rounded p-3">
                  <p className="text-sm text-amber-900 font-medium">
                    ⚠️ IMPORTANT: Write this number down or save it in a safe place. You will need it to check the status of your case.
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3 mb-6">
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

            {/* Incident Narrative */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Tell Us What Happened</h4>
                  <p className="text-sm text-muted-foreground">
                    Describe the incident in your own words. Include important details like what happened, where, and any immediate effects you experienced.
                  </p>
                </div>
              </div>

              <LabeledTextarea
                label="What Happened?"
                value={incidentNarrative}
                onChange={setIncidentNarrative}
                placeholder="Please describe what happened during the incident in your own words. Include details about the circumstances, what you were doing, any injuries sustained, and how you felt immediately after..."
                maxLength={10000}
                rows={8}
              />

              {incidentNarrative.length > 9000 && (
                <LabeledTextarea
                  label="Additional Details (Optional)"
                  value={incidentNarrativeExtra}
                  onChange={setIncidentNarrativeExtra}
                  placeholder="If you need to provide more details, use this space to continue your description..."
                  maxLength={5000}
                  rows={6}
                />
              )}
            </div>

            {!requiredIncidentOk && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Incident type & date are required.</AlertDescription>
              </Alert>
            )}
            <div className="mt-6">
              <Button 
                onClick={() => setStep(1)}
                disabled={!requiredIncidentOk}
                className="w-full sm:w-auto"
              >
                Continue to Medical History
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 1: Medical History (previously Step 2) */}
        {step === 1 && (
          <div className="space-y-8">
            {/* Allergies Section */}
            <IntakeMedicationAllergies
              allergies={medAllergies}
              onChange={setMedAllergies}
            />

            {/* Pre-Injury Section */}
            <div className="border-4 border-primary/30 rounded-lg p-6 space-y-6 bg-card/50">
              <h3 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2">
                PRE-INJURY / CHRONIC CONDITIONS
              </h3>
              
              <IntakePhysicalPreDiagnosisSelector
                selectedDiagnoses={physicalPreDiagnoses}
                additionalNotes={physicalPreNotes}
                onDiagnosesChange={setPhysicalPreDiagnoses}
                onNotesChange={setPhysicalPreNotes}
              />

              <IntakePreInjuryMedications
                medications={preInjuryMeds}
                onChange={setPreInjuryMeds}
              />

              <IntakePreInjuryTreatments
                treatments={preInjuryTreatments}
                onChange={setPreInjuryTreatments}
              />
            </div>

            {/* Post-Injury Section */}
            <div className="border-4 border-destructive/30 rounded-lg p-6 space-y-6 bg-card/50">
              <h3 className="text-xl font-bold text-foreground border-b-2 border-destructive pb-2">
                POST-INJURY / ACCIDENT-RELATED
              </h3>
              
              <IntakePhysicalPostDiagnosisSelector
                selectedDiagnoses={physicalPostDiagnoses}
                additionalNotes={physicalPostNotes}
                onDiagnosesChange={setPhysicalPostDiagnoses}
                onNotesChange={setPhysicalPostNotes}
              />

              <IntakePostInjuryMedications
                medications={postInjuryMeds}
                onChange={setPostInjuryMeds}
              />

              <IntakePostInjuryTreatments
                treatments={postInjuryTreatments}
                onChange={setPostInjuryTreatments}
              />
            </div>

            <FileUploadZone
              onFilesUploaded={(files) => setUploadedFiles(prev => [...prev, ...files])}
              draftId={draftId || undefined}
            />
            
            <div className="mt-6">
              <Button 
                onClick={() => setStep(2)}
                className="w-full sm:w-auto"
              >
                Continue to Mental Health
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Mental Health & Well-Being (previously Step 3) */}
        {step === 2 && (
          <div className="space-y-8">
            {/* Mental Health Screening Section */}
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
            </Card>

            {/* Sensitive or Personal Experiences Section */}
            <IntakeSensitiveExperiences
              data={sensitiveExperiences}
              onChange={setSensitiveExperiences}
              caseId={createdCaseId || undefined}
              onProgressChange={setSensitiveProgress}
            />

            {/* Pre-Accident BH Section */}
            <div className="border-4 border-primary/30 rounded-lg p-6 space-y-6 bg-card/50">
              <h3 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2">
                PRE-ACCIDENT BEHAVIORAL HEALTH
              </h3>
              
              <IntakeBehavioralHealthDiagnosisSelector
                selectedPreDiagnoses={bhPreDiagnoses}
                selectedPostDiagnoses={[]}
                additionalNotes=""
                onPreDiagnosesChange={setBhPreDiagnoses}
                onPostDiagnosesChange={() => {}}
                onNotesChange={() => {}}
                showOnlyPre={true}
              />

              <IntakeBehavioralHealthMedications
                preMedications={bhPreMeds}
                postMedications={[]}
                onPreChange={setBhPreMeds}
                onPostChange={() => {}}
                showOnlyPre={true}
              />
            </div>

            {/* Post-Accident BH Section */}
            <div className="border-4 border-destructive/30 rounded-lg p-6 space-y-6 bg-card/50">
              <h3 className="text-xl font-bold text-foreground border-b-2 border-destructive pb-2">
                POST-ACCIDENT BEHAVIORAL HEALTH
              </h3>
              
              <IntakeBehavioralHealthDiagnosisSelector
                selectedPreDiagnoses={[]}
                selectedPostDiagnoses={bhPostDiagnoses}
                additionalNotes={bhNotes}
                onPreDiagnosesChange={() => {}}
                onPostDiagnosesChange={setBhPostDiagnoses}
                onNotesChange={setBhNotes}
                showOnlyPost={true}
              />

              <IntakeBehavioralHealthMedications
                preMedications={[]}
                postMedications={bhPostMeds}
                onPreChange={() => {}}
                onPostChange={setBhPostMeds}
                showOnlyPost={true}
              />
            </div>
            
            <div className="mt-6">
              <Button 
                onClick={() => setStep(3)}
                className="w-full sm:w-auto"
              >
                Continue to 4Ps & SDOH
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: 4Ps & SDOH (previously Step 4) */}
        {step === 3 && (
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
                  <span className="font-semibold">1</span>
                  <span className="text-muted-foreground">Extremely difficult - Can't do normal daily things without help</span>

                  <span className="font-semibold">2</span>
                  <span className="text-muted-foreground">Really hard most days - Struggle with regular tasks and activities</span>

                  <span className="font-semibold">3</span>
                  <span className="text-muted-foreground">Pretty difficult at times - Have to push through to get things done</span>

                  <span className="font-semibold">4</span>
                  <span className="text-muted-foreground">A little tricky sometimes - Mostly able to do what I need to</span>

                  <span className="font-semibold">5</span>
                  <span className="text-muted-foreground">Doing just fine - No problems with my daily activities</span>
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
                      1: "Extremely difficult - Can't do normal daily things without help",
                      2: "Really hard most days - Struggle with regular tasks and activities",
                      3: "Pretty difficult at times - Have to push through to get things done",
                      4: "A little tricky sometimes - Mostly able to do what I need to",
                      5: "Doing just fine - No problems with my daily activities"
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
                            setFourPs((p) => ({ ...p, [k]: Math.floor(value) }))
                          }
                          min={1}
                          max={5}
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

            {/* SDOH Domains with 1-5 Scale */}
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
                      {(sdoh as any)[key] || 3}/5
                    </span>
                  </div>
                  <Slider
                    value={[(sdoh as any)[key] || 3]}
                    onValueChange={([value]) => handleSDOHChange(key, Math.floor(value))}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground italic">
                    {scoreLabels[(sdoh as any)[key] || 3]}
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
                onClick={() => setStep(4)}
                className="w-full sm:w-auto"
              >
                Continue to Review
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Review & Submit</h3>
            {sensitiveTag && <RestrictedBanner />}

            {/* Crisis Resources Banner */}
            <Alert className="mb-6 bg-destructive/10 border-destructive/30">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <AlertDescription className="text-sm">
                <strong className="font-bold">In Case of Emergency:</strong> If you are experiencing a medical or mental health crisis, please call <strong>911</strong> or the National Suicide Prevention Lifeline at <strong className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />988</strong> immediately. Do not wait for your RN Care Manager to contact you.
              </AlertDescription>
            </Alert>

            {/* Completion Checklist */}
            <div className="mb-6">
              <IntakeCompletionChecklist
                hasPersonalInfo={!!(client.rcmsId && client.dobMasked)}
                hasIncidentDetails={!!(intake.incidentDate && intake.incidentType && intake.injuries.length > 0)}
                hasAssessment={fourPs.physical !== 3 || fourPs.psychological !== 3 || fourPs.psychosocial !== 3 || fourPs.professional !== 3}
                hasMedications={preInjuryMeds.length > 0 || postInjuryMeds.length > 0}
                hasConsent={consent.signed}
              />
            </div>

            {/* Assessment Snapshot Explainer */}
            <AssessmentSnapshotExplainer 
              onUpdateSnapshot={() => setStep(3)}
              onAskCara={() => setShowCaraModal(true)}
              showUpdateButton={false}
            />

            {/* Snapshot Summary */}
            <div className="mt-6 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border-2 border-primary/20">
              <h4 className="text-xl font-bold mb-6 text-foreground">Assessment Snapshot</h4>

              {/* 4Ps Section */}
              <div className="mb-6">
                <h5 className="text-sm font-extrabold mb-3 text-foreground">4Ps of Wellness</h5>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Physical', value: fourPs.physical },
                    { label: 'Psychological', value: fourPs.psychological },
                    { label: 'Psychosocial', value: fourPs.psychosocial },
                    { label: 'Professional', value: fourPs.professional }
                  ].map(({ label, value }) => {
                    const bgColor = value === 5 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                   value === 4 ? 'bg-emerald-100 border-emerald-300 text-emerald-900' :
                                   value === 3 ? 'bg-amber-50 border-amber-300 text-amber-800' :
                                   value === 2 ? 'bg-red-50 border-red-300 text-red-800' :
                                   'bg-red-100 border-red-400 text-red-900';
                    return (
                      <div key={label} className={`rounded-full px-4 py-2 border-2 font-extrabold ${bgColor}`}>
                        <span className="opacity-80 font-bold">{label}:</span> {value}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SDOH Section */}
              <div className="mb-6">
                <h5 className="text-sm font-extrabold mb-3 text-foreground">Social Determinants of Health</h5>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Housing', value: sdoh.housing },
                    { label: 'Food', value: sdoh.food },
                    { label: 'Transport', value: sdoh.transport },
                    { label: 'Insurance', value: sdoh.insuranceGap },
                    { label: 'Financial', value: sdoh.financial },
                    { label: 'Employment', value: sdoh.employment },
                    { label: 'Support', value: sdoh.social_support },
                    { label: 'Safety', value: sdoh.safety },
                    { label: 'Access', value: sdoh.healthcare_access }
                  ].map(({ label, value }) => {
                    const v = value ?? 3;
                    const bgColor = v === 5 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                   v === 4 ? 'bg-emerald-100 border-emerald-300 text-emerald-900' :
                                   v === 3 ? 'bg-amber-50 border-amber-300 text-amber-800' :
                                   v === 2 ? 'bg-red-50 border-red-300 text-red-800' :
                                   'bg-red-100 border-red-400 text-red-900';
                    return (
                      <div key={label} className={`rounded-full px-4 py-2 border-2 font-extrabold ${bgColor}`}>
                        <span className="opacity-80 font-bold">{label}:</span> {v}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Case Health Meter */}
              <div className="mb-2">
                <h5 className="text-sm font-extrabold mb-3 text-foreground">Overall Health Indicator (1–5)</h5>
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative h-3 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, (((() => {
                          const allValues = [
                            fourPs.physical, fourPs.psychological, fourPs.psychosocial, fourPs.professional,
                            typeof sdoh.housing === 'number' ? sdoh.housing : 3,
                            typeof sdoh.food === 'number' ? sdoh.food : 3,
                            typeof sdoh.transport === 'number' ? sdoh.transport : 3,
                            typeof sdoh.insuranceGap === 'number' ? sdoh.insuranceGap : 3,
                            typeof sdoh.financial === 'number' ? sdoh.financial : 3,
                            typeof sdoh.employment === 'number' ? sdoh.employment : 3,
                            typeof sdoh.social_support === 'number' ? sdoh.social_support : 3,
                            typeof sdoh.safety === 'number' ? sdoh.safety : 3,
                            typeof sdoh.healthcare_access === 'number' ? sdoh.healthcare_access : 3
                          ];
                          const sum = allValues.reduce((a, b) => a + b, 0);
                          return sum / allValues.length;
                        })() - 1) / 4) * 100)}%`,
                        background: 'linear-gradient(90deg, #c62828, #b09837, #18a05f)'
                      }}
                    />
                  </div>
                  <div className="text-2xl font-black min-w-[64px] text-right text-foreground">
                    {(() => {
                      const allValues = [
                        fourPs.physical, fourPs.psychological, fourPs.psychosocial, fourPs.professional,
                        typeof sdoh.housing === 'number' ? sdoh.housing : 3,
                        typeof sdoh.food === 'number' ? sdoh.food : 3,
                        typeof sdoh.transport === 'number' ? sdoh.transport : 3,
                        typeof sdoh.insuranceGap === 'number' ? sdoh.insuranceGap : 3,
                        typeof sdoh.financial === 'number' ? sdoh.financial : 3,
                        typeof sdoh.employment === 'number' ? sdoh.employment : 3,
                        typeof sdoh.social_support === 'number' ? sdoh.social_support : 3,
                        typeof sdoh.safety === 'number' ? sdoh.safety : 3,
                        typeof sdoh.healthcare_access === 'number' ? sdoh.healthcare_access : 3
                      ];
                      const sum = allValues.reduce((a, b) => a + b, 0);
                      return Math.floor(sum / allValues.length);
                    })()}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  5 Stable · 4 Mild · 3 Moderate · 1–2 Critical
                </p>
              </div>
            </div>

            {/* Case Summary - Final Review */}
            <div className="mt-8 p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-lg border-2 border-border">
              <h4 className="text-lg font-bold mb-4 text-foreground">Case Summary</h4>
              <div className="space-y-3 text-sm">
                <div className="flex py-2 border-b border-border">
                  <span className="font-medium w-40">RCMS ID:</span>
                  <span className="select-none text-muted-foreground" title="PHI block">
                    {client.rcmsId || 'Generating...'}
                  </span>
                </div>
                <div className="flex py-2 border-b border-border">
                  <span className="font-medium w-40">DOB:</span>
                  <span className="select-none text-muted-foreground">{client.dobMasked}</span>
                </div>
                <div className="flex py-2 border-b border-border">
                  <span className="font-medium w-40">Attorney:</span>
                  <span className="text-muted-foreground">
                    {attorneyCode || "—"}
                  </span>
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
                  <span className="font-medium w-40">Assessment Score:</span>
                  <span className="text-muted-foreground font-semibold">
                    {(() => {
                      const allValues = [
                        fourPs.physical, fourPs.psychological, fourPs.psychosocial, fourPs.professional,
                        typeof sdoh.housing === 'number' ? sdoh.housing : 3,
                        typeof sdoh.transport === 'number' ? sdoh.transport : 3,
                        typeof sdoh.food === 'number' ? sdoh.food : 3,
                        typeof sdoh.insuranceGap === 'number' ? sdoh.insuranceGap : 3,
                        typeof sdoh.financial === 'number' ? sdoh.financial : 3,
                        typeof sdoh.employment === 'number' ? sdoh.employment : 3,
                        typeof sdoh.social_support === 'number' ? sdoh.social_support : 3,
                        typeof sdoh.safety === 'number' ? sdoh.safety : 3,
                        typeof sdoh.healthcare_access === 'number' ? sdoh.healthcare_access : 3
                      ];
                      const sum = allValues.reduce((a, b) => a + b, 0);
                      const score = Math.floor(sum / allValues.length);
                      return `${score} — ${
                        score >= 5 ? 'Stable' :
                        score >= 4 ? 'Mild' :
                        score >= 3 ? 'Moderate' : 'Critical'
                      }`;
                    })()}
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
              
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <Info className="inline-block w-4 h-4 mr-2 mb-1" />
                  Once your intake is complete, you'll receive information about your treatment team — including your RN Care Manager and approved providers. This will include clear guidance on who to contact, how to reach them, and when to use each communication channel for updates or support.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  You can expect to be contacted by your RN Care Manager within 24–48 hours after your intake is submitted.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you have not been contacted within that time, please log in to your Client Portal and click the "Contact RN Care Manager" button to notify our team directly.
                </p>
              </div>

              {/* Document Preparation Tip */}
              <div className="mt-6 p-4 bg-accent/10 border border-accent/30 rounded-lg">
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-sm text-foreground mb-1">Prepare Your Documents</h5>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      To help your RN Care Manager provide the best support, consider gathering any medical records, bills, treatment notes, or photos related to your injuries. Having these ready when your RN reaches out will help expedite your care coordination.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* What Happens Next Timeline */}
            <div className="mt-8">
              <IntakeNextStepsTimeline />
              
              <Alert className="bg-blue-50 border-blue-200 mt-4">
                <AlertDescription className="text-blue-900">
                  <p className="font-semibold mb-2">📝 Save Your Intake ID</p>
                  <p className="mb-2">
                    Your Intake ID is: <span className="font-mono font-bold">{client.rcmsId || 'Generating...'}</span>
                  </p>
                  <p>
                    You can check your status anytime at{' '}
                    <a href="/check-status" className="underline font-medium">Check Intake Status</a>
                  </p>
                </AlertDescription>
              </Alert>
            </div>

            {/* Editable Information Note */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-sm text-foreground mb-1">Need to Update Information Later?</h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You can update your medications, treatments, allergies, and wellness check-ins anytime through your Client Portal. Your baseline assessment will remain unchanged, but you'll be able to track your progress over time.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Reassurance */}
            <div className="mt-6 p-4 bg-secondary/10 border border-secondary/30 rounded-lg">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-sm text-foreground mb-1">Your Privacy is Protected</h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    All information you provide is securely encrypted and HIPAA-compliant. Your personal health information is protected and will only be shared with your authorized care team members.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={submit} aria-label="Submit intake">
                Submit Intake
              </Button>
              <Button 
                variant="outline" 
                onClick={generatePDFSummary}
                aria-label="Save PDF summary"
              >
                <Download className="w-4 h-4 mr-2" />
                Save PDF Summary
              </Button>
              <Button variant="secondary" onClick={() => setStep(3)}>
                Back
              </Button>
            </div>
          </Card>
        )}

            <WizardNav 
              step={step} 
              setStep={setStep} 
              last={4}
              canAdvance={
                step === 1 ? hasMeds !== '' : 
                step === 2 ? (sensitiveProgress ? !sensitiveProgress.blockNavigation : true) :
                true
              }
              blockReason={
                step === 2 && sensitiveProgress?.blockNavigation 
                  ? 'Please complete consent choices in the Sensitive Experiences section'
                  : undefined
              }
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
    </div>
  );
}
