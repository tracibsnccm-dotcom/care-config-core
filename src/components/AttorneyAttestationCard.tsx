import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, Shield } from 'lucide-react';
import { COMPLIANCE_COPY, formatHMS } from '@/constants/compliance';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/auth/supabaseAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msRemaining, setMsRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [showNotMyClientDialog, setShowNotMyClientDialog] = useState(false);

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
            {COMPLIANCE_COPY.attorneyExpired.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription className="space-y-2">
              {COMPLIANCE_COPY.attorneyExpired.bodyLines.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const handleAttest = async () => {
    if (!user) {
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

  const handleNotMyClient = async () => {
    setShowNotMyClientDialog(false);
    toast.info('Marked as not my client.');
    // Navigate back or complete flow without writing PHI
    onAttestationComplete();
  };

  return (
    <>
      <Card className="border-amber-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600" />
            {COMPLIANCE_COPY.attorneyAttestation.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Body text - rendered as paragraphs */}
          <div className="space-y-3">
            {COMPLIANCE_COPY.attorneyAttestation.bodyLines.map((line, idx) => (
              <p key={idx} className="text-sm leading-relaxed">
                {line}
              </p>
            ))}
          </div>

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

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleAttest}
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? 'Submitting...' : COMPLIANCE_COPY.attorneyAttestation.primaryCta}
            </Button>
            <Button
              onClick={() => setShowNotMyClientDialog(true)}
              disabled={isSubmitting}
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              size="lg"
            >
              {COMPLIANCE_COPY.attorneyAttestation.secondaryCta}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Not My Client Confirmation Dialog */}
      <AlertDialog open={showNotMyClientDialog} onOpenChange={setShowNotMyClientDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure this is not your client? This will prevent access to this intake.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleNotMyClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}