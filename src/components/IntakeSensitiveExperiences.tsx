import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Info, AlertCircle, ChevronDown, CheckCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { analyzeSensitiveExperiences, getClientFacingMessage } from "@/lib/sensitiveExperiencesFlags";

interface SensitiveExperiencesData {
  substanceUseOptions: string[];
  safetyTraumaOptions: string[];
  stressorsOptions: string[];
  consentToShare: boolean | null;
  additionalDetails?: string;
  sectionSkipped?: boolean;
}

interface IntakeSensitiveExperiencesProps {
  data: SensitiveExperiencesData;
  onChange: (data: SensitiveExperiencesData) => void;
}

const substanceUseOptions = [
  "Current alcohol use that concerns you",
  "Past alcohol use that required treatment or caused problems",
  "Current prescription medication misuse or dependency",
  "Past prescription medication misuse or dependency",
  "Current use of non-prescribed or illicit substances",
  "Past use of non-prescribed or illicit substances",
  "Currently in recovery or enrolled in a treatment program",
  "Prior participation in a detox, rehab, or support group",
  "None of the above / prefer not to answer",
  "Not Applicable / N/A",
];

const safetyTraumaOptions = [
  "History of domestic violence or intimate-partner violence",
  "History of physical abuse (childhood or adulthood)",
  "History of emotional or psychological abuse",
  "History of sexual abuse or assault",
  "Current safety concerns at home or in a relationship",
  "Stalking or harassment experience",
  "History of bullying or workplace harassment",
  "Experience of trafficking or exploitation",
  "Witnessed violence (home, community, or workplace)",
  "None of the above / prefer not to answer",
  "Not Applicable / N/A",
];

const stressorsOptions = [
  "Housing instability or homelessness risk",
  "Food insecurity",
  "Financial hardship or loss of income",
  "Recent major loss or grief (family, job, relationship)",
  "Legal issues unrelated to current injury",
  "Caregiver stress (caring for others while managing your own condition)",
  "Workplace or school harassment or discrimination",
  "Limited family or social support",
  "Cultural or language barriers affecting care access",
  "Transportation barriers to appointments",
  "None of the above / prefer not to answer",
  "Not Applicable / N/A",
];

export function IntakeSensitiveExperiences({ data, onChange }: IntakeSensitiveExperiencesProps) {
  const [substanceOpen, setSubstanceOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [stressorsOpen, setStressorsOpen] = useState(false);
  const [clientMessage, setClientMessage] = useState<string>('');

  // Analyze selections and show client-facing message when appropriate
  useEffect(() => {
    const flags = analyzeSensitiveExperiences(data);
    const message = getClientFacingMessage(flags);
    setClientMessage(message);
  }, [data]);

  const toggleOption = (field: 'substanceUseOptions' | 'safetyTraumaOptions' | 'stressorsOptions', option: string) => {
    const current = data[field] || [];
    const noneOption = "None of the above / prefer not to answer";
    const naOption = "Not Applicable / N/A";
    
    if (option === noneOption || option === naOption) {
      // If selecting "None" or "N/A", clear all other options
      onChange({ ...data, [field]: [option] });
    } else {
      // If selecting any other option, remove "None" and "N/A" if they exist
      const filtered = current.filter(o => o !== noneOption && o !== naOption);
      
      if (current.includes(option)) {
        onChange({ ...data, [field]: filtered.filter(o => o !== option) });
      } else {
        onChange({ ...data, [field]: [...filtered, option] });
      }
    }
  };

  const handleSkipSection = () => {
    onChange({ 
      ...data, 
      sectionSkipped: true,
      substanceUseOptions: [],
      safetyTraumaOptions: [],
      stressorsOptions: [],
      additionalDetails: '',
      consentToShare: null
    });
  };

  const shouldShowAdditionalDetails = () => {
    const allOptions = [
      ...(data.substanceUseOptions || []),
      ...(data.safetyTraumaOptions || []),
      ...(data.stressorsOptions || [])
    ];
    return allOptions.some(option => 
      option === "None of the above / prefer not to answer" || 
      option === "Not Applicable / N/A"
    );
  };

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
        <p className="text-sm text-muted-foreground mt-2">
          If you prefer not to complete this section, click "Skip Section" below.
        </p>
        <p className="text-sm text-muted-foreground">
          For each question, you may also select "Not Applicable / N/A" if it doesn't apply to you.
        </p>
      </div>

      {/* Skip Section Button */}
      <div className="mb-6 flex justify-end">
        <Button 
          variant="outline" 
          onClick={handleSkipSection}
          className="text-muted-foreground border-muted-foreground/30 hover:bg-muted/50"
        >
          Skip Section
        </Button>
      </div>

      {/* Dropdown Sections */}
      <div className="space-y-6 mb-8">
        {/* 1. Substance Use & Addiction History */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            🧩 Substance Use / Dependency
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            Please indicate if any of the following apply to you. This information helps us connect you with appropriate care and support.
          </p>
          
          <Popover open={substanceOpen} onOpenChange={setSubstanceOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between h-auto min-h-[40px] text-left font-normal"
              >
                <span className="truncate">
                  {data.substanceUseOptions?.length > 0
                    ? `${data.substanceUseOptions.length} selected`
                    : "Select options..."}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-0 max-h-[400px] overflow-y-auto bg-background z-50" align="start">
              <div className="p-4 space-y-2">
                {substanceUseOptions.map((option) => (
                  <div key={option} className="flex items-start space-x-2 py-2">
                    <Checkbox
                      id={`substance-${option}`}
                      checked={data.substanceUseOptions?.includes(option)}
                      onCheckedChange={() => toggleOption('substanceUseOptions', option)}
                    />
                    <Label
                      htmlFor={`substance-${option}`}
                      className="cursor-pointer font-normal leading-snug text-sm"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          {data.substanceUseOptions?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.substanceUseOptions.map((option) => (
                <div key={option} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Abuse, Violence, or Trauma Exposure */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            💔 Safety & Trauma History
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            These questions help us identify when additional support or protection may be needed. You may skip any question you're not comfortable answering.
          </p>
          
          <Popover open={safetyOpen} onOpenChange={setSafetyOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between h-auto min-h-[40px] text-left font-normal"
              >
                <span className="truncate">
                  {data.safetyTraumaOptions?.length > 0
                    ? `${data.safetyTraumaOptions.length} selected`
                    : "Select options..."}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-0 max-h-[400px] overflow-y-auto bg-background z-50" align="start">
              <div className="p-4 space-y-2">
                {safetyTraumaOptions.map((option) => (
                  <div key={option} className="flex items-start space-x-2 py-2">
                    <Checkbox
                      id={`safety-${option}`}
                      checked={data.safetyTraumaOptions?.includes(option)}
                      onCheckedChange={() => toggleOption('safetyTraumaOptions', option)}
                    />
                    <Label
                      htmlFor={`safety-${option}`}
                      className="cursor-pointer font-normal leading-snug text-sm"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          {data.safetyTraumaOptions?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.safetyTraumaOptions.map((option) => (
                <div key={option} className="bg-destructive/10 text-destructive px-3 py-1 rounded-full text-xs">
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Psychological or Environmental Stressors */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            🧠 Current Stressors or Barriers
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            These items identify areas that may affect your healing, safety, or stability.
          </p>
          
          <Popover open={stressorsOpen} onOpenChange={setStressorsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between h-auto min-h-[40px] text-left font-normal"
              >
                <span className="truncate">
                  {data.stressorsOptions?.length > 0
                    ? `${data.stressorsOptions.length} selected`
                    : "Select options..."}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-0 max-h-[400px] overflow-y-auto bg-background z-50" align="start">
              <div className="p-4 space-y-2">
                {stressorsOptions.map((option) => (
                  <div key={option} className="flex items-start space-x-2 py-2">
                    <Checkbox
                      id={`stressors-${option}`}
                      checked={data.stressorsOptions?.includes(option)}
                      onCheckedChange={() => toggleOption('stressorsOptions', option)}
                    />
                    <Label
                      htmlFor={`stressors-${option}`}
                      className="cursor-pointer font-normal leading-snug text-sm"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          {data.stressorsOptions?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.stressorsOptions.map((option) => (
                <div key={option} className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs">
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Client-Facing Reassurance Message */}
      {clientMessage && (
        <Alert className="mb-6 bg-primary/10 border-primary/30">
          <CheckCircle className="h-5 w-5 text-primary" />
          <AlertDescription className="text-sm">
            {clientMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Optional Additional Details */}
      {shouldShowAdditionalDetails() && (
        <div className="space-y-3 mb-6">
          <Label htmlFor="additional-details" className="text-sm font-medium text-foreground">
            Optional: If you experienced something not listed above or want to provide more details, please describe it here.
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            (You may leave this blank if you prefer.)
          </p>
          <Textarea
            id="additional-details"
            value={data.additionalDetails || ''}
            onChange={(e) => onChange({ ...data, additionalDetails: e.target.value })}
            placeholder="Enter additional details here..."
            maxLength={250}
            className="min-h-[100px] resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {(data.additionalDetails || '').length}/250 characters
          </p>
        </div>
      )}

      {/* Consent Section - Only show if sensitive items are selected */}
      {(() => {
        const hasSensitiveItems = [
          ...(data.substanceUseOptions || []),
          ...(data.safetyTraumaOptions || []),
          ...(data.stressorsOptions || [])
        ].some(option => option !== "None of the above / prefer not to answer");
        
        return hasSensitiveItems ? (
          <div className="border-t pt-6 space-y-4">
            <h4 className="font-semibold text-foreground mb-4">
              Consent for Sharing Sensitive Information
            </h4>
            
            <Alert className="bg-muted/30 border-border">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Please select how you'd like us to handle this information.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 mt-4">
          <div className="flex items-start space-x-3 p-4 bg-card rounded-lg border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <Checkbox
              id="consent-share"
              checked={data.consentToShare === true}
              onCheckedChange={(checked) => onChange({ ...data, consentToShare: checked === true })}
            />
            <Label htmlFor="consent-share" className="cursor-pointer font-normal leading-relaxed">
              ✅ <strong>I consent</strong> for this information to be shared with my attorney and/or treating provider for care coordination and advocacy purposes.
            </Label>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-card rounded-lg border-2 border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors">
            <Checkbox
              id="consent-no-share"
              checked={data.consentToShare === false}
              onCheckedChange={(checked) => onChange({ ...data, consentToShare: checked ? false : null })}
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
        ) : null;
      })()}
    </Card>
  );
}

export type { SensitiveExperiencesData };
