import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, Heart, AlertCircle, Lock, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { 
  saveSensitiveDisclosure, 
  discardSensitiveSection, 
  normalizeItemCode,
  loadSensitiveDisclosures,
  updateAllConsent,
  type ConsentChoice 
} from "@/lib/sensitiveDisclosuresHelper";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export interface SensitiveExperiencesData {
  substanceUse: string[];
  safetyTrauma: string[];
  stressors: string[];
  consentAttorney: ConsentChoice;
  consentProvider: ConsentChoice;
  additionalDetails?: string;
  sectionSkipped?: boolean;
  sectionCollapsed?: boolean;
}

interface IntakeSensitiveExperiencesProps {
  data: SensitiveExperiencesData;
  onChange: (data: SensitiveExperiencesData) => void;
  caseId?: string; // Required for persistence
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

export function IntakeSensitiveExperiences({ data, onChange, caseId }: IntakeSensitiveExperiencesProps) {
  const [substanceOpen, setSubstanceOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [stressorsOpen, setStressorsOpen] = useState(false);
  const [clientMessage, setClientMessage] = useState<string>("");
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Check if any items are selected
  const hasSelections = 
    data.substanceUse.length > 0 || 
    data.safetyTrauma.length > 0 || 
    data.stressors.length > 0;
  
  // Check if consent is needed
  const needsConsent = hasSelections && 
    !data.substanceUse.includes("None of the above / prefer not to answer") &&
    !data.substanceUse.includes("Not Applicable / N/A") &&
    !data.safetyTrauma.includes("None of the above / prefer not to answer") &&
    !data.safetyTrauma.includes("Not Applicable / N/A") &&
    !data.stressors.includes("None of the above / prefer not to answer") &&
    !data.stressors.includes("Not Applicable / N/A");
  
  // Load existing data on mount
  useEffect(() => {
    if (!caseId || hasLoadedData) return;
    
    async function loadData() {
      setIsLoading(true);
      try {
        const disclosures = await loadSensitiveDisclosures(caseId);
        
        if (disclosures.length > 0) {
          // Group by category
          const substance = disclosures
            .filter(d => d.category === 'substance_use')
            .map(d => d.item_code);
          const safety = disclosures
            .filter(d => d.category === 'safety_trauma')
            .map(d => d.item_code);
          const stress = disclosures
            .filter(d => d.category === 'stressors')
            .map(d => d.item_code);
          
          // Get consent from first record (should be same for all)
          const consent = disclosures[0];
          
          onChange({
            ...data,
            substanceUse: substance,
            safetyTrauma: safety,
            stressors: stress,
            consentAttorney: (consent.consent_attorney || 'unset') as ConsentChoice,
            consentProvider: (consent.consent_provider || 'unset') as ConsentChoice,
          });
        }
        setHasLoadedData(true);
      } catch (error) {
        console.error('Error loading disclosures:', error);
        toast.error('Failed to load previous selections');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [caseId, hasLoadedData]);

  useEffect(() => {
    if (hasSelections) {
      setClientMessage("Thank you for sharing. Your RN Care Manager will review and follow up to ensure you have the right support.");
    } else {
      setClientMessage("");
    }
  }, [hasSelections]);

  const toggleOption = async (category: keyof Pick<SensitiveExperiencesData, 'substanceUse' | 'safetyTrauma' | 'stressors'>, option: string) => {
    const current = data[category] || [];
    const noneOption = "None of the above / prefer not to answer";
    const naOption = "Not Applicable / N/A";
    
    let newSelections: string[];
    
    if (option === noneOption || option === naOption) {
      // If selecting "None" or "N/A", clear all other options
      newSelections = [option];
    } else {
      // If selecting any other option, remove "None" and "N/A" if they exist
      const filtered = current.filter(o => o !== noneOption && o !== naOption);
      
      if (current.includes(option)) {
        newSelections = filtered.filter(o => o !== option);
      } else {
        newSelections = [...filtered, option];
      }
    }
    
    onChange({
      ...data,
      [category]: newSelections,
    });
    
    // Persist to database if caseId is available
    if (caseId && option) {
      setIsSaving(true);
      setSaveError(null);
      try {
        const categoryMap = {
          substanceUse: 'substance_use',
          safetyTrauma: 'safety_trauma',
          stressors: 'stressors'
        } as const;
        
        await saveSensitiveDisclosure({
          caseId,
          category: categoryMap[category],
          itemCode: normalizeItemCode(option),
          selected: newSelections.includes(option),
          consentAttorney: data.consentAttorney,
          consentProvider: data.consentProvider
        });
        
        // Show saved indicator briefly
        setShowSavedIndicator(true);
        setTimeout(() => setShowSavedIndicator(false), 2000);
      } catch (error) {
        console.error('Error saving disclosure:', error);
        setSaveError('Failed to save selection');
        toast.error('Failed to save selection. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSkipSection = () => {
    setShowSkipDialog(true);
  };
  
  const confirmSkipSection = async () => {
    setIsSkipping(true);
    
    try {
      // Discard selections in database if caseId exists
      if (caseId) {
        await discardSensitiveSection(caseId);
      }
      
      // Clear local state
      onChange({
        substanceUse: [],
        safetyTrauma: [],
        stressors: [],
        consentAttorney: 'unset',
        consentProvider: 'unset',
        additionalDetails: '',
        sectionSkipped: true,
        sectionCollapsed: true
      });
      
      toast.success('Section skipped. You can resume later if needed.');
    } catch (error) {
      console.error('Error skipping section:', error);
      toast.error('Failed to skip section. Please try again.');
    } finally {
      setIsSkipping(false);
      setShowSkipDialog(false);
    }
  };
  
  const handleResumeSection = () => {
    onChange({
      ...data,
      sectionSkipped: false,
      sectionCollapsed: false
    });
  };
  
  const handleConsentChange = async (type: 'attorney' | 'provider', value: boolean) => {
    const consentValue: ConsentChoice = value ? 'share' : 'no_share';
    
    const updatedData = {
      ...data,
      ...(type === 'attorney' 
        ? { consentAttorney: consentValue }
        : { consentProvider: consentValue }
      )
    };
    
    onChange(updatedData);
    
    // Save immediately if both consents are set and we have a caseId
    if (caseId && updatedData.consentAttorney !== 'unset' && updatedData.consentProvider !== 'unset') {
      setIsSaving(true);
      try {
        await updateAllConsent(caseId, updatedData.consentAttorney, updatedData.consentProvider);
        setShowSavedIndicator(true);
        setTimeout(() => setShowSavedIndicator(false), 2000);
      } catch (error) {
        console.error('Error saving consent:', error);
        toast.error('Failed to save consent choices');
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  const retryLastSave = () => {
    setSaveError(null);
    toast.info('Please try your last action again');
  };

  const shouldShowAdditionalDetails = () => {
    const allOptions = [
      ...(data.substanceUse || []),
      ...(data.safetyTrauma || []),
      ...(data.stressors || [])
    ];
    return allOptions.some(option => 
      option === "None of the above / prefer not to answer" || 
      option === "Not Applicable / N/A" ||
      option === "Other"
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading previous selections...</p>
        </div>
      </Card>
    );
  }
  
  // If section is skipped and collapsed, show badge with resume option
  if (data.sectionSkipped && data.sectionCollapsed) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold text-muted-foreground">Sensitive or Personal Experiences</h3>
              <Badge variant="secondary" className="mt-1">Section Skipped</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleResumeSection}>
            Resume
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <>
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Sensitive or Personal Experiences (Optional)</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your responses are private. We only share with your permission.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Save indicators */}
          <div className="flex items-center gap-2">
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            {showSavedIndicator && !isSaving && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>Saved</span>
              </div>
            )}
            {saveError && !isSaving && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={retryLastSave}
                className="text-destructive hover:text-destructive"
              >
                Retry
              </Button>
            )}
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Why we ask these questions:</p>
            <p>
              These questions help us understand factors that may affect your health, recovery, and access to care. 
              Your answers help your RN Care Manager connect you with appropriate resources and support.
            </p>
            {!caseId && (
              <p className="text-xs mt-2 text-muted-foreground italic">
                Your selections will be saved when you submit your intake form.
              </p>
            )}
          </AlertDescription>
        </Alert>

        <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm">
            <strong>Sharing this information is completely voluntary.</strong> You may skip any question that makes you uncomfortable.
            Your answers are confidential and will not be shared with anyone outside the Reconcile C.A.R.E. team without your permission.
          </p>
          <p className="text-sm">
            If you prefer not to complete this section, click "Skip Section" below.
          </p>
          <p className="text-sm">
            For each question, you may also select "Not Applicable / N/A" if it doesn't apply to you.
          </p>
        </div>

        <Button 
          type="button" 
          variant="secondary" 
          onClick={handleSkipSection}
          className="w-full"
        >
          Skip Section
        </Button>

        {/* Substance Use */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">Substance Use / Dependency</Label>
            {data.substanceUse.length > 0 && (
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {data.substanceUse.length}
              </Badge>
            )}
          </div>
          <Popover open={substanceOpen} onOpenChange={setSubstanceOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-between",
                  data.substanceUse.length > 0 && "border-primary"
                )}
                type="button"
              >
                <span>
                  {data.substanceUse.length > 0
                    ? `${data.substanceUse.length} selected`
                    : 'Select options'}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-4 max-h-[400px] overflow-y-auto">
              <div className="space-y-2">
                {substanceUseOptions.map((option) => (
                  <div key={option} className="flex items-start space-x-2 py-2">
                    <Checkbox
                      id={`substance-${option}`}
                      checked={data.substanceUse?.includes(option)}
                      onCheckedChange={() => toggleOption('substanceUse', option)}
                    />
                    <Label
                      htmlFor={`substance-${option}`}
                      className="cursor-pointer font-normal text-sm"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Safety & Trauma */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">Safety & Trauma History</Label>
            {data.safetyTrauma.length > 0 && (
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {data.safetyTrauma.length}
              </Badge>
            )}
          </div>
          <Popover open={safetyOpen} onOpenChange={setSafetyOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-between",
                  data.safetyTrauma.length > 0 && "border-primary"
                )}
                type="button"
              >
                <span>
                  {data.safetyTrauma.length > 0
                    ? `${data.safetyTrauma.length} selected`
                    : 'Select options'}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-4 max-h-[400px] overflow-y-auto">
              <div className="space-y-2">
                {safetyTraumaOptions.map((option) => (
                  <div key={option} className="flex items-start space-x-2 py-2">
                    <Checkbox
                      id={`safety-${option}`}
                      checked={data.safetyTrauma?.includes(option)}
                      onCheckedChange={() => toggleOption('safetyTrauma', option)}
                    />
                    <Label
                      htmlFor={`safety-${option}`}
                      className="cursor-pointer font-normal text-sm"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Stressors */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">Current Stressors or Barriers</Label>
            {data.stressors.length > 0 && (
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {data.stressors.length}
              </Badge>
            )}
          </div>
          <Popover open={stressorsOpen} onOpenChange={setStressorsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-between",
                  data.stressors.length > 0 && "border-primary"
                )}
                type="button"
              >
                <span>
                  {data.stressors.length > 0
                    ? `${data.stressors.length} selected`
                    : 'Select options'}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-4 max-h-[400px] overflow-y-auto">
              <div className="space-y-2">
                {stressorsOptions.map((option) => (
                  <div key={option} className="flex items-start space-x-2 py-2">
                    <Checkbox
                      id={`stressors-${option}`}
                      checked={data.stressors?.includes(option)}
                      onCheckedChange={() => toggleOption('stressors', option)}
                    />
                    <Label
                      htmlFor={`stressors-${option}`}
                      className="cursor-pointer font-normal text-sm"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Additional Details */}
        {shouldShowAdditionalDetails() && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Optional: If you experienced something not listed above or want to provide more details, please describe it here.
            </Label>
            <p className="text-xs text-muted-foreground">
              (You may leave this blank if you prefer.)
            </p>
            <Textarea
              value={data.additionalDetails || ''}
              onChange={(e) => onChange({ ...data, additionalDetails: e.target.value })}
              placeholder="Enter additional details here..."
              maxLength={250}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground text-right">
              {(data.additionalDetails || '').length}/250 characters
            </p>
          </div>
        )}

        {/* Consent Section */}
        {needsConsent && (
          <div className="space-y-4 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <Label className="text-base font-medium">Consent to Share Information</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Please indicate your consent for sharing this information:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="consent-attorney" className="text-sm font-normal flex-1">
                  Share with my attorney
                </Label>
                <Switch
                  id="consent-attorney"
                  checked={data.consentAttorney === 'share'}
                  onCheckedChange={(checked) => handleConsentChange('attorney', checked)}
                  disabled={isSaving}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="consent-provider" className="text-sm font-normal flex-1">
                  Share with treating providers
                </Label>
                <Switch
                  id="consent-provider"
                  checked={data.consentProvider === 'share'}
                  onCheckedChange={(checked) => handleConsentChange('provider', checked)}
                  disabled={isSaving}
                />
              </div>
            </div>
            
            <Alert>
              <AlertDescription className="text-xs">
                You must make a choice for each option to proceed. Select the toggle on to share, or leave it off to not share.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {clientMessage && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-900">
              {clientMessage}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Summary Section */}
        {hasSelections && (
          <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Your Selections Summary
            </h4>
            <div className="space-y-2 text-sm">
              {data.substanceUse.length > 0 && (
                <div>
                  <span className="font-medium">Substance Use:</span> {data.substanceUse.length} item(s) selected
                </div>
              )}
              {data.safetyTrauma.length > 0 && (
                <div>
                  <span className="font-medium">Safety & Trauma:</span> {data.safetyTrauma.length} item(s) selected
                </div>
              )}
              {data.stressors.length > 0 && (
                <div>
                  <span className="font-medium">Stressors:</span> {data.stressors.length} item(s) selected
                </div>
              )}
              {needsConsent && (
                <div className="pt-2 border-t mt-3 space-y-1">
                  <div>
                    <span className="font-medium">Share with Attorney:</span>{' '}
                    {data.consentAttorney === 'share' ? '✓ Yes' : 
                     data.consentAttorney === 'no_share' ? '✗ No' : '⚠ Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Share with Providers:</span>{' '}
                    {data.consentProvider === 'share' ? '✓ Yes' : 
                     data.consentProvider === 'no_share' ? '✗ No' : '⚠ Not set'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
      
      {/* Skip Confirmation Dialog */}
      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip this section?</AlertDialogTitle>
            <AlertDialogDescription>
              Any selections you made here will be cleared. Safety-critical items (e.g., self-harm) 
              that were already flagged will remain active for your RN team to review.
              <br /><br />
              You can resume this section later if you change your mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSkipping}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSkipSection}
              disabled={isSkipping}
            >
              {isSkipping ? 'Skipping...' : 'Skip Section'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
