import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Info } from "lucide-react";

interface IntakePhysicalPostDiagnosisSelectorProps {
  selectedDiagnoses: string[];
  additionalNotes: string;
  onDiagnosesChange: (diagnoses: string[]) => void;
  onNotesChange: (notes: string) => void;
}

const PHYSICAL_POST_DIAGNOSES = [
  "Concussion / Head Injury",
  "Traumatic Brain Injury (Mild–Moderate)",
  "Whiplash / Soft-Tissue Injury",
  "Back Pain / Lumbar Strain",
  "Neck Pain / Cervical Strain",
  "Shoulder Injury / Rotator Cuff Tear",
  "Knee Injury / Ligament or Meniscus Tear",
  "Fracture / Broken Bone",
  "Spinal Disc Herniation or Bulge",
  "Sciatica / Nerve Pain",
  "Crush Injury",
  "Amputation",
  "Post-Surgical Recovery",
  "Balance or Gait Impairment",
  "Internal Injury / Organ Damage",
  "Chronic Pain Flare / New Persistent Pain",
  "Nerve Injury / Neuropraxia",
  "Wound or Soft-Tissue Complication",
];

export function IntakePhysicalPostDiagnosisSelector({
  selectedDiagnoses,
  additionalNotes,
  onDiagnosesChange,
  onNotesChange,
}: IntakePhysicalPostDiagnosisSelectorProps) {
  const toggleDiagnosis = (diagnosis: string) => {
    if (selectedDiagnoses.includes(diagnosis)) {
      onDiagnosesChange(selectedDiagnoses.filter(d => d !== diagnosis));
    } else {
      onDiagnosesChange([...selectedDiagnoses, diagnosis]);
    }
  };

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm mb-1">Post-Accident / Injury Conditions</h4>
            <p className="text-sm text-muted-foreground">
              Select all physical injuries or conditions that resulted from this incident.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {PHYSICAL_POST_DIAGNOSES.map((option) => (
            <div key={option} className="flex items-start space-x-3 p-2 hover:bg-accent/50 rounded-md transition-colors">
              <Checkbox
                id={option}
                checked={selectedDiagnoses.includes(option)}
                onCheckedChange={() => toggleDiagnosis(option)}
                className="mt-0.5"
              />
              <Label
                htmlFor={option}
                className="text-sm font-normal cursor-pointer leading-snug flex-1"
              >
                {option}
              </Label>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="physical-additional-conditions" className="font-semibold">
              Additional Physical Conditions or Notes
            </Label>
            <span className="text-xs text-muted-foreground">
              {additionalNotes.length} / 1000
            </span>
          </div>
          <Textarea
            id="physical-additional-conditions"
            value={additionalNotes}
            onChange={(e) => {
              if (e.target.value.length <= 1000) {
                onNotesChange(e.target.value);
              }
            }}
            placeholder="Please describe any additional physical conditions, diagnoses, or relevant health information not listed above..."
            rows={4}
            className="resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
