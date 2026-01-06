import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, Shield } from 'lucide-react';
import { COMPLIANCE_COPY, formatHMS, ATTORNEY_CONFIRM_WINDOW_HOURS } from '@/constants/compliance';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/auth/supabaseAuth';

interface AttorneyAttestationCardProps {
  intakeId: string;
  caseId: string;
  intakeSubmittedAt: string;
  attorneyConfirmDeadlineAt: string;
  onAttestationComplete: () => void;
}

export function AttorneyAttestationCard({
  intakeId,
  caseId,
  intakeSubmittedAt,
  attorneyConfirmDeadlineAt,
  onAttestationComplete,
}: AttorneyAttestationCardProps) {
  const { user } = useAuth();
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msRemaining, setMsRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  // Update countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      const deadline = new Date(attorneyConfirmDeadlineAt).getTime();
      const now = Date.now();
      const remaining = deadline - now;
      
      setMsRemaining(remaining);
      setIsExpired(remaining <= 0);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [attorneyConfirmDeadlineAt]);

  // Handle expired state
  if (isExpired) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            {COMPLIANCE_COPY.attorneyAttestationTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription className="whitespace-pre-line">
              {COMPLIANCE_COPY.expiredCopy}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const handleAttest = async () => {
    if (!isChecked || !user) {
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      
      // Get attorney ID - try to get from rc_users first, otherwise use user.email or user.id as text
      let attorneyId: string = user.email || user.id;
      
      try {
        const { data: rcUser } = await supabase
          .from('rc_users')
          .select('id')
          .eq('auth_user_id', user.id)
          .eq('role', 'attorney')
          .single();
        
        if (rcUser?.id) {
          attorneyId = rcUser.id;
        }
      } catch (err) {
        // If we can't find rc_users entry, use email/id as text (MVP fallback)
        console.log('Using fallback attorney identifier');
      }

      // Update intake with attestation
      const { error: updateError } = await supabase
        .from('rc_client_intakes')
        .update({
          attorney_attested_at: now,
          attorney_attested_by: attorneyId,
          intake_status: 'attorney_confirmed',
        })
        .eq('id', intakeId);

      if (updateError) {
        throw updateError;
      }

      // Log notification
      const { error: logError } = await supabase
        .from('rc_notification_log')
        .insert({
          intake_id: intakeId,
          case_id: caseId,
          attorney_id: attorneyId,
          channel: 'inapp',
          template_key: 'attorney_confirmed',
          dedupe_key: `intake:${intakeId}:attorney:confirmed`,
        });

      if (logError) {
        console.error('Failed to log notification:', logError);
        // Don't fail the attestation if logging fails
      }

      toast.success('Attestation submitted successfully');
      onAttestationComplete();
    } catch (error: any) {
      console.error('Attestation error:', error);
      toast.error(error.message || 'Failed to submit attestation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-amber-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-600" />
          {COMPLIANCE_COPY.attorneyAttestationTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning banner */}
        <Alert variant="default" className="bg-amber-50 border-amber-500">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900 font-semibold">
            {COMPLIANCE_COPY.attorneyAttestationWarningTop}
          </AlertDescription>
        </Alert>

        {/* Countdown timer */}
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
          <Clock className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">
              {COMPLIANCE_COPY.deadlineExplainer}
            </p>
            <p className="text-2xl font-bold font-mono text-primary">
              {formatHMS(msRemaining)}
            </p>
          </div>
        </div>

        {/* Attestation checkbox */}
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-4 border rounded-lg">
            <Checkbox
              id="attestation-checkbox"
              checked={isChecked}
              onCheckedChange={(checked) => setIsChecked(checked === true)}
              className="mt-1"
            />
            <Label
              htmlFor="attestation-checkbox"
              className="flex-1 cursor-pointer text-sm leading-relaxed"
            >
              {COMPLIANCE_COPY.attorneyAttestationCheckboxText}
            </Label>
          </div>
        </div>

        {/* Confirm button */}
        <Button
          onClick={handleAttest}
          disabled={!isChecked || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Submitting...' : 'Confirm Attestation'}
        </Button>
      </CardContent>
    </Card>
  );
}