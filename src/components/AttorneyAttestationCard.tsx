import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Shield, CheckCircle2, Printer } from 'lucide-react';
import { COMPLIANCE_COPY, formatHMS } from '@/constants/compliance';
import { toast } from 'sonner';
import { useAuth } from '@/auth/supabaseAuth';
import { supabase } from '@/auth/supabaseAuth';
import { audit } from '@/lib/supabaseOperations';

// Helper function for direct fetch to Supabase REST API (GET)
async function supabaseFetch(table: string, query: string = '', accessToken?: string) {
  const supabaseUrl = 'https://zmjxyspizdqhrtdcgkwk.supabase.co';
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken || supabaseKey}`,
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error(`Supabase fetch error: ${response.status}`);
  }
  
  return response.json();
}

// Helper function for UPDATE operations (PATCH)
async function supabaseUpdate(table: string, filter: string, updates: object, accessToken?: string) {
  const supabaseUrl = 'https://zmjxyspizdqhrtdcgkwk.supabase.co';
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken || supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Update error: ${response.status} - ${errorText}`);
  }
  
  return true;
}
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

// Helper function to escape HTML for security
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper function to open print window for confirmation receipt
function openConfirmationPrintWindow(
  caseId: string,
  intakeId: string,
  receipt: {
    action: string;
    confirmed_at: string;
    confirmed_by?: string;
    attestation_text?: string;
  }
) {
  const confirmedDate = new Date(receipt.confirmed_at).toLocaleString();
  const status = receipt.action === "CONFIRMED" ? "Confirmed" : "Not My Client";
  const attestationText = receipt.attestation_text || "";

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Attorney Confirmation Receipt</title>
    <style>
      @page { size: Letter; margin: 0.75in; }
      body { 
        font-family: ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"; 
        color: #0f172a; 
        line-height: 1.6;
      }
      .header {
        margin-bottom: 24px;
      }
      .title {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 8px;
        color: #0f172a;
      }
      .hr {
        height: 1px;
        background: #e2e8f0;
        margin: 16px 0;
      }
      .meta {
        font-size: 13px;
        color: #334155;
        margin-bottom: 16px;
      }
      .meta-row {
        margin-bottom: 8px;
      }
      .meta-label {
        font-weight: 600;
        display: inline-block;
        min-width: 120px;
      }
      .status {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        background: #10b981;
        color: white;
      }
      .status.not-my-client {
        background: #f59e0b;
      }
      .attestation-section {
        margin-top: 24px;
      }
      .attestation-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 12px;
        color: #0f172a;
      }
      .attestation-text {
        white-space: pre-wrap;
        font-size: 12px;
        line-height: 1.6;
        color: #334155;
        padding: 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
      }
      .attestation-text p {
        margin-bottom: 12px;
      }
      .attestation-text p:last-child {
        margin-bottom: 0;
      }
      .footer {
        margin-top: 32px;
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
        font-size: 10px;
        color: #64748b;
        text-align: center;
      }
      @media print {
        .no-print {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="title">Attorney Confirmation Receipt</div>
    </div>
    <div class="hr"></div>
    
    <div class="meta">
      <div class="meta-row">
        <span class="meta-label">Case ID:</span>
        <span>${escapeHtml(caseId)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Intake ID:</span>
        <span>${escapeHtml(intakeId)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Status:</span>
        <span class="status ${receipt.action === "NOT_MY_CLIENT" ? "not-my-client" : ""}">${escapeHtml(status)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Confirmed Date/Time:</span>
        <span>${escapeHtml(confirmedDate)}</span>
      </div>
      ${receipt.confirmed_by ? `
      <div class="meta-row">
        <span class="meta-label">Confirmed By:</span>
        <span>${escapeHtml(receipt.confirmed_by)}</span>
      </div>
      ` : ''}
    </div>

    ${attestationText ? `
    <div class="attestation-section">
      <div class="attestation-title">Attestation Text</div>
      <div class="attestation-text">
        ${attestationText
          .split(/\n\n+/)
          .map((para) => {
            const isBold = para.includes('**');
            const cleaned = para.replace(/\*\*/g, '');
            return `<p${isBold ? ' style="font-weight: 700;"' : ''}>${escapeHtml(cleaned)}</p>`;
          })
          .join('')}
      </div>
    </div>
    ` : ''}

    <div class="footer">
      Confidential — Attorney Work Product
    </div>

    <div class="no-print" style="margin-top:16px;">
      <button onclick="window.print()" style="padding: 8px 16px; font-size: 14px; cursor: pointer; background: #0f172a; color: white; border: none; border-radius: 4px;">
        Print / Save as PDF
      </button>
    </div>
    <script>window.onload = () => setTimeout(() => window.print(), 250);</script>
  </body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) {
    alert("Please allow pop-ups to print this receipt.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msRemaining, setMsRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [showNotMyClientDialog, setShowNotMyClientDialog] = useState(false);

  // Countdown visibility rule: only show if deadline exists, not attested, and deadline hasn't passed
  const shouldShowCountdown =
    !!attorneyConfirmDeadlineAt &&
    !attorneyAttestedAt &&
    Date.now() < new Date(attorneyConfirmDeadlineAt).getTime() &&
    resolved === null;

  // Update countdown every second - only when it should be visible
  // Interval is created only when shouldShowCountdown is true and cleared when it becomes false
  useEffect(() => {
    if (!shouldShowCountdown) {
      // Clear any existing state when countdown should not show
      setMsRemaining(0);
      return;
    }

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
  }, [shouldShowCountdown, attorneyConfirmDeadlineAt, intakeId]);

  // Handle confirmed state (attorney_attested_at exists) - show receipt instead of form
  // Only rely on DB state, not local-only state
  if (attorneyAttestedAt || resolved === "CONFIRMED") {
    // Get receipt from intake_json (DB state) or fallback to attorneyAttestedAt
    const storedReceipt = intakeJson?.compliance?.attorney_confirmation_receipt;
    const receiptData = 
      (storedReceipt ? { confirmedAt: storedReceipt.confirmed_at, confirmedBy: storedReceipt.confirmed_by } : null) ||
      (attorneyAttestedAt ? { confirmedAt: attorneyAttestedAt, confirmedBy: '' } : null);
    
    const receipt = storedReceipt || (receiptData ? {
      action: "CONFIRMED",
      confirmed_at: receiptData.confirmedAt,
      confirmed_by: receiptData.confirmedBy,
      attestation_text: `${COMPLIANCE_COPY.attorneyAttestation.title}\n\n${COMPLIANCE_COPY.attorneyAttestation.bodyLines.join('\n\n')}`
    } : null);

    return (
      <Card className="border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            Attorney Confirmation Received
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold text-lg">Confirmed</p>
              </div>
              <Badge className="bg-green-600 text-white">Confirmed</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date/time</p>
              <p className="font-medium">
                {receiptData ? new Date(receiptData.confirmedAt).toLocaleString() : (attorneyAttestedAt ? new Date(attorneyAttestedAt).toLocaleString() : '')}
              </p>
            </div>
            {receipt && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">What was confirmed</p>
                <p className="text-sm">
                  Attorney confirmed client relationship and authorization to access Protected Health Information (PHI) for this case.
                </p>
              </div>
            )}
          </div>

          {receipt && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
              {receipt.confirmed_by && (
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed by</p>
                  <p className="font-medium">{receipt.confirmed_by}</p>
                </div>
              )}
              {receipt.attestation_text && (
                <div>
                  <h4 className="font-semibold mb-3">Attestation Text</h4>
                  <div className="text-sm space-y-2 whitespace-pre-line">
                    {receipt.attestation_text.split('\n\n').map((paragraph, idx) => (
                      <p key={idx} className={paragraph.includes('**') ? 'font-bold' : ''}>
                        {paragraph.replace(/\*\*/g, '')}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={onAttestationComplete}
              className="flex-1"
              variant="default"
            >
              Continue to Case
            </Button>
            <Button
              onClick={() => {
                if (!receipt) {
                  toast.error("Receipt data not available");
                  return;
                }
                openConfirmationPrintWindow(caseId, intakeId, receipt);
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Confirmation
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (resolved === "DECLINED") {
    return (
      <Card className="border-amber-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            Declined
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-900">
              Marked as not my client. Intake access is disabled.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

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
      toast.error('User not authenticated');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get session token for RLS-protected queries
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const now = new Date().toISOString();
      let attorneyId: string = user.email || user.id;
      
      // Get attorney ID using direct fetch with access token
      try {
        const rcUsers = await supabaseFetch('rc_users', `select=id&auth_user_id=eq.${user.id}&role=eq.attorney&limit=1`, accessToken);
        const rcUser = Array.isArray(rcUsers) ? rcUsers[0] : rcUsers;
        if (rcUser?.id) {
          attorneyId = rcUser.id;
        }
      } catch (err) {
        console.log('Using fallback attorney identifier');
      }

      // Fetch current intake_json using direct fetch with access token
      const intakes = await supabaseFetch('rc_client_intakes', `select=id,case_id,intake_json&id=eq.${intakeId}&limit=1`, accessToken);
      const currentIntake = Array.isArray(intakes) ? intakes[0] : intakes;

      if (!currentIntake) {
        throw new Error('Intake not found');
      }

      // Build receipt for "confirmed"
      const receipt = {
        action: "CONFIRMED",
        confirmed_at: now,
        confirmed_by: attorneyId,
        attestation_text: `${COMPLIANCE_COPY.attorneyAttestation.title}\n\n${COMPLIANCE_COPY.attorneyAttestation.bodyLines.join('\n\n')}`
      };

      // Merge receipt and attorney_attestation into intake_json
      const existingIntakeJson = (currentIntake?.intake_json as Record<string, any>) || {};
      const updatedIntakeJson = {
        ...existingIntakeJson,
        compliance: {
          ...(existingIntakeJson?.compliance || {}),
          attorney_confirmation_receipt: receipt
        },
        attorney_attestation: {
          status: 'confirmed',
          confirmed_at: now,
        },
      };

      // Update ALL required fields in a single update using direct fetch with access token
      await supabaseUpdate('rc_client_intakes', `id=eq.${intakeId}`, {
        attorney_attested_at: now,
        attorney_confirm_deadline_at: null,
        intake_status: 'attorney_confirmed',
        intake_json: updatedIntakeJson,
      }, accessToken);

      // Success - show success message and refresh
      // The UI will update based on the refreshed attorneyAttestedAt value
      toast.success('Client relationship confirmed.');
      onAttestationComplete();
    } catch (error: any) {
      console.error('Attestation error', error);
      const errorMsg = error.code ? `${error.code} ${error.message || ''}` : (error.message || 'Failed to submit attestation');
      toast.error(errorMsg.trim() || 'Failed to submit attestation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotMyClient = async () => {
    if (!user) {
      return;
    }

    setShowNotMyClientDialog(false);
    setIsSubmitting(true);

    try {
      // Get session token for RLS-protected queries
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const now = new Date().toISOString();
      let attorneyId: string = user.email || user.id;
      
      try {
        const rcUsers = await supabaseFetch('rc_users', `select=id&auth_user_id=eq.${user.id}&role=eq.attorney&limit=1`, accessToken);
        const rcUser = Array.isArray(rcUsers) ? rcUsers[0] : rcUsers;
        if (rcUser?.id) {
          attorneyId = rcUser.id;
        }
      } catch (err) {
        console.log('Using fallback attorney identifier');
      }

      // Fetch current intake_json using direct fetch with access token
      const intakes = await supabaseFetch('rc_client_intakes', `select=id,case_id,intake_json&id=eq.${intakeId}&limit=1`, accessToken);
      const currentIntake = Array.isArray(intakes) ? intakes[0] : intakes;

      if (!currentIntake) {
        throw new Error('Intake not found');
      }

      // Build receipt for "not my client"
      const receipt = {
        action: "NOT_MY_CLIENT",
        confirmed_at: now,
        confirmed_by: attorneyId,
        attestation_text: ""
      };

      // Merge receipt and attorney_attestation into intake_json
      const existingIntakeJson = (currentIntake?.intake_json as Record<string, any>) || {};
      const updatedIntakeJson = {
        ...existingIntakeJson,
        compliance: {
          ...(existingIntakeJson?.compliance || {}),
          attorney_confirmation_receipt: receipt
        },
        attorney_attestation: {
          status: 'declined_not_client',
          declined_at: now,
        },
      };

      // Update intake: set status, clear deadline, do NOT set attorney_attested_at
      await supabaseUpdate('rc_client_intakes', `id=eq.${intakeId}`, {
        intake_status: 'attorney_declined_not_client',
        attorney_confirm_deadline_at: null,
        intake_json: updatedIntakeJson,
      }, accessToken);

      // 5. Notify parent of resolution to stop countdown
      if (onResolved) {
        onResolved("DECLINED", now, updatedIntakeJson);
      }

      toast.info('Marked as not my client.');
      onAttestationComplete();
    } catch (error: any) {
      console.error('Error marking as not my client:', error);
      toast.error(error.message || 'Failed to update');
    } finally {
      setIsSubmitting(false);
    }
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
            {COMPLIANCE_COPY.attorneyAttestation.bodyLines.map((line, idx) => {
              // Check if this is the bolded deletion clause (starts with **)
              const isBold = line.startsWith('**') && line.endsWith('**');
              const text = isBold ? line.slice(2, -2) : line;
              
              return (
                <p 
                  key={idx} 
                  className={`text-sm leading-relaxed ${isBold ? 'font-bold' : ''}`}
                >
                  {text}
                </p>
              );
            })}
          </div>

          {/* Countdown timer - only show when not resolved */}
          {shouldShowCountdown && (
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
          )}

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