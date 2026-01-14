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
import { Info, CheckCircle2, Copy, X } from "lucide-react";
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
  const [createdIntakeSessionId, setCreatedIntakeSessionId] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [intakeSessionCreated, setIntakeSessionCreated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);

  // Load existing session if returning
  useEffect(() => {
    const storedIntakeId = sessionStorage.getItem("rcms_intake_id");
    const storedSessionId = sessionStorage.getItem("rcms_intake_session_id");
    const storedCreatedAt = sessionStorage.getItem("rcms_intake_created_at");
    
    if (storedIntakeId && storedIntakeId.startsWith("INT-")) {
      setIntakeId(storedIntakeId);
      setCreatedIntakeSessionId(storedSessionId || "");
      setCreatedAt(storedCreatedAt || "");
      setIntakeSessionCreated(true);
      setShowSuccessCard(true);
    }
  }, []);

  // Validate form
  const isValid = firstName.trim() && lastName.trim() && email.trim() && email.includes("@");

  const handleCopyIntakeId = async () => {
    if (intakeId) {
      try {
        await navigator.clipboard.writeText(intakeId);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }
    }
  };

  const handleContinue = async () => {
    // If session already created, navigate to consents
    if (intakeSessionCreated) {
      navigate("/client-consent");
      return;
    }

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
      setCreatedIntakeSessionId(session.id);
      setCreatedAt(session.createdAt);
      setIntakeSessionCreated(true);
      setShowSuccessCard(true);

      // Store session ID and intake ID in sessionStorage
      sessionStorage.setItem("rcms_intake_session_id", session.id);
      sessionStorage.setItem("rcms_intake_id", session.intakeId);
      sessionStorage.setItem("rcms_resume_token", session.resumeToken);
      sessionStorage.setItem("rcms_current_attorney_id", session.attorneyId || "");
      sessionStorage.setItem("rcms_attorney_code", session.attorneyCode || "");
      sessionStorage.setItem("rcms_intake_created_at", session.createdAt);

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
    } catch (err: any) {
      setError(err.message || "Failed to save your information. Please try again.");
      setIsSaving(false);
    } finally {
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

            {/* BEFORE message - only show if session not created */}
            {!intakeSessionCreated && (
              <Alert className="bg-amber-50 border-amber-200">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <strong>Before you continue:</strong> We need basic contact information so we can save your intake.
                  If you leave before completing this step, your information will not be saved.
                </AlertDescription>
              </Alert>
            )}

            {/* Persistent Success Card - shown after session creation */}
            {showSuccessCard && intakeSessionCreated && intakeId && (
              <Card className="bg-green-50 border-green-200 border-2">
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-green-900 mb-2">
                          Your intake has been saved!
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-green-800">
                              <strong>Intake ID:</strong>
                            </span>
                            <span className="font-mono font-bold text-green-900 bg-green-100 px-2 py-1 rounded">
                              {intakeId}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopyIntakeId}
                              className="h-7 text-xs"
                            >
                              {copied ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy ID
                                </>
                              )}
                            </Button>
                          </div>
                          {createdAt && (
                            <p className="text-xs text-green-700">
                              Created: {new Date(createdAt).toLocaleString()}
                            </p>
                          )}
                          <p className="text-sm text-green-800">
                            You can leave at any time and return using the link we sent to your email.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSuccessCard(false)}
                      className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                      aria-label="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

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

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              {intakeSessionCreated && (
                <Button
                  variant="outline"
                  onClick={() => setShowSuccessCard(true)}
                  disabled={showSuccessCard}
                >
                  Show Details
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSaving}
              >
                Back
              </Button>
              <Button
                onClick={handleContinue}
                disabled={isSaving || (!isValid && !intakeSessionCreated)}
                className="min-w-[140px]"
              >
                {isSaving
                  ? "Saving..."
                  : intakeSessionCreated
                  ? "Continue to Consents"
                  : "Continue"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
