import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Info, AlertCircle } from "lucide-react";

interface SensitiveExperiencesData {
  substanceUse: string;
  alcoholDependency: string;
  domesticAbuse: string;
  childAbuse: string;
  harassment: string;
  stalking: string;
  otherTrauma: string;
  consentToShare: boolean | null;
}

interface IntakeSensitiveExperiencesProps {
  data: SensitiveExperiencesData;
  onChange: (data: SensitiveExperiencesData) => void;
}

export function IntakeSensitiveExperiences({ data, onChange }: IntakeSensitiveExperiencesProps) {
  const handleFieldChange = (field: keyof SensitiveExperiencesData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  const questions = [
    { key: 'substanceUse', label: 'Have you experienced substance use concerns?' },
    { key: 'alcoholDependency', label: 'Have you experienced alcohol dependency?' },
    { key: 'domesticAbuse', label: 'Have you experienced domestic abuse?' },
    { key: 'childAbuse', label: 'Have you experienced child abuse?' },
    { key: 'harassment', label: 'Have you experienced harassment?' },
    { key: 'stalking', label: 'Have you experienced stalking?' },
    { key: 'otherTrauma', label: 'Have you experienced other forms of trauma?' },
  ];

  return (
    <Card className="p-6 border-border">
      {/* Header Section */}
      <div className="flex items-start gap-3 mb-6">
        <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Sensitive or Personal Experiences
          </h3>
        </div>
      </div>

      {/* Explanatory Banner */}
      <Alert className="mb-6 bg-primary/5 border-primary/20">
        <Info className="h-5 w-5 text-primary" />
        <AlertDescription className="text-sm space-y-3">
          <p>
            Some clients may have life experiences or conditions they find difficult to discuss — such as <strong>substance use, alcohol dependency, domestic or child abuse, harassment, stalking, or other forms of trauma.</strong>
          </p>
          <p>
            We ask these questions only to help ensure your safety and connect you with the right support and services.
          </p>
        </AlertDescription>
      </Alert>

      {/* Voluntary Notice */}
      <div className="bg-accent/30 border border-accent rounded-lg p-4 mb-6 space-y-2">
        <p className="text-sm font-medium text-foreground">
          <strong>Sharing this information is completely voluntary.</strong> You may skip any question that makes you uncomfortable.
        </p>
        <p className="text-sm text-muted-foreground">
          Your answers are confidential and will not be shared with anyone outside the Reconcile C.A.R.E. team without your permission.
        </p>
      </div>

      {/* Questions Section */}
      <div className="space-y-6 mb-8">
        {questions.map(({ key, label }) => (
          <div key={key} className="space-y-3">
            <Label className="text-sm font-medium">{label}</Label>
            <RadioGroup
              value={(data as any)[key] || ''}
              onValueChange={(v) => handleFieldChange(key as keyof SensitiveExperiencesData, v)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id={`${key}-yes`} />
                <Label htmlFor={`${key}-yes`} className="cursor-pointer font-normal">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id={`${key}-no`} />
                <Label htmlFor={`${key}-no`} className="cursor-pointer font-normal">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="prefer_not_to_say" id={`${key}-skip`} />
                <Label htmlFor={`${key}-skip`} className="cursor-pointer font-normal">Prefer not to say</Label>
              </div>
            </RadioGroup>
          </div>
        ))}
      </div>

      {/* Consent Section */}
      <div className="border-t pt-6 space-y-4">
        <h4 className="font-semibold text-foreground mb-4">
          Consent for Sharing Sensitive Information
        </h4>
        
        <Alert className="bg-muted/30 border-border">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            At the end of this section, you'll be able to choose how this information is shared.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 mt-4">
          <div className="flex items-start space-x-3 p-4 bg-card rounded-lg border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <Checkbox
              id="consent-share"
              checked={data.consentToShare === true}
              onCheckedChange={(checked) => handleFieldChange('consentToShare', checked === true)}
            />
            <Label htmlFor="consent-share" className="cursor-pointer font-normal leading-relaxed">
              ✅ <strong>I consent</strong> for this information to be shared with my attorney and/or treating provider for care coordination and advocacy purposes.
            </Label>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-card rounded-lg border-2 border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors">
            <Checkbox
              id="consent-no-share"
              checked={data.consentToShare === false}
              onCheckedChange={(checked) => handleFieldChange('consentToShare', checked ? false : null)}
            />
            <Label htmlFor="consent-no-share" className="cursor-pointer font-normal leading-relaxed">
              🚫 <strong>I do not consent</strong> — keep this information confidential within Reconcile C.A.R.E. only.
            </Label>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4 italic">
          If you change your mind later, you may update your consent at any time through your Client Portal or by contacting your RN Care Manager.
        </p>
      </div>
    </Card>
  );
}

export type { SensitiveExperiencesData };
