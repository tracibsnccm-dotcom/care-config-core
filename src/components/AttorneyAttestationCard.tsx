import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Shield, CheckCircle2 } from 'lucide-react';
import { COMPLIANCE_COPY, formatHMS } from '@/constants/compliance';
import { toast } from 'sonner';
import { useAuth } from '@/auth/supabaseAuth';
import { supabaseGet, supabaseUpdate, supabaseInsert } from '@/lib/supabaseRest';
import { audit } from '@/lib/supabaseOperations';
import { createAutoNote, generateAttestationNote } from '@/lib/autoNotes';
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateCaseNumber(attorneyCode: string, sequenceToday: number): string {
  const today = new Date();
  const yy = today.getFullYear().toString().slice(-2);
  const mm = (today.getMonth() + 1).toString().padStart(2, '0');
  const dd = today.getDate().toString().padStart(2, '0');
  const seq = sequenceToday.toString().padStart(2, '0');
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randomLetter = letters[Math.floor(Math.random() * letters.length)];
  return `${attorneyCode}-${yy}${mm}${dd}-${seq}${randomLetter}`;
}

function generatePIN(): string {
  const excluded = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321'];
  let pin: string;
  do {
    pin = Math.floor(1000 + Math.random() * 9000).toString();
  } while (excluded.includes(pin));
  return pin;
}

// ============================================================================
// COMPONENT TYPES
// ============================================================================

type ViewState = 'loading' | 'pending' | 'confirmed' | 'declined' | 'expired';

interface ConfirmationData {
  caseNumber: string;
  clientPin: string;
  confirmedAt: string;
}

interface AttorneyAttestationCardProps {
  intakeId: string;
  caseId: string;
  intakeSubmittedAt: string;
  attorneyConfirmDeadlineAt: string;
  attorneyAttestedAt?: string | null;
  intakeJson?: any;
  onAttestationComplete: () => void;
  onAttested?: (attestedAt: string, updatedIntakeJson: any) => void;
  onResolved?: (resolution: "CONFIRMED" | "DECLINED", timestamp: string, updatedIntakeJson: any) => void;
  resolved?: null | "CONFIRMED" | "DECLINED";
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AttorneyAttestationCard({
  intakeId,
  caseId,
  intakeSubmittedAt,
  attorneyConfirmDeadlineAt,
  attorneyAttestedAt,
  intakeJson,
  onAttestationComplete,
  onAttested,
  onResolved,
  resolved,
}: AttorneyAttestationCardProps) {
  const { user } = useAuth();
  
  // ============================================================================
  // STATE
  // ============================================================================
  
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [msRemaining, setMsRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  // ============================================================================
  // DETERMINE INITIAL STATE
  // ============================================================================
  
  useEffect(() => {
    // Only run on mount - don't re-run when props change
    // This prevents parent state updates from overriding our local confirmation state
    
    // Check sessionStorage first (survives re-renders)
    const sessionKey = `attestation_${intakeId}`;
    const stored = sessionStorage.getItem(sessionKey);
    
    if (stored) {
      const data = JSON.parse(stored);
      setConfirmationData(data);
      setViewState('confirmed');
      return;
    }
    
    // Check props for initial state
    if (attorneyAttestedAt || resolved === 'CONFIRMED') {
      setViewState('confirmed');
      return;
    }
    
    if (resolved === 'DECLINED') {
      setViewState('declined');
      return;
    }
    
    // Check if expired
    const deadline = new Date(attorneyConfirmDeadlineAt).getTime();
    if (Date.now() >= deadline) {
      setViewState('expired');
      return;
    }
    
    // Otherwise pending
    setViewState('pending');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intakeId]); // Only re-run if intakeId changes, not other props

  // ============================================================================
  // COUNTDOWN TIMER
  // ============================================================================
  
  useEffect(() => {
    if (viewState !== 'pending') return;
    
    const updateCountdown = () => {
      const deadline = new Date(attorneyConfirmDeadlineAt).getTime();
      const remaining = deadline - Date.now();
      
      if (remaining <= 0) {
        setViewState('expired');
        setMsRemaining(0);
      } else {
        setMsRemaining(remaining);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [viewState, attorneyConfirmDeadlineAt]);

  // ============================================================================
  // HANDLE CONFIRM
  // ============================================================================
  
  const handleConfirm = async () => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Get attorney info
      const { data: rcUsers, error: rcUsersError } = await supabaseGet(
        'rc_users', 
        `select=id,attorney_code&auth_user_id=eq.${user.id}&role=eq.attorney&limit=1`
      );
      
      if (rcUsersError) throw new Error(`Failed to get attorney: ${rcUsersError.message}`);
      
      const rcUser = Array.isArray(rcUsers) ? rcUsers[0] : rcUsers;
      if (!rcUser?.id || !rcUser?.attorney_code) {
        throw new Error('Attorney record not found');
      }
      
      const attorneyId = rcUser.id;
      const attorneyCode = rcUser.attorney_code;
      
      // 2. Get intake
      const { data: intakes, error: intakesError } = await supabaseGet(
        'rc_client_intakes', 
        `select=id,case_id,intake_json&id=eq.${intakeId}&limit=1`
      );
      
      if (intakesError) throw new Error(`Failed to get intake: ${intakesError.message}`);
      
      const intake = Array.isArray(intakes) ? intakes[0] : intakes;
      if (!intake?.case_id) throw new Error('Intake not found');
      
      // 3. Count today's cases for sequence
      const today = new Date();
      const dateStr = `${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
      const prefix = `${attorneyCode}-${dateStr}-`;
      
      const { data: allCases } = await supabaseGet(
        'rc_cases',
        `select=id,case_number&attorney_id=eq.${attorneyId}&case_number=not.is.null`
      );
      
      const todayCases = Array.isArray(allCases) 
        ? allCases.filter((c: any) => c.case_number?.startsWith(prefix))
        : [];
      
      const sequence = todayCases.length + 1;
      
      // 4. Generate case number and PIN
      const caseNumber = generateCaseNumber(attorneyCode, sequence);
      const clientPin = generatePIN();
      const now = new Date().toISOString();
      
      // 5. Update rc_cases
      const { error: caseError } = await supabaseUpdate(
        'rc_cases',
        `id=eq.${intake.case_id}`,
        {
          case_number: caseNumber,
          client_pin: clientPin,
          case_status: 'attorney_confirmed',
        }
      );
      
      if (caseError) throw new Error(`Failed to update case: ${caseError.message}`);
      
      // 6. Update rc_client_intakes
      const existingJson = intake.intake_json || {};
      const updatedJson = {
        ...existingJson,
        compliance: {
          ...(existingJson.compliance || {}),
          attorney_confirmation_receipt: {
            action: 'CONFIRMED',
            confirmed_at: now,
            confirmed_by: attorneyId,
          }
        },
        attorney_attestation: {
          status: 'confirmed',
          confirmed_at: now,
        }
      };
      
      const { error: intakeError } = await supabaseUpdate(
        'rc_client_intakes',
        `id=eq.${intakeId}`,
        {
          attorney_attested_at: now,
          attorney_confirm_deadline_at: null,
          intake_status: 'attorney_confirmed',
          intake_json: updatedJson,
        }
      );
      
      if (intakeError) throw new Error(`Failed to update intake: ${intakeError.message}`);
      
      // Audit: Attorney confirmed
      try {
        await audit({
          action: 'attorney_confirmed',
          actorRole: 'attorney',
          actorId: user?.id || '',
          caseId: intake.case_id,
          meta: { intake_id: intakeId, case_number: caseNumber }
        });
      } catch (e) {
        console.error('Failed to audit attorney confirmation:', e);
      }
      
      // Create auto-generated attestation note
      try {
        await createAutoNote({
          caseId: intake.case_id,
          noteType: 'attestation',
          title: 'Attorney Confirmation',
          content: generateAttestationNote(attorneyId, caseNumber, 'confirmed'),
          createdBy: user?.id || '',
          createdByRole: 'attorney',
          visibility: 'all',
        });
      } catch (e) {
        console.error('Failed to create attestation note:', e);
      }
      
      // 7. Try to create RN assignment (don't fail if this fails)
      try {
        const { data: rnUser } = await supabaseGet('rc_users', 'select=auth_user_id&role=eq.rn&limit=1');
        const rn = Array.isArray(rnUser) ? rnUser[0] : rnUser;
        
        if (rn?.auth_user_id) {
          await supabaseInsert('rc_case_assignments', {
            case_id: intake.case_id,
            user_id: rn.auth_user_id,
            status: 'active',
            assigned_at: now
          });
        }
      } catch (e) {
        console.error('RN assignment failed (non-critical):', e);
      }
      
      // 8. SUCCESS - Update UI immediately
      const confirmation: ConfirmationData = {
        caseNumber,
        clientPin,
        confirmedAt: now,
      };
      
      // Save to sessionStorage so it survives any re-renders
      sessionStorage.setItem(`attestation_${intakeId}`, JSON.stringify(confirmation));
      
      // Update local state
      setConfirmationData(confirmation);
      setViewState('confirmed');
      
      // Notify parent
      if (onResolved) onResolved('CONFIRMED', now, updatedJson);
      if (onAttested) onAttested(now, updatedJson);
      
      toast.success('Case confirmed! Case number and PIN generated.');
      
    } catch (error: any) {
      console.error('Attestation failed:', error);
      toast.error(error.message || 'Failed to confirm');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // HANDLE DECLINE
  // ============================================================================
  
  const handleDecline = async () => {
    if (!user) return;
    
    setShowDeclineDialog(false);
    setIsSubmitting(true);
    
    try {
      const now = new Date().toISOString();
      
      // Get intake
      const { data: intakes } = await supabaseGet(
        'rc_client_intakes', 
        `select=id,intake_json&id=eq.${intakeId}&limit=1`
      );
      
      const intake = Array.isArray(intakes) ? intakes[0] : intakes;
      if (!intake) throw new Error('Intake not found');
      
      const existingJson = intake.intake_json || {};
      const updatedJson = {
        ...existingJson,
        attorney_attestation: {
          status: 'declined',
          declined_at: now,
        }
      };
      
      const { error } = await supabaseUpdate(
        'rc_client_intakes',
        `id=eq.${intakeId}`,
        {
          intake_status: 'attorney_declined_not_client',
          attorney_confirm_deadline_at: null,
          intake_json: updatedJson,
        }
      );
      
      if (error) throw new Error(error.message);
      
      // Audit: Attorney declined
      try {
        await audit({
          action: 'attorney_declined',
          actorRole: 'attorney',
          actorId: user?.id || '',
          caseId: caseId,
          meta: { intake_id: intakeId }
        });
      } catch (e) {
        console.error('Failed to audit attorney decline:', e);
      }
      
      // Create auto-generated decline note
      try {
        await createAutoNote({
          caseId: caseId,
          noteType: 'attestation',
          title: 'Attorney Declined',
          content: generateAttestationNote(user?.id || '', '', 'declined'),
          createdBy: user?.id || '',
          createdByRole: 'attorney',
          visibility: 'all',
        });
      } catch (e) {
        console.error('Failed to create decline note:', e);
      }
      
      setViewState('declined');
      if (onResolved) onResolved('DECLINED', now, updatedJson);
      toast.info('Marked as not my client');
      
    } catch (error: any) {
      console.error('Decline failed:', error);
      toast.error(error.message || 'Failed to decline');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // RENDER: LOADING
  // ============================================================================
  
  if (viewState === 'loading') {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // RENDER: CONFIRMED
  // ============================================================================
  
  if (viewState === 'confirmed') {
    return (
      <Card className="border-green-500 border-2">
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-6 h-6" />
            Attorney Confirmation Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {/* Case Number and PIN - PROMINENT DISPLAY */}
          {confirmationData && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4">
                🔑 Client Login Credentials
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Provide these to your client so they can access their portal:
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded border">
                  <p className="text-xs text-blue-600 uppercase font-medium mb-1">Case Number</p>
                  <p className="text-2xl font-mono font-bold text-blue-900">
                    {confirmationData.caseNumber}
                  </p>
                </div>
                <div className="bg-white p-4 rounded border">
                  <p className="text-xs text-blue-600 uppercase font-medium mb-1">PIN</p>
                  <p className="text-2xl font-mono font-bold text-blue-900">
                    {confirmationData.clientPin}
                  </p>
                </div>
              </div>
              <p className="text-sm text-amber-700 mt-4 font-medium">
                ⚠️ The PIN is shown only once. Please record it now.
              </p>
            </div>
          )}
          
          {/* Confirmation Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className="bg-green-600">Confirmed</Badge>
            </div>
            {confirmationData?.confirmedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Confirmed At</span>
                <span className="font-medium">
                  {new Date(confirmationData.confirmedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          
          {/* Back Button */}
          <Button 
            onClick={() => {
              sessionStorage.removeItem(`attestation_${intakeId}`);
              onAttestationComplete();
            }}
            className="w-full"
          >
            Back to Intake List
          </Button>
          
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // RENDER: DECLINED
  // ============================================================================
  
  if (viewState === 'declined') {
    return (
      <Card className="border-amber-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            Not My Client
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-900">
              This intake has been marked as not your client. Access is disabled.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // RENDER: EXPIRED
  // ============================================================================
  
  if (viewState === 'expired') {
    return (
      <Card className="border-red-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Confirmation Window Expired
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              The 48-hour confirmation window has expired. This intake data has been 
              purged in accordance with HIPAA privacy requirements.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // RENDER: PENDING (default)
  // ============================================================================
  
  return (
    <>
      <Card className="border-amber-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600" />
            Attorney Confirmation Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Countdown Timer */}
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Clock className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                Time remaining to confirm:
              </p>
              <p className="text-2xl font-bold font-mono text-primary">
                {formatHMS(msRemaining)}
              </p>
            </div>
          </div>
          
          {/* Attestation Text */}
          <div className="space-y-3">
            <h4 className="font-semibold">{COMPLIANCE_COPY.attorneyAttestation.title}</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              {COMPLIANCE_COPY.attorneyAttestation.bodyLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? 'Confirming...' : 'Confirm Client Relationship'}
            </Button>
            
            <Button 
              onClick={() => setShowDeclineDialog(true)}
              disabled={isSubmitting}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
              size="lg"
            >
              Not My Client
            </Button>
          </div>
          
        </CardContent>
      </Card>
      
      {/* Decline Confirmation Dialog */}
      <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure this is not your client? This will prevent access to this intake.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDecline}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm - Not My Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
