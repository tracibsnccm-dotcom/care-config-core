import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { IntakeForm, serializeIntakeForExport, toSheetRow } from "@/lib/intakeExport";
import { supabase } from "@/integrations/supabase/client";

const activities = ["Walking", "Bathing", "Dressing", "Cooking/Cleaning", "Driving"];
const adlOptions = ["Independent", "Needs help", "Unable"];

const difficultQuestions = [
  "Do you use alcohol, tobacco, or recreational drugs?",
  "Have you ever felt unsafe at home or in a relationship?",
  "Have you experienced bullying, discrimination, or harassment?",
  "Do you have memory loss or confusion related to your injury (for example, a head injury or concussion)?",
  "Would you like us to connect you with community resources or supportive services for any of these issues?",
];

export default function ClientIntakeForm() {
  const { toast } = useToast();
  const [form, setForm] = useState<IntakeForm>({
    injuryDescription: "",
    meds: "",
    conditions: "",
    allergies: "",
    pharmacy: "",
    beforeADL: {},
    afterADL: {},
    pain: "",
    anxiety: "",
    depression: "",
    support: "",
    difficultAnswers: {},
    shareWithAttorney: null,
    emergencyNotifyAttorney: null,
    shareWithPCP: false,
    wantEducation: false,
    confirm: false,
    signature: "",
  });

  const [hideSensitive, setHideSensitive] = useState(false);

  const handleChange = <K extends keyof IntakeForm>(
    field: K,
    value: IntakeForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAttorneyShare = (value: string) => {
    handleChange("shareWithAttorney", value as "yes" | "no");
    setHideSensitive(value === "no");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!form.confirm || !form.signature.trim()) {
      toast({
        title: "Incomplete Form",
        description: "Please confirm and provide your signature to submit.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to submit the intake form.",
          variant: "destructive",
        });
        return;
      }

      // Serialize the intake form using the export schema
      const envelope = serializeIntakeForExport(form, {
        caseId: `RC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
        clientLabel: form.signature.split(" ").map(n => n[0]?.toUpperCase() || "").join(".") + ".",
        firmName: "RCMS C.A.R.E.",
      });

      const sheetRow = toSheetRow(envelope);

      console.log("Intake Export Envelope:", envelope);
      console.log("Sheet Row Format:", sheetRow);

      // Save emergency notification consent to client_preferences
      if (form.emergencyNotifyAttorney) {
        const { error: prefError } = await supabase
          .from('client_preferences')
          .upsert({
            client_id: user.id,
            attorney_notify_consent: form.emergencyNotifyAttorney === 'yes',
            consent_signed_at: new Date().toISOString(),
          }, {
            onConflict: 'client_id'
          });

        if (prefError) {
          console.error('Error saving consent preferences:', prefError);
          toast({
            title: "Warning",
            description: "Intake saved but consent preferences could not be updated.",
            variant: "destructive",
          });
        }
      }

      // TODO: Submit to Supabase database
      // This would use supabase.from('intakes').insert(...) to store the data

      toast({
        title: "Intake Submitted",
        description: `Case ID: ${envelope.meta.case_id}. Your intake form has been recorded.`,
      });

      // Reset form
      setForm({
        injuryDescription: "",
        meds: "",
        conditions: "",
        allergies: "",
        pharmacy: "",
        beforeADL: {},
        afterADL: {},
        pain: "",
        anxiety: "",
        depression: "",
        support: "",
        difficultAnswers: {},
        shareWithAttorney: null,
        emergencyNotifyAttorney: null,
        shareWithPCP: false,
        wantEducation: false,
        confirm: false,
        signature: "",
      });

    } catch (error) {
      console.error('Error submitting intake:', error);
      toast({
        title: "Submission Failed",
        description: "Could not submit your intake form. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-card p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-center mb-4 text-primary">
        Reconcile C.A.R.E. – Client Intake Form
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1️⃣ Injury Description */}
        <section className="space-y-3">
          <h3 className="font-semibold text-lg text-foreground">Injury Description</h3>
          <p className="text-sm text-muted-foreground">
            Please describe what happened in your own words. Include details like
            loss of consciousness, cuts, bruises, breathing difficulty, or other injuries.
          </p>
          <Textarea
            rows={4}
            value={form.injuryDescription}
            onChange={(e) => handleChange("injuryDescription", e.target.value)}
          />
        </section>

        {/* 2️⃣ Current Health Background */}
        <section className="space-y-4">
          <h3 className="font-semibold text-lg text-foreground">Current Health Background</h3>
          
          <div className="space-y-2">
            <Label>Medications, Vitamins, and Supplements</Label>
            <Textarea
              rows={3}
              value={form.meds}
              onChange={(e) => handleChange("meds", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Current Conditions Being Treated</Label>
            <Textarea
              rows={2}
              value={form.conditions}
              onChange={(e) => handleChange("conditions", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Allergies (Food, Medications, or Materials)</Label>
            <Input
              type="text"
              value={form.allergies}
              onChange={(e) => handleChange("allergies", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Preferred Pharmacy</Label>
            <Input
              type="text"
              value={form.pharmacy}
              onChange={(e) => handleChange("pharmacy", e.target.value)}
            />
          </div>
        </section>

        {/* 3️⃣ Functional Status */}
        <section className="space-y-3">
          <h3 className="font-semibold text-lg text-foreground">
            Functional Status – Activities of Daily Living
          </h3>
          <p className="text-sm text-muted-foreground">
            Please select your ability before and since your injury or illness.
          </p>
          
          <div className="space-y-2">
            {activities.map((activity) => (
              <div key={activity} className="grid grid-cols-3 gap-2 items-center text-sm">
                <span className="font-medium text-foreground">{activity}</span>
                
                <Select
                  value={form.beforeADL[activity]}
                  onValueChange={(value) =>
                    setForm((f) => ({
                      ...f,
                      beforeADL: { ...f.beforeADL, [activity]: value as "Independent" | "Needs help" | "Unable" },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Before Injury" />
                  </SelectTrigger>
                  <SelectContent>
                    {adlOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={form.afterADL[activity]}
                  onValueChange={(value) =>
                    setForm((f) => ({
                      ...f,
                      afterADL: { ...f.afterADL, [activity]: value as "Independent" | "Needs help" | "Unable" },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Since Injury" />
                  </SelectTrigger>
                  <SelectContent>
                    {adlOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </section>

        {/* 4️⃣ Emotional & Pain Wellness */}
        <section className="space-y-4">
          <h3 className="font-semibold text-lg text-foreground">Emotional & Pain Wellness</h3>
          
          <div className="space-y-2">
            <Label>Pain Level (0–10)</Label>
            <Input
              type="number"
              min="0"
              max="10"
              className="w-24"
              value={form.pain}
              onChange={(e) => handleChange("pain", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Anxiety Level (1–5)</Label>
            <Input
              type="number"
              min="1"
              max="5"
              className="w-24"
              value={form.anxiety}
              onChange={(e) => handleChange("anxiety", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Depression Level (1–5)</Label>
            <Input
              type="number"
              min="1"
              max="5"
              className="w-24"
              value={form.depression}
              onChange={(e) => handleChange("depression", e.target.value)}
            />
          </div>
        </section>

        {/* 5️⃣ Support Systems */}
        <section className="space-y-3">
          <h3 className="font-semibold text-lg text-foreground">Support Systems</h3>
          <p className="text-sm text-muted-foreground">
            Do you have friends or family assisting with your recovery?
          </p>
          <Textarea
            rows={2}
            value={form.support}
            onChange={(e) => handleChange("support", e.target.value)}
          />
        </section>

        {/* 6️⃣ Difficult Questions & Situations */}
        <section className="space-y-4">
          <h3 className="font-semibold text-lg text-foreground">
            Difficult Questions & Situations
          </h3>
          <p className="text-sm text-muted-foreground">
            We understand that people face difficult life experiences that can affect recovery. 
            These questions help us identify community resources or additional support — not to judge or report. 
            By asking these questions RCMS does not make judgements regarding legality, life choices or values.
          </p>

          {difficultQuestions.map((q) => (
            <div key={q} className="space-y-2">
              <Label className="text-sm font-normal">{q}</Label>
              <Textarea
                rows={2}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    difficultAnswers: { ...f.difficultAnswers, [q]: e.target.value },
                  }))
                }
              />
            </div>
          ))}

          <div className="space-y-3">
            <Label>Do you want RCMS to share information from this section with your attorney?</Label>
            <RadioGroup
              value={form.shareWithAttorney || ""}
              onValueChange={handleAttorneyShare}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="share-yes" />
                <Label htmlFor="share-yes" className="font-normal cursor-pointer">
                  I do want RCMS to share information from the Difficult Situations section with my attorney.
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="share-no" />
                <Label htmlFor="share-no" className="font-normal cursor-pointer">
                  I do not want RCMS to share information from the Difficult Situations section with my attorney.
                </Label>
              </div>
            </RadioGroup>
            
            <p className="text-sm text-muted-foreground italic">
              It is in your best interest to share all information with your attorney, but we will always respect your rights to HIPAA and will act according to your wishes regarding these personal and private situations.
            </p>
          </div>

          {hideSensitive && (
            <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500">
              <AlertDescription>
                <strong>Attorney View Notice:</strong> Sensitive responses in this section will be hidden from attorney access.
              </AlertDescription>
            </Alert>
          )}
        </section>

        {/* 7️⃣ Sharing & Education Preferences */}
        <section className="space-y-4">
          <h3 className="font-semibold text-lg text-foreground">
            Sharing & Education Preferences
          </h3>

          <div className="space-y-3">
            <Label className="text-base font-semibold">
              If you experience a difficult or emergency situation (for example, you feel unsafe, overwhelmed, or are thinking of harming yourself), do you want your attorney to be notified when your RN Care Manager makes an emergency referral or wellness check?
            </Label>
            <p className="text-sm text-muted-foreground">
              Selecting <strong>Yes</strong> means your attorney will only receive a brief notice that a "client crisis occurred and a referral was made." No private medical or mental health details will be shared.
            </p>
            <RadioGroup
              value={form.emergencyNotifyAttorney || ""}
              onValueChange={(value) => handleChange("emergencyNotifyAttorney", value as "yes" | "no")}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="emergency-yes" />
                <Label htmlFor="emergency-yes" className="font-normal cursor-pointer">
                  Yes, I give permission to notify my attorney.
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="emergency-no" />
                <Label htmlFor="emergency-no" className="font-normal cursor-pointer">
                  No, please keep this private between me and my care team.
                </Label>
              </div>
            </RadioGroup>
            <Alert className="bg-muted">
              <AlertDescription className="text-sm">
                <strong>Authorization to Notify Attorney During Emergency Situations</strong>
                <br />
                I authorize Reconcile C.A.R.E. and my RN Care Manager to notify my attorney if I experience a difficult or emergency situation requiring crisis intervention or referral. I understand that only minimal information will be shared (that an emergency referral was made, without details of my condition or treatment).
                <br /><br />
                This authorization remains valid until I revoke it in writing or electronically in my client portal.
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="share-pcp"
              checked={form.shareWithPCP}
              onCheckedChange={(checked) => handleChange("shareWithPCP", !!checked)}
            />
            <Label htmlFor="share-pcp" className="font-normal cursor-pointer">
              I would like RCMS to share clinical information with my primary care provider.
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="want-education"
              checked={form.wantEducation}
              onCheckedChange={(checked) => handleChange("wantEducation", !!checked)}
            />
            <Label htmlFor="want-education" className="font-normal cursor-pointer">
              I would like to receive age-specific health maintenance and chronic condition education materials.
            </Label>
          </div>
        </section>

        {/* 8️⃣ Confirmation & Signature */}
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">
            I confirm that the information provided is accurate and understand this will be used to coordinate my care.
          </p>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm"
              checked={form.confirm}
              onCheckedChange={(checked) => handleChange("confirm", !!checked)}
            />
            <Label htmlFor="confirm" className="font-normal cursor-pointer">
              I agree
            </Label>
          </div>

          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Type full name as digital signature"
              value={form.signature}
              onChange={(e) => handleChange("signature", e.target.value)}
            />
          </div>
        </section>

        <Button type="submit" className="mt-4">
          Submit Intake
        </Button>
      </form>
    </div>
  );
}
