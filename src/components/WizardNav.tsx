import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface WizardNavProps {
  step: number;
  setStep: (step: number) => void;
  last: number;
}

export function WizardNav({ step, setStep, last }: WizardNavProps) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <Button
        variant="outline"
        onClick={() => setStep(Math.max(0, step - 1))}
        disabled={step === 0}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Step {step + 1} of {last + 1}
      </span>
      <Button
        onClick={() => setStep(Math.min(last, step + 1))}
        disabled={step === last}
      >
        Next
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
