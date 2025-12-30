import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Info, Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type MedicationEntry } from "@/components/IntakeMedicationRecord";

interface IntakePreInjuryMedicationsProps {
  medications: MedicationEntry[];
  onChange: (medications: MedicationEntry[]) => void;
}

export function IntakePreInjuryMedications({
  medications,
  onChange,
}: IntakePreInjuryMedicationsProps) {
  const addMedication = () => {
    onChange([...medications, { 
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

  const removeMedication = (index: number) => {
    onChange(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof MedicationEntry, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm mb-1">Pre-Injury Medications</h4>
            <p className="text-sm text-muted-foreground">
              List medications you were taking before the incident occurred.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {medications.map((med, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3 bg-card relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => removeMedication(index)}
              >
                <X className="w-4 h-4" />
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`pre-med-brand-${index}`}>Brand Name*</Label>
                  <Input
                    id={`pre-med-brand-${index}`}
                    value={med.brandName}
                    onChange={(e) => updateMedication(index, 'brandName', e.target.value)}
                    placeholder="e.g., Zestril"
                  />
                </div>
                <div>
                  <Label htmlFor={`pre-med-generic-${index}`}>Generic Name</Label>
                  <Input
                    id={`pre-med-generic-${index}`}
                    value={med.genericName}
                    onChange={(e) => updateMedication(index, 'genericName', e.target.value)}
                    placeholder="e.g., Lisinopril"
                  />
                </div>
                <div>
                  <Label htmlFor={`pre-med-prescriber-${index}`}>Prescribing Physician*</Label>
                  <Input
                    id={`pre-med-prescriber-${index}`}
                    value={med.prescriber}
                    onChange={(e) => updateMedication(index, 'prescriber', e.target.value)}
                    placeholder="e.g., Dr. Smith"
                  />
                </div>
                <div>
                  <Label htmlFor={`pre-med-purpose-${index}`}>Purpose/Diagnosis*</Label>
                  <Select
                    value={med.purpose}
                    onValueChange={(value) => updateMedication(index, 'purpose', value)}
                  >
                    <SelectTrigger id={`pre-med-purpose-${index}`}>
                      <SelectValue placeholder="Select diagnosis" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="back_pain">Back Pain</SelectItem>
                      <SelectItem value="neck_pain">Neck Pain</SelectItem>
                      <SelectItem value="headache">Headache/Migraine</SelectItem>
                      <SelectItem value="anxiety">Anxiety</SelectItem>
                      <SelectItem value="depression">Depression</SelectItem>
                      <SelectItem value="ptsd">PTSD</SelectItem>
                      <SelectItem value="sleep_disorder">Sleep Disorder</SelectItem>
                      <SelectItem value="muscle_spasm">Muscle Spasm</SelectItem>
                      <SelectItem value="nerve_pain">Nerve Pain</SelectItem>
                      <SelectItem value="inflammation">Inflammation</SelectItem>
                      <SelectItem value="infection">Infection</SelectItem>
                      <SelectItem value="hypertension">Hypertension</SelectItem>
                      <SelectItem value="diabetes">Diabetes</SelectItem>
                      <SelectItem value="cardiac">Cardiac Condition</SelectItem>
                      <SelectItem value="respiratory">Respiratory Condition</SelectItem>
                      <SelectItem value="gastrointestinal">Gastrointestinal</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`pre-med-dose-${index}`}>Dosage*</Label>
                  <Input
                    id={`pre-med-dose-${index}`}
                    value={med.dose}
                    onChange={(e) => updateMedication(index, 'dose', e.target.value)}
                    placeholder="e.g., 10mg"
                  />
                </div>
                <div>
                  <Label htmlFor={`pre-med-frequency-${index}`}>Frequency*</Label>
                  <Select
                    value={med.frequency}
                    onValueChange={(value) => updateMedication(index, 'frequency', value)}
                  >
                    <SelectTrigger id={`pre-med-frequency-${index}`}>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="once_daily">Once daily</SelectItem>
                      <SelectItem value="twice_daily">Twice daily</SelectItem>
                      <SelectItem value="three_times_daily">Three times daily</SelectItem>
                      <SelectItem value="four_times_daily">Four times daily</SelectItem>
                      <SelectItem value="every_4_hours">Every 4 hours</SelectItem>
                      <SelectItem value="every_6_hours">Every 6 hours</SelectItem>
                      <SelectItem value="every_8_hours">Every 8 hours</SelectItem>
                      <SelectItem value="every_12_hours">Every 12 hours</SelectItem>
                      <SelectItem value="as_needed">As needed (PRN)</SelectItem>
                      <SelectItem value="bedtime">At bedtime</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`pre-med-route-${index}`}>Route*</Label>
                  <Select
                    value={med.route}
                    onValueChange={(value) => updateMedication(index, 'route', value)}
                  >
                    <SelectTrigger id={`pre-med-route-${index}`}>
                      <SelectValue placeholder="Select route" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="oral">Oral</SelectItem>
                      <SelectItem value="topical">Topical</SelectItem>
                      <SelectItem value="injectable_im">Injectable (IM)</SelectItem>
                      <SelectItem value="injectable_iv">Injectable (IV)</SelectItem>
                      <SelectItem value="injectable_subq">Injectable (SubQ)</SelectItem>
                      <SelectItem value="sublingual">Sublingual</SelectItem>
                      <SelectItem value="transdermal">Transdermal (Patch)</SelectItem>
                      <SelectItem value="inhalation">Inhalation</SelectItem>
                      <SelectItem value="rectal">Rectal</SelectItem>
                      <SelectItem value="ophthalmic">Ophthalmic (Eye)</SelectItem>
                      <SelectItem value="otic">Otic (Ear)</SelectItem>
                      <SelectItem value="nasal">Nasal</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`pre-med-start-${index}`}>Start Date*</Label>
                  <Input
                    id={`pre-med-start-${index}`}
                    type="date"
                    value={med.startDate}
                    onChange={(e) => updateMedication(index, 'startDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`pre-med-end-${index}`}>End Date</Label>
                  <Input
                    id={`pre-med-end-${index}`}
                    type="date"
                    value={med.endDate}
                    onChange={(e) => updateMedication(index, 'endDate', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor={`pre-med-pharmacy-${index}`}>Pharmacy Used*</Label>
                  <Input
                    id={`pre-med-pharmacy-${index}`}
                    value={med.pharmacy}
                    onChange={(e) => updateMedication(index, 'pharmacy', e.target.value)}
                    placeholder="e.g., CVS Pharmacy - Main St"
                  />
                </div>
              </div>
            </div>
          ))}

          {medications.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No pre-injury medications added yet.
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={addMedication}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Pre-Injury Medication
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
