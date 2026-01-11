import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, CheckCircle, Loader2 } from "lucide-react";
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

export function ClientWellnessCheckin({ caseId }: WellnessCheckinProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckin, setLastCheckin] = useState<Date | null>(null);
  
  // 4Ps scores (1-5 scale)
  const [physical, setPhysical] = useState(3);
  const [psychological, setPsychological] = useState(3);
  const [psychosocial, setPsychosocial] = useState(3);
  const [professional, setProfessional] = useState(3);
  
  // Additional tracking
  const [painLevel, setPainLevel] = useState(5);
  const [notes, setNotes] = useState("");

  // Check for recent check-in
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

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Convert 1-5 scale to 0-100 for storage (matching existing schema)
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
        setNotes("");
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
      <div className="space-y-3 p-4 bg-slate-700/50 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded">{code}</span>
              <span className="text-white font-medium">{label}</span>
            </div>
            <p className="text-slate-400 text-sm mt-1">{description}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-amber-500">{value}</span>
            <p className="text-xs text-slate-400">{SCALE_LABELS[value as keyof typeof SCALE_LABELS]}</p>
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
        <div className="flex justify-between text-xs text-slate-500">
          <span>1 - Struggling</span>
          <span>5 - Thriving</span>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Check-in Complete!</h3>
          <p className="text-slate-400">Thank you for sharing how you're feeling today.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {lastCheckin && (
        <Alert className="bg-slate-700 border-slate-600">
          <AlertDescription className="text-slate-300">
            Last check-in: {lastCheckin.toLocaleDateString()} at {lastCheckin.toLocaleTimeString()}
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            Daily Wellness Check-in
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Rate how you're feeling in each area (1 = Struggling, 5 = Thriving)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 4Ps Sliders */}
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

          {/* Pain Level - Same scale as 4Ps: 1=Bad, 5=Good */}
          <div className="space-y-3 p-4 bg-slate-700/50 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-white font-medium">Pain Level</span>
                <p className="text-slate-400 text-sm mt-1">How would you rate your pain today?</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-amber-500">{painLevel}</span>
                <p className="text-xs text-slate-400">
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
            <div className="flex justify-between text-xs text-slate-500">
              <span>1 - Extreme Pain</span>
              <span>5 - No Pain</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-white">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else you'd like to share about how you're feeling today?"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
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
        </CardContent>
      </Card>
    </div>
  );
}
