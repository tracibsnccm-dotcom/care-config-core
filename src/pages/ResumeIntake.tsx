// src/pages/ResumeIntake.tsx
// Resume intake page - accepts resume token and restores intake session

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { getIntakeSessionByToken } from "@/lib/intakeSessionService";

export default function ResumeIntake() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intakeId, setIntakeId] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError("Invalid resume link. Please check your email and try again.");
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      try {
        const session = await getIntakeSessionByToken(token);
        
        if (!session) {
          setError("Your intake session has expired or is invalid. Please start a new intake.");
          setLoading(false);
          return;
        }

        // Check if session is expired
        if (new Date(session.expiresAt) < new Date()) {
          setError("Your intake has expired. Please start again.");
          setLoading(false);
          return;
        }

        // Check if intake has been converted to permanent case
        if (session.intakeStatus === 'converted' || session.intakeStatus === 'submitted') {
          // Redirect to Client Portal login
          navigate('/client-login?message=' + encodeURIComponent('Your intake has been completed. Please log in with your Case ID and PIN.'));
          return;
        }

        // Store session info for IntakeWizard
        sessionStorage.setItem("rcms_intake_session_id", session.id);
        sessionStorage.setItem("rcms_intake_id", session.intakeId);
        sessionStorage.setItem("rcms_resume_token", token);
        sessionStorage.setItem("rcms_current_attorney_id", session.attorneyId || "");
        if (session.attorneyCode) {
          sessionStorage.setItem("rcms_attorney_code", session.attorneyCode);
        }

        // Store form data if available
        if (session.formData && Object.keys(session.formData).length > 0) {
          sessionStorage.setItem("rcms_intake_form_data", JSON.stringify(session.formData));
        }

        setIntakeId(session.intakeId);

        // Redirect to intake wizard with attorney info
        const attorneyParam = session.attorneyId || '';
        const codeParam = session.attorneyCode || '';
        navigate(`/client-intake?attorney_id=${encodeURIComponent(attorneyParam)}&attorney_code=${encodeURIComponent(codeParam)}&resume=true`);
      } catch (err: any) {
        console.error('Failed to load intake session:', err);
        setError(err.message || "Failed to load your intake session. Please try again.");
        setLoading(false);
      }
    };

    loadSession();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4 flex items-center justify-center">
        <Card className="p-8 max-w-2xl">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading your intake session...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4 flex items-center justify-center">
        <Card className="p-8 max-w-2xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => navigate('/client-consent')}>
              Start New Intake
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null; // Will redirect before rendering
}
