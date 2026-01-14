// src/pages/IntakeIdentity.tsx
// Dedicated page for collecting Minimum Intake Identity (first name, last name, email)
// This page creates the INT intake session BEFORE consents

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, CheckCircle2 } from "lucide-react";
import { createIntakeSession } from "@/lib/intakeSessionService";
import { sendResumeEmail } from "@/lib/intakeEmailService";

export default function IntakeIdentity() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get attorney info from URL params (set by ClientConsent step 0)
  const attorneyId = searchParams.get("attorney_id") || "";
  const attorneyCode = searchParams.get("attorney_code") || "";

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  
  // Session state
  const [intakeId, setIntakeId] = useState<string>("");
  const [intakeSessionCreated, setIntakeSessionCreated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing session if returning
  useEffect(() => {
    const storedIntakeId = sessionStorage.getItem("rcms_intake_id");
    if (storedIntakeId && storedIntakeId.startsWith("INT-")) {
      setIntakeId(storedIntakeId);
      setIntakeSessionCreated(true);
    }
  }, []);

  // Validate form
  const isValid = firstName.trim() && lastName.trim() && email.trim() && email.includes("@");

  const handleContinue = async () => {
    setError(null);

    if (!firstName.trim()) {
      setError("Please enter your first name.");
      return;
    }
    if (!lastName.trim()) {
      setError("Please enter your last name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validate attorney selection
    if (!attorneyId && !attorneyCode.trim()) {
      setError("Attorney selection is required. Please go back and select an attorney.");
      return;
    }

    setIsSaving(true);
    try {
      // Create or upsert INT intake session
      const session = await createIntakeSession({
        attorneyId: attorneyId || undefined,
        attorneyCode: attorneyCode || undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
      });

      setIntakeId(session.intakeId);
      setIntakeSessionCreated(true);

      // Store session ID and intake ID in sessionStorage
      sessionStorage.setItem("rcms_intake_session_id", session.id);
      sessionStorage.setItem("rcms_intake_id", session.intakeId);
      sessionStorage.setItem("rcms_resume_token", session.resumeToken);
      sessionStorage.setItem("rcms_current_attorney_id", session.attorneyId || "");
      sessionStorage.setItem("rcms_attorney_code", session.attorneyCode || "");

      // Send resume email
      try {
        await sendResumeEmail({
          email: session.email,
          firstName: session.firstName,
          lastName: session.lastName,
          resumeToken: session.resumeToken,
          intakeId: session.intakeId,
        });
      } catch (emailError) {
        console.error("Failed to send resume email:", emailError);
        // Don't block progress if email fails
      }

      // Navigate to consents after brief delay to show success message
      setTimeout(() => {
        navigate("/client-consent");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to save your information. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 md:p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Basic Contact Information
              </h1>
              <p className="text-sm text-muted-foreground">
                We need basic contact information so we can save your intake.
              </p>
            </div>

            {/* BEFORE message */}
            <Alert className="bg-amber-50 border-amber-200">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <strong>Before you continue:</strong> We need basic contact information so we can save your intake.
                If you leave before completing this step, your information will not be saved.
              </AlertDescription>
            </Alert>

            {/* Form fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  required
                  disabled={intakeSessionCreated}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last-name">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  required
                  disabled={intakeSessionCreated}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  disabled={intakeSessionCreated}
                />
              </div>
            </div>

            {/* AFTER message - shown after session creation */}
            {intakeSessionCreated && intakeId && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>Your intake has been saved.</strong> Your Intake ID is:{" "}
                  <span className="font-mono font-bold">{intakeId}</span>
                  <br />
                  You can leave at any time and return using the link we sent to your email.
                  <br />
                  <span className="text-sm">Redirecting to consents...</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSaving || intakeSessionCreated}
              >
                Back
              </Button>
              <Button
                onClick={handleContinue}
                disabled={isSaving || !isValid || intakeSessionCreated}
                className="min-w-[140px]"
              >
                {isSaving
                  ? "Saving..."
                  : intakeSessionCreated
                  ? "Saved"
                  : "Continue"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
