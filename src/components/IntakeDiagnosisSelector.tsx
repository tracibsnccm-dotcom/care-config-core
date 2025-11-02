import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Info } from "lucide-react";
import { useState } from "react";

interface DiagnosisGroup {
  title: string;
  options: string[];
}

interface IntakeDiagnosisSelectorProps {
  selectedDiagnoses: string[];
  additionalNotes: string;
  onDiagnosesChange: (diagnoses: string[]) => void;
  onNotesChange: (notes: string) => void;
}

const DIAGNOSIS_GROUPS: DiagnosisGroup[] = [
  {
    title: "Physical — Chronic / Pre-Accident",
    options: [
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
    ]
  },
  {
    title: "Physical — Post-Accident / Injury",
    options: [
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
    ]
  },
  {
    title: "Behavioral Health — Chronic / Pre-Accident",
    options: [
      "Anxiety",
      "Depression",
      "Bipolar Disorder",
      "Obsessive-Compulsive Disorder (OCD)",
      "Panic Disorder",
      "Sleep Disturbance / Insomnia",
      "Attention, Memory, or Concentration Difficulties",
      "PTSD (prior to this incident)",
      "Eating Disorder / Disordered Eating",
      "Alcohol Use Disorder",
      "Prescription Misuse / Dependency",
      "Substance Use Disorder (Other)",
      "Grief or Loss Reaction (ongoing)",
      "Stress/Burnout (ongoing)",
      "Chronic Pain–Related Emotional Distress",
    ]
  },
  {
    title: "Behavioral Health — Post-Accident / New or Worsened",
    options: [
      "Acute Stress Reaction / Adjustment Disorder",
      "Anxiety (new or worsened)",
      "Depression (new or worsened)",
      "PTSD related to this incident",
      "Panic Attacks",
      "Sleep Disturbance / Insomnia (new or worsened)",
      "Memory or Concentration Difficulties (post-injury)",
      "Irritability / Anger Outbursts",
      "Emotional Numbing or Avoidance",
      "Social Withdrawal / Isolation",
      "Fear of Returning to Work / Activities",
      "Sexual Assault Trauma / Survivor Support",
      "Substance Use Increase (Alcohol or Drugs)",
      "Low Motivation / Fatigue (post-injury)",
      "Traumatic Stress–Related Cognitive Changes",
    ]
  }
];

export function IntakeDiagnosisSelector({
  selectedDiagnoses,
  additionalNotes,
  onDiagnosesChange,
  onNotesChange,
}: IntakeDiagnosisSelectorProps) {
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
            <h4 className="font-semibold text-sm mb-1">Medical History & Diagnoses</h4>
            <p className="text-sm text-muted-foreground">
              Select all conditions that apply to you. This helps your RN Care Manager understand your complete health picture and create the most effective care plan.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {DIAGNOSIS_GROUPS.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h4 className="font-semibold text-base mb-4 text-foreground border-b pb-2">
                {group.title}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.options.map((option) => (
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
            </div>
          ))}

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="additional-conditions" className="font-semibold">
                Additional Conditions or Notes
              </Label>
              <span className="text-xs text-muted-foreground">
                {additionalNotes.length} / 1000
              </span>
            </div>
            <Textarea
              id="additional-conditions"
              value={additionalNotes}
              onChange={(e) => {
                if (e.target.value.length <= 1000) {
                  onNotesChange(e.target.value);
                }
              }}
              placeholder="Please describe any additional medical conditions, diagnoses, or relevant health information not listed above..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground italic">
              Use this space to provide context or details about conditions selected above, or to note any other health concerns.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
