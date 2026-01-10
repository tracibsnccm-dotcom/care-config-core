import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { ClientIdService, type ClientType } from "@/lib/clientIdService";
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

export default function IntakeWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if consents were completed before allowing intake access
  useEffect(() => {
    const consentSessionId = sessionStorage.getItem("rcms_consent_session_id");
    const consentsCompleted = sessionStorage.getItem("rcms_consents_completed");
    
    if (!consentSessionId || !consentsCompleted) {
      // Redirect to consent flow
      window.location.href = "/client-consent";
    }
  }, []);

  // Load available attorneys on mount
  useEffect(() => {
    const loadAttorneys = async () => {
      const { data, error } = await supabaseGet(
        'rc_users',
        'select=id,full_name,attorney_code&role=eq.attorney&order=full_name.asc'
      );
      if (!error && data) {
        const attorneys = Array.isArray(data) ? data : [data];
        setAvailableAttorneys(attorneys.filter(a => a.attorney_code)); // Only show attorneys with codes
      }
    };
    loadAttorneys();
  }, []);
  
  const [showWelcome, setShowWelcome] = useState(true);
  const [step, setStep] = useState(0);
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
    rcmsId: "RCMS-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
    attyRef: "AT-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
    dobMasked: "1985-XX-XX",
    gender: "prefer_not_to_say",
    state: "TX",
  });

  const [attorneyCode, setAttorneyCode] = useState("");
  const [clientType, setClientType] = useState<ClientType>('I');
  const [availableAttorneys, setAvailableAttorneys] = useState<{id: string, full_name: string, attorney_code: string}[]>([]);
  const [selectedAttorneyId, setSelectedAttorneyId] = useState<string>("");

  const [consent, setConsent] = useState<Consent>({
    signed: false,
    scope: { shareWithAttorney: false, shareWithProviders: false },
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
    setSdoh((s) => ({ ...s, [domain]: severity }));
    
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

    // Check if e-signature is completed
    if (!clientEsign.agreed || !clientEsign.signerFullName.trim()) {
      toast({
        title: "E-Signature Required",
        description: "Please complete the Consent & Privacy step and provide your electronic signature before submitting.",
        variant: "destructive",
      });
      setStep(5); // Navigate to consent step
      return;
    }

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
    const avgScore = (allValues.reduce((a, b) => a + b, 0) / allValues.length).toFixed(1);
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
                        const deadline = new Date(intakeStartedAt.getTime() + CLIENT_INTAKE_WINDOW_HOURS * 60 * 60 * 1000);
                        const msRemaining = deadline.getTime() - Date.now();
                        if (msRemaining <= 0) {
                          return "EXPIRED";
                        }
                        const days = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((msRemaining % (1000 * 60)) / 1000);
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
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Select Your Attorney</Label>
                      <Select value={selectedAttorneyId} onValueChange={(val) => {
                        setSelectedAttorneyId(val);
                        const attorney = availableAttorneys.find(a => a.id === val);
                        if (attorney) setAttorneyCode(attorney.attorney_code);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your attorney..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAttorneys.map(attorney => (
                            <SelectItem key={attorney.id} value={attorney.id}>
                              {attorney.full_name} ({attorney.attorney_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-center text-sm text-muted-foreground">— OR —</div>
                    <LabeledInput
                      label="Enter Attorney Code"
                      value={attorneyCode}
                      onChange={(val) => {
                        setAttorneyCode(val);
                        setSelectedAttorneyId(""); // Clear dropdown if typing code
                      }}
                      placeholder="e.g., 01, 02"
                    />
                  </div>
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
                onClick={() => setStep(3)}
                className="w-full sm:w-auto"
              >
                Continue to Mental Health
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Mental Health & Well-Being */}
        {step === 3 && (
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
                onClick={() => setStep(4)}
                className="w-full sm:w-auto"
              >
                Continue to 4Ps & SDOH
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
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
                            setFourPs((p) => ({ ...p, [k]: value }))
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
                    onValueChange={([value]) => handleSDOHChange(key, value)}
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
                onClick={() => setStep(5)}
                className="w-full sm:w-auto"
              >
                Continue to Review
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 5: Consent & Privacy */}
        {step === 5 && (
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">{CLIENT_DOCUMENTS.clientConsentTitle}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Please review and electronically sign the following documents before submitting your intake.
            </p>

            {/* Document Sections - Scrollable */}
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 mb-6 border rounded-lg p-4">
              {/* Privacy Policy */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-foreground mb-3">Privacy Policy</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {CLIENT_DOCUMENTS.clientPrivacyPolicyText}
                </div>
              </div>

              {/* HIPAA Notice */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-foreground mb-3">HIPAA Notice of Privacy Practices</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {CLIENT_DOCUMENTS.clientHipaaNoticeText}
                </div>
              </div>

              {/* Consent to Care Coordination */}
              <div className="pb-4">
                <h4 className="font-semibold text-foreground mb-3">Consent to Care Coordination</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {CLIENT_DOCUMENTS.clientConsentToCareText}
                </div>
              </div>
            </div>

            {/* E-signature Section */}
            <div className="space-y-4 border-t pt-6">
              <p className="text-sm text-muted-foreground italic">
                {CLIENT_DOCUMENTS.clientEsignDisclosureText}
              </p>

              {/* Agreement Checkbox */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent-agreement"
                  checked={clientEsign.agreed}
                  onCheckedChange={(checked) =>
                    setClientEsign((prev) => ({ ...prev, agreed: checked as boolean }))
                  }
                  className="mt-1"
                />
                <Label htmlFor="consent-agreement" className="cursor-pointer text-sm leading-relaxed">
                  I have read and agree to the Privacy Policy, HIPAA Notice, and Consent to Care Coordination.
                </Label>
              </div>

              {/* Full Legal Name */}
              <div>
                <Label htmlFor="signer-full-name" className="text-sm font-medium">
                  Full Legal Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="signer-full-name"
                  value={clientEsign.signerFullName}
                  onChange={(e) =>
                    setClientEsign((prev) => ({ ...prev, signerFullName: e.target.value }))
                  }
                  placeholder="Enter your full legal name"
                  className="mt-1"
                />
              </div>

              {/* Initials (Optional) */}
              <div>
                <Label htmlFor="signer-initials" className="text-sm font-medium">
                  Initials (Optional)
                </Label>
                <Input
                  id="signer-initials"
                  value={clientEsign.signerInitials}
                  onChange={(e) =>
                    setClientEsign((prev) => ({ ...prev, signerInitials: e.target.value }))
                  }
                  placeholder="Enter your initials"
                  className="mt-1 max-w-[200px]"
                  maxLength={10}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  // Helper to escape HTML
                  const escapeHtml = (s: string) => s
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");

                  // Open print view
                  const signedDate = new Date().toLocaleString();
                  const signatureName = clientEsign.signerFullName.trim() || "[Not yet signed]";
                  const signatureMethod = "Signed electronically (typed name)";
                  
                  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Client Consent Documents</title>
    <style>
      @page { size: Letter; margin: 0.75in; }
      body { 
        font-family: ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: #0f172a;
        line-height: 1.6;
      }
      .header { margin-bottom: 24px; }
      .title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
      .hr { height: 1px; background: #e2e8f0; margin: 16px 0; }
      .document-section { margin-bottom: 32px; }
      .document-title { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
      .document-text { font-size: 12px; white-space: pre-wrap; line-height: 1.6; }
      .signature-block { margin-top: 32px; padding-top: 24px; border-top: 2px solid #0f172a; }
      .signature-info { margin-bottom: 16px; font-size: 12px; }
      .signature-line { margin-top: 24px; }
      .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b; text-align: center; }
      @media print { .no-print { display: none; } }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="title">Client Consent Documents</div>
    </div>
    <div class="hr"></div>
    
    <div class="document-section">
      <div class="document-title">Privacy Policy</div>
      <div class="document-text">${escapeHtml(CLIENT_DOCUMENTS.clientPrivacyPolicyText).replace(/\n/g, '<br>')}</div>
    </div>
    
    <div class="document-section">
      <div class="document-title">HIPAA Notice of Privacy Practices</div>
      <div class="document-text">${escapeHtml(CLIENT_DOCUMENTS.clientHipaaNoticeText).replace(/\n/g, '<br>')}</div>
    </div>
    
    <div class="document-section">
      <div class="document-title">Consent to Care Coordination</div>
      <div class="document-text">${escapeHtml(CLIENT_DOCUMENTS.clientConsentToCareText).replace(/\n/g, '<br>')}</div>
    </div>
    
    <div class="signature-block">
      <div class="signature-info">
        <div><strong>Signed by:</strong> ${escapeHtml(signatureName)}</div>
        <div><strong>Signed at:</strong> ${escapeHtml(signedDate)}</div>
        <div><strong>Signature Method:</strong> ${escapeHtml(signatureMethod)}</div>
      </div>
    </div>
    
    <div class="footer">
      Confidential — Client Record
    </div>
    
    <div class="no-print" style="margin-top:16px;">
      <button onclick="window.print()" style="padding: 8px 16px; font-size: 14px; cursor: pointer; background: #0f172a; color: white; border: none; border-radius: 4px;">
        Print / Save as PDF
      </button>
    </div>
    <script>window.onload = () => setTimeout(() => window.print(), 250);</script>
  </body>
</html>`;

                  const w = window.open("", "_blank");
                  if (!w) {
                    toast({
                      title: "Print Preview Failed",
                      description: "Please allow pop-ups to print these documents.",
                      variant: "destructive",
                    });
                    return;
                  }
                  w.document.open();
                  w.document.write(html);
                  w.document.close();
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print / Save Copy
              </Button>
              <Button
                onClick={() => setStep(6)}
                disabled={!clientEsign.agreed || !clientEsign.signerFullName.trim()}
                className="flex-1"
              >
                Sign & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="secondary" onClick={() => setStep(4)}>
                Back
              </Button>
            </div>
          </Card>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
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
              onUpdateSnapshot={() => setStep(4)}
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
                      return (sum / allValues.length).toFixed(1);
                    })()}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  4.5–5.0 Stable · 3.5–4.4 Mild · 2.5–3.4 Moderate · 1.0–2.4 Critical
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
                    {client.rcmsId}
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
                      const score = (sum / allValues.length).toFixed(1);
                      return `${score} — ${
                        parseFloat(score) >= 4.5 ? 'Stable' :
                        parseFloat(score) >= 3.5 ? 'Mild' :
                        parseFloat(score) >= 2.5 ? 'Moderate' : 'Critical'
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
              <Button variant="secondary" onClick={() => setStep(4)}>
                Back
              </Button>
            </div>
          </Card>
        )}

            <WizardNav 
              step={step} 
              setStep={setStep} 
              last={6}
              canAdvance={
                step === 2 ? hasMeds !== '' : 
                step === 3 ? (sensitiveProgress ? !sensitiveProgress.blockNavigation : true) :
                step === 5 ? (clientEsign.agreed && clientEsign.signerFullName.trim().length > 0) :
                true
              }
              blockReason={
                step === 3 && sensitiveProgress?.blockNavigation 
                  ? 'Please complete consent choices in the Sensitive Experiences section'
                  : step === 5 && (!clientEsign.agreed || !clientEsign.signerFullName.trim())
                  ? 'Please agree to the documents and provide your full legal name'
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
