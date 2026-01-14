// src/lib/intakeEmailService.ts
// Service for sending resume intake emails

export interface SendResumeEmailParams {
  email: string;
  firstName: string;
  lastName: string;
  resumeToken: string;
  intakeId: string;
}

/**
 * Send resume intake email with secure token link
 * Uses existing email infrastructure or dev stub
 */
export async function sendResumeEmail(params: SendResumeEmailParams): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  // Build resume URL
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : supabaseUrl.replace('/rest/v1', '');
  const resumeUrl = `${baseUrl}/resume-intake?token=${params.resumeToken}`;

  // Try to use existing email function (send-notification)
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'intake_resume',
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
        resumeUrl,
        intakeId: params.intakeId,
      }),
    });

    if (response.ok) {
      console.log('Resume email sent via send-notification function');
      return;
    }
  } catch (error) {
    console.warn('Failed to send via send-notification, using dev stub:', error);
  }

  // Dev stub: log to console (structure for easy swap to real email later)
  console.log('=== RESUME INTAKE EMAIL (DEV STUB) ===');
  console.log('To:', params.email);
  console.log('Subject: Resume Your Intake - ' + params.intakeId);
  console.log('Body:');
  console.log(`Hi ${params.firstName} ${params.lastName},`);
  console.log('');
  console.log('Your intake has been saved. You can resume at any time using the link below:');
  console.log('');
  console.log('Resume Link:', resumeUrl);
  console.log('');
  console.log('Your Intake ID: ' + params.intakeId);
  console.log('');
  console.log('This link will remain active for 7 days.');
  console.log('=== END EMAIL ===');

  // In production, swap this with real email service (Resend, SendGrid, etc.)
  // The structure is ready - just replace the console.log with actual email sending
}
