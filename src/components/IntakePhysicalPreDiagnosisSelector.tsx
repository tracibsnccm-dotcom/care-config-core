import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Info } from "lucide-react";

interface IntakePhysicalPreDiagnosisSelectorProps {
  selectedDiagnoses: string[];
  onDiagnosesChange: (diagnoses: string[]) => void;
}

const PHYSICAL_PRE_DIAGNOSES = [
  "Hypertension (High Blood Pressure)",
  "Congestive Heart Failure (CHF)",
  "Diabetes (Type 1 or Type 2)",
  "High Cholesterol / Hyperlipidemia",
  "Heart Disease / Coronary Artery Disease",
  "Asthma or COPD",
  "Thyroid Disorder",
  "Kidney Disease",
  "Liver Disease",
  "Cancer (Active or in Remission)",
  "Obesity",
  "Autoimmune Disease (e.g., Lupus, RA, MS)",
  "Seizure Disorder / Epilepsy",
  "Chronic Migraine or Headache Disorder",
  "Neuropathy / Radiculopathy",
  "Fibromyalgia",
  "Chronic Pain Syndrome",
  "Gastrointestinal Disorder (e.g., GERD, IBS)",
  "Chronic Fatigue Syndrome",
  "Pregnancy — First Trimester",
  "Pregnancy — Second Trimester",
  "Pregnancy — Third Trimester",
];

export function IntakePhysicalPreDiagnosisSelector({
  selectedDiagnoses,
  onDiagnosesChange,
}: IntakePhysicalPreDiagnosisSelectorProps) {
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
            <h4 className="font-semibold text-sm mb-1">Chronic / Pre-Accident Conditions</h4>
            <p className="text-sm text-muted-foreground">
              Select all chronic or pre-existing physical conditions that you had before the incident.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PHYSICAL_PRE_DIAGNOSES.map((option) => (
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
      </CardContent>
    </Card>
  );
}
