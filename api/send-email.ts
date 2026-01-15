import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * API: POST /api/send-email
 * Handles email sending for Reconcile C.A.R.E. using Resend
 * 
 * Body: {
 *   type: "intake-resume" | "case-credentials",
 *   to: string,
 *   intNumber?: string,
 *   resumeUrl?: string,
 *   caseId?: string,
 *   clientPin?: string,
 *   clientLoginUrl?: string,
 *   baseUrl?: string
 * }
 */

interface EmailRequest {
  type: "intake-resume" | "case-credentials";
  to: string;
  intNumber?: string;
  resumeUrl?: string;
  caseId?: string;
  clientPin?: string;
  clientLoginUrl?: string;
  baseUrl?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload: EmailRequest = req.body;
    console.log("[send-email] Received:", payload);

    const { type, to, intNumber, resumeUrl, caseId, clientPin, clientLoginUrl, baseUrl } = payload;

    if (!to) {
      return res.status(400).json({ ok: false, error: "Recipient email address is required" });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return res.status(500).json({ ok: false, error: "RESEND_API_KEY is not configured" });
    }

    let result;

    switch (type) {
      case "intake-resume":
        if (!intNumber || !resumeUrl) {
          return res.status(400).json({ ok: false, error: "intNumber and resumeUrl are required for intake-resume email" });
        }
        result = await sendIntakeResumeEmail(to, intNumber, resumeUrl, baseUrl, resendApiKey);
        break;

      case "case-credentials":
        if (!caseId || !clientPin || !clientLoginUrl) {
          return res.status(400).json({ ok: false, error: "caseId, clientPin, and clientLoginUrl are required for case-credentials email" });
        }
        result = await sendCaseCredentialsEmail(to, caseId, clientPin, clientLoginUrl, baseUrl, resendApiKey);
        break;

      default:
        return res.status(400).json({ ok: false, error: `Unknown email type: ${type}` });
    }

    console.log("[send-email] Success:", result);

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({ ok: true, result });
  } catch (error: any) {
    console.error("[send-email] Error:", error);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ ok: false, error: error.message || "Unknown error" });
  }
}

// =================== Email Sending Functions ===================

/**
 * Send intake resume email to client
 */
async function sendIntakeResumeEmail(
  to: string,
  intNumber: string,
  resumeUrl: string,
  baseUrl: string | undefined,
  resendApiKey: string
) {
  console.log(`[sendIntakeResumeEmail] Sending to ${to} for INT ${intNumber}`);
  
  const fromEmail = "Reconcile C.A.R.E. <noreply@rcmspllc.com>";
  // Fallback to Resend default for testing if domain not verified
  const useDefaultFrom = !process.env.RESEND_VERIFIED_DOMAIN;
  
  const emailBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0f2a6a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #ff8c42; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Resume Your Reconcile C.A.R.E. Intake</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You saved your intake progress. You can resume at any time using the link below.</p>
          <p><strong>Your INT Number:</strong> ${intNumber}</p>
          <p style="text-align: center;">
            <a href="${resumeUrl}" class="button">Resume Intake</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0066cc;">${resumeUrl}</p>
          <p>This link will remain valid for 7 days.</p>
        </div>
        <div class="footer">
          <p>Reconcile C.A.R.E. - Care Management Platform</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: useDefaultFrom ? "onboarding@resend.dev" : fromEmail,
      to: [to],
      subject: "Resume Your Reconcile C.A.R.E. Intake",
      html: emailBody,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to send email: ${response.status} ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  
  return {
    message: "Intake resume email sent",
    to,
    intNumber,
    resumeUrl,
    resendId: data.id,
  };
}

/**
 * Send case credentials email to client after attorney attestation
 */
async function sendCaseCredentialsEmail(
  to: string,
  caseId: string,
  clientPin: string,
  clientLoginUrl: string,
  baseUrl: string | undefined,
  resendApiKey: string
) {
  console.log(`[sendCaseCredentialsEmail] Sending to ${to} for case ${caseId}`);
  
  const fromEmail = "Reconcile C.A.R.E. <noreply@rcmspllc.com>";
  // Fallback to Resend default for testing if domain not verified
  const useDefaultFrom = !process.env.RESEND_VERIFIED_DOMAIN;
  
  const emailBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0f2a6a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .credentials { background-color: white; border: 2px solid #0f2a6a; border-radius: 5px; padding: 15px; margin: 20px 0; }
        .credential-item { margin: 10px 0; }
        .credential-label { font-weight: bold; color: #0f2a6a; }
        .credential-value { font-size: 18px; font-family: monospace; color: #333; margin-top: 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #ff8c42; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Reconcile C.A.R.E. Case Access</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Your attorney has confirmed your case. You now have access to your Reconcile C.A.R.E. client portal.</p>
          
          <div class="credentials">
            <div class="credential-item">
              <div class="credential-label">Case ID:</div>
              <div class="credential-value">${caseId}</div>
            </div>
            <div class="credential-item">
              <div class="credential-label">PIN:</div>
              <div class="credential-value">${clientPin}</div>
            </div>
          </div>

          <div class="warning">
            <strong>Important:</strong> Please save your Case ID and PIN in a secure location. You will need these to access your client portal.
          </div>

          <p style="text-align: center;">
            <a href="${clientLoginUrl}" class="button">Access Client Portal</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0066cc;">${clientLoginUrl}</p>
        </div>
        <div class="footer">
          <p>Reconcile C.A.R.E. - Care Management Platform</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: useDefaultFrom ? "onboarding@resend.dev" : fromEmail,
      to: [to],
      subject: "Your Reconcile C.A.R.E. Case Access",
      html: emailBody,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to send email: ${response.status} ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  
  return {
    message: "Case credentials email sent",
    to,
    caseId,
    clientPin,
    clientLoginUrl,
    resendId: data.id,
  };
}
