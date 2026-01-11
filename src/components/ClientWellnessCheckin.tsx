import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, CheckCircle, Loader2, ArrowLeft, ArrowRight, Plus, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface WellnessCheckinProps {
  caseId: string;
}

// Scale labels for 4Ps (1=Struggling, 5=Thriving)
const SCALE_LABELS = {
  1: "Struggling",
  2: "Challenged",
  3: "Managing",
  4: "Improving",
  5: "Thriving"
};

// 4Ps descriptions per source of truth
const FOUR_PS = {
  physical: {
    label: "Physical",
    code: "P1",
    description: "How is your body feeling? Pain, mobility, energy, sleep."
  },
  psychological: {
    label: "Psychological", 
    code: "P2",
    description: "How is your mental/emotional state? Mood, anxiety, stress, coping."
  },
  psychosocial: {
    label: "Psychosocial",
    code: "P3", 
    description: "How is your support system? Family, friends, resources, barriers."
  },
  professional: {
    label: "Professional",
    code: "P4",
    description: "How is your ability to work/function? Daily activities, productivity, goals."
  }
};

interface AllergyEntry {
  id: string;
  medication: string;
  reaction: string;
  severity: string;
}

interface MedicationEntry {
  id: string;
  brandName: string;
  genericName: string;
  dose: string;
  frequency: string;
  route: string;
  purpose: string;
  prescriber: string;
  startDate: string;
  endDate: string;
  pharmacy: string;
  notes: string;
}

export function ClientWellnessCheckin({ caseId }: WellnessCheckinProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckin, setLastCheckin] = useState<Date | null>(null);
  
  // Step 1: Allergies
  const [hasAllergies, setHasAllergies] = useState<string>("");
  const [allergies, setAllergies] = useState<AllergyEntry[]>([]);
  const [allergiesAttested, setAllergiesAttested] = useState(false);
  
  // Step 2: Medication Reconciliation
  const [preInjuryMeds, setPreInjuryMeds] = useState<MedicationEntry[]>([]);
  const [postInjuryMeds, setPostInjuryMeds] = useState<MedicationEntry[]>([]);
  const [medsAttested, setMedsAttested] = useState(false);
  
  // Step 3: Wellness Check-in
  const [physical, setPhysical] = useState(3);
  const [psychological, setPsychological] = useState(3);
  const [psychosocial, setPsychosocial] = useState(3);
  const [professional, setProfessional] = useState(3);
  const [painLevel, setPainLevel] = useState(5);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadLastCheckin();
  }, [caseId]);

  async function loadLastCheckin() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_client_checkins?case_id=eq.${caseId}&order=created_at.desc&limit=1`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setLastCheckin(new Date(data[0].created_at));
        }
      }
    } catch (err) {
      console.error("Error loading last check-in:", err);
    }
  }

  const addAllergy = () => {
    setAllergies([...allergies, { 
      id: crypto.randomUUID(), 
      medication: '', 
      reaction: '', 
      severity: 'mild' 
    }]);
  };

  const removeAllergy = (id: string) => {
    setAllergies(allergies.filter(a => a.id !== id));
  };

  const updateAllergy = (id: string, field: keyof AllergyEntry, value: string) => {
    setAllergies(allergies.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const addPreInjuryMed = () => {
    setPreInjuryMeds([...preInjuryMeds, { 
      id: crypto.randomUUID(), 
      brandName: '', 
      genericName: '', 
      dose: '', 
      frequency: '', 
      route: '', 
      purpose: '', 
      prescriber: '', 
      startDate: '', 
      endDate: '', 
      pharmacy: '', 
      notes: '' 
    }]);
  };

  const removePreInjuryMed = (id: string) => {
    setPreInjuryMeds(preInjuryMeds.filter(m => m.id !== id));
  };

  const updatePreInjuryMed = (id: string, field: keyof MedicationEntry, value: string) => {
    setPreInjuryMeds(preInjuryMeds.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addPostInjuryMed = () => {
    setPostInjuryMeds([...postInjuryMeds, { 
      id: crypto.randomUUID(), 
      brandName: '', 
      genericName: '', 
      dose: '', 
      frequency: '', 
      route: '', 
      purpose: '', 
      prescriber: '', 
      startDate: '', 
      endDate: '', 
      pharmacy: '', 
      notes: '' 
    }]);
  };

  const removePostInjuryMed = (id: string) => {
    setPostInjuryMeds(postInjuryMeds.filter(m => m.id !== id));
  };

  const updatePostInjuryMed = (id: string, field: keyof MedicationEntry, value: string) => {
    setPostInjuryMeds(postInjuryMeds.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const canProceedStep1 = () => {
    if (hasAllergies === "") return false;
    if (hasAllergies === "yes" && allergies.length === 0) return false;
    return allergiesAttested;
  };

  const canProceedStep2 = () => {
    return medsAttested;
  };

  const canProceedStep3 = () => {
    return true; // Wellness check-in is always optional
  };

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Save allergies if provided
      if (hasAllergies === "yes" && allergies.length > 0) {
        // TODO: Save allergies to database
      }
      
      // Save medications if provided
      if (preInjuryMeds.length > 0 || postInjuryMeds.length > 0) {
        // TODO: Save medications to database
      }
      
      // Save wellness check-in
      const checkinData = {
        case_id: caseId,
        pain_scale: painLevel,
        p_physical: (physical - 1) * 25,
        p_psychological: (psychological - 1) * 25,
        p_psychosocial: (psychosocial - 1) * 25,
        p_professional: (professional - 1) * 25,
        note: notes || null,
      };
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rc_client_checkins`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(checkinData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save check-in');
      }
      
      setSubmitted(true);
      setLastCheckin(new Date());
      toast.success("Wellness check-in saved!");
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setCurrentStep(1);
        setHasAllergies("");
        setAllergies([]);
        setAllergiesAttested(false);
        setPreInjuryMeds([]);
        setPostInjuryMeds([]);
        setMedsAttested(false);
        setNotes("");
        setPhysical(3);
        setPsychological(3);
        setPsychosocial(3);
        setProfessional(3);
        setPainLevel(5);
      }, 3000);
      
    } catch (err: any) {
      console.error("Check-in error:", err);
      setError(err.message || "Failed to save check-in");
      toast.error("Failed to save check-in");
    } finally {
      setIsSubmitting(false);
    }
  }

  function ScoreSlider({ 
    label, 
    code, 
    description, 
    value, 
    onChange 
  }: { 
    label: string; 
    code: string; 
    description: string; 
    value: number; 
    onChange: (v: number) => void;
  }) {
    return (
      <div 
        className="space-y-3 p-4 border border-teal-300 rounded-lg"
        style={{ backgroundColor: '#4fb9af' }}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded">{code}</span>
              <span className="text-white font-medium">{label}</span>
            </div>
            <p className="text-white/80 text-sm mt-1">{description}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-white">{value}</span>
            <p className="text-xs text-white/80">{SCALE_LABELS[value as keyof typeof SCALE_LABELS]}</p>
          </div>
        </div>
        <Slider
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
          min={1}
          max={5}
          step={1}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-white/70">
          <span>1 - Struggling</span>
          <span>5 - Thriving</span>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Check-in Complete!</h3>
          <p className="text-slate-500">Thank you for sharing how you're feeling today.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {lastCheckin && (
        <Alert className="bg-amber-500 border-amber-600">
          <AlertDescription className="text-white">
            Last check-in: {lastCheckin.toLocaleDateString()} at {lastCheckin.toLocaleTimeString()}
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            Daily Wellness Check-in
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <div className={`flex-1 h-2 rounded-full ${currentStep >= 1 ? 'bg-amber-500' : 'bg-white/30'}`} />
            <div className={`flex-1 h-2 rounded-full ${currentStep >= 2 ? 'bg-amber-500' : 'bg-white/30'}`} />
            <div className={`flex-1 h-2 rounded-full ${currentStep >= 3 ? 'bg-amber-500' : 'bg-white/30'}`} />
          </div>
          <p className="text-white/80 text-sm mt-2">
            Step {currentStep} of 3: {
              currentStep === 1 ? "Allergies" :
              currentStep === 2 ? "Medication Reconciliation" :
              "Wellness Check-in"
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Allergies */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="bg-white/20 border border-white/30 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Medication Allergies & Sensitivities</h4>
                    <p className="text-white/80 text-sm">
                      This information is critical for your safety. Please list any medications you are allergic to or have had negative reactions with.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white font-medium">Do you have any medication allergies or sensitivities?</Label>
                    <RadioGroup value={hasAllergies} onValueChange={setHasAllergies}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="allergies-no" />
                        <Label htmlFor="allergies-no" className="text-white cursor-pointer font-normal">No</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="allergies-yes" />
                        <Label htmlFor="allergies-yes" className="text-white cursor-pointer font-normal">Yes</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {hasAllergies === "yes" && (
                    <div className="space-y-3">
                      {allergies.map((allergy) => (
                        <div key={allergy.id} className="bg-white/10 border border-white/20 rounded-lg p-3 space-y-2 relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0 text-white hover:bg-white/20"
                            onClick={() => removeAllergy(allergy.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                              <Label className="text-white text-sm">Medication/Substance*</Label>
                              <Input
                                value={allergy.medication}
                                onChange={(e) => updateAllergy(allergy.id, 'medication', e.target.value)}
                                placeholder="e.g., Penicillin"
                                className="bg-white border-slate-200"
                              />
                            </div>
                            <div>
                              <Label className="text-white text-sm">Reaction</Label>
                              <Input
                                value={allergy.reaction}
                                onChange={(e) => updateAllergy(allergy.id, 'reaction', e.target.value)}
                                placeholder="e.g., Hives, swelling"
                                className="bg-white border-slate-200"
                              />
                            </div>
                            <div>
                              <Label className="text-white text-sm">Severity</Label>
                              <select
                                value={allergy.severity}
                                onChange={(e) => updateAllergy(allergy.id, 'severity', e.target.value)}
                                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                              >
                                <option value="mild">Mild</option>
                                <option value="moderate">Moderate</option>
                                <option value="severe">Severe</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addAllergy}
                        className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Allergy
                      </Button>
                    </div>
                  )}

                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="allergies-attest"
                      checked={allergiesAttested}
                      onCheckedChange={(checked) => setAllergiesAttested(checked === true)}
                      className="mt-1"
                    />
                    <Label htmlFor="allergies-attest" className="text-white text-sm cursor-pointer">
                      I attest that the allergy information provided above is accurate and complete to the best of my knowledge.
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Medication Reconciliation */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-white/20 border border-white/30 rounded-lg p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Medication Reconciliation</h4>
                    <p className="text-white/80 text-sm">
                      Please list all medications you are currently taking or have taken related to your injury.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-white font-medium mb-2">Pre-Injury Medications</h5>
                    <p className="text-white/80 text-sm mb-3">Medications you were taking before the incident occurred.</p>
                    {preInjuryMeds.map((med) => (
                      <div key={med.id} className="bg-white/10 border border-white/20 rounded-lg p-3 space-y-2 mb-2 relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0 text-white hover:bg-white/20"
                          onClick={() => removePreInjuryMed(med.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <Label className="text-white text-sm">Brand Name</Label>
                            <Input
                              value={med.brandName}
                              onChange={(e) => updatePreInjuryMed(med.id, 'brandName', e.target.value)}
                              className="bg-white border-slate-200"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-sm">Generic Name</Label>
                            <Input
                              value={med.genericName}
                              onChange={(e) => updatePreInjuryMed(med.id, 'genericName', e.target.value)}
                              className="bg-white border-slate-200"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-sm">Dose</Label>
                            <Input
                              value={med.dose}
                              onChange={(e) => updatePreInjuryMed(med.id, 'dose', e.target.value)}
                              placeholder="e.g., 200mg"
                              className="bg-white border-slate-200"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-sm">Frequency</Label>
                            <Input
                              value={med.frequency}
                              onChange={(e) => updatePreInjuryMed(med.id, 'frequency', e.target.value)}
                              placeholder="e.g., Twice daily"
                              className="bg-white border-slate-200"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPreInjuryMed}
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Pre-Injury Medication
                    </Button>
                  </div>

                  <div>
                    <h5 className="text-white font-medium mb-2">Post-Injury Medications</h5>
                    <p className="text-white/80 text-sm mb-3">Medications prescribed or started after the incident.</p>
                    {postInjuryMeds.map((med) => (
                      <div key={med.id} className="bg-white/10 border border-white/20 rounded-lg p-3 space-y-2 mb-2 relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0 text-white hover:bg-white/20"
                          onClick={() => removePostInjuryMed(med.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <Label className="text-white text-sm">Brand Name</Label>
                            <Input
                              value={med.brandName}
                              onChange={(e) => updatePostInjuryMed(med.id, 'brandName', e.target.value)}
                              className="bg-white border-slate-200"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-sm">Generic Name</Label>
                            <Input
                              value={med.genericName}
                              onChange={(e) => updatePostInjuryMed(med.id, 'genericName', e.target.value)}
                              className="bg-white border-slate-200"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-sm">Dose</Label>
                            <Input
                              value={med.dose}
                              onChange={(e) => updatePostInjuryMed(med.id, 'dose', e.target.value)}
                              placeholder="e.g., 200mg"
                              className="bg-white border-slate-200"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-sm">Frequency</Label>
                            <Input
                              value={med.frequency}
                              onChange={(e) => updatePostInjuryMed(med.id, 'frequency', e.target.value)}
                              placeholder="e.g., Twice daily"
                              className="bg-white border-slate-200"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPostInjuryMed}
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Post-Injury Medication
                    </Button>
                  </div>

                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="meds-attest"
                      checked={medsAttested}
                      onCheckedChange={(checked) => setMedsAttested(checked === true)}
                      className="mt-1"
                    />
                    <Label htmlFor="meds-attest" className="text-white text-sm cursor-pointer">
                      I attest that the medication information provided above is accurate and complete to the best of my knowledge.
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Wellness Check-in */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-white/80 text-sm mb-4">
                Rate how you're feeling in each area (1 = Struggling, 5 = Thriving)
              </p>
              
              <ScoreSlider
                label={FOUR_PS.physical.label}
                code={FOUR_PS.physical.code}
                description={FOUR_PS.physical.description}
                value={physical}
                onChange={setPhysical}
              />
              
              <ScoreSlider
                label={FOUR_PS.psychological.label}
                code={FOUR_PS.psychological.code}
                description={FOUR_PS.psychological.description}
                value={psychological}
                onChange={setPsychological}
              />
              
              <ScoreSlider
                label={FOUR_PS.psychosocial.label}
                code={FOUR_PS.psychosocial.code}
                description={FOUR_PS.psychosocial.description}
                value={psychosocial}
                onChange={setPsychosocial}
              />
              
              <ScoreSlider
                label={FOUR_PS.professional.label}
                code={FOUR_PS.professional.code}
                description={FOUR_PS.professional.description}
                value={professional}
                onChange={setProfessional}
              />

              <div 
                className="space-y-3 p-4 border border-teal-300 rounded-lg"
                style={{ backgroundColor: '#4fb9af' }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-white font-medium">Pain Level</span>
                    <p className="text-white/80 text-sm mt-1">How would you rate your pain today?</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">{painLevel}</span>
                    <p className="text-xs text-white/80">
                      {painLevel === 1 ? "Extreme Pain" : 
                       painLevel === 2 ? "Severe Pain" : 
                       painLevel === 3 ? "Moderate Pain" : 
                       painLevel === 4 ? "Mild Pain" : "No Pain"}
                    </p>
                  </div>
                </div>
                <Slider
                  value={[painLevel]}
                  onValueChange={(v) => setPainLevel(v[0])}
                  min={1}
                  max={5}
                  step={1}
                />
                <div className="flex justify-between text-xs text-white/70">
                  <span>1 - Extreme Pain</span>
                  <span>5 - No Pain</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything else you'd like to share about how you're feeling today?"
                  className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
                  rows={3}
                />
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/20">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < 3 ? (
              <Button
                onClick={() => {
                  if (currentStep === 1 && canProceedStep1()) {
                    setCurrentStep(2);
                  } else if (currentStep === 2 && canProceedStep2()) {
                    setCurrentStep(3);
                  }
                }}
                disabled={
                  (currentStep === 1 && !canProceedStep1()) ||
                  (currentStep === 2 && !canProceedStep2())
                }
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Check-in
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
