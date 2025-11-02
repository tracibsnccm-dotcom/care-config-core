import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Info, Plus, X } from "lucide-react";

export interface MedicationEntry {
  id: string;
  name: string;
  dose: string;
  purpose: string;
  prescriber: string;
  startDate: string;
  notes: string;
}

interface IntakePreInjuryMedicationsProps {
  medications: MedicationEntry[];
  onChange: (medications: MedicationEntry[]) => void;
}

export function IntakePreInjuryMedications({
  medications,
  onChange,
}: IntakePreInjuryMedicationsProps) {
  const addMedication = () => {
    onChange([...medications, { id: crypto.randomUUID(), name: '', dose: '', purpose: '', prescriber: '', startDate: '', notes: '' }]);
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
                  <Label htmlFor={`pre-med-name-${index}`}>Medication Name*</Label>
                  <Input
                    id={`pre-med-name-${index}`}
                    value={med.name}
                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                    placeholder="e.g., Lisinopril"
                  />
                </div>
                <div>
                  <Label htmlFor={`pre-med-dose-${index}`}>Dose/Strength</Label>
                  <Input
                    id={`pre-med-dose-${index}`}
                    value={med.dose}
                    onChange={(e) => updateMedication(index, 'dose', e.target.value)}
                    placeholder="e.g., 10mg"
                  />
                </div>
                <div>
                  <Label htmlFor={`pre-med-purpose-${index}`}>Purpose/Condition</Label>
                  <Input
                    id={`pre-med-purpose-${index}`}
                    value={med.purpose}
                    onChange={(e) => updateMedication(index, 'purpose', e.target.value)}
                    placeholder="e.g., High blood pressure"
                  />
                </div>
                <div>
                  <Label htmlFor={`pre-med-prescriber-${index}`}>Prescriber</Label>
                  <Input
                    id={`pre-med-prescriber-${index}`}
                    value={med.prescriber}
                    onChange={(e) => updateMedication(index, 'prescriber', e.target.value)}
                    placeholder="e.g., Dr. Smith"
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
