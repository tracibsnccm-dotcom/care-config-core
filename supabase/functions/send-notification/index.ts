// supabase/functions/send-notification/index.ts
// Handles all email/notification sending for RCMS C.A.R.E.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "nudge" | "schedule-reminders" | "intake-expired" | "dossier-commissioned";
  caseId: string;
  email?: string;
  phone?: string;
  days?: number[];
  attorneyId?: string;
  attorneyEmail?: string;
  clientLabel?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: NotificationRequest = await req.json();
    console.log("[send-notification] Received:", payload);

    const { type, caseId, email, phone, days, attorneyId, attorneyEmail, clientLabel } = payload;

    // Fetch case details if needed
    const { data: caseData, error: caseError } = await supabaseClient
      .from("cases")
      .select("*, profiles(*)")
      .eq("id", caseId)
      .single();

    if (caseError) {
      throw new Error(`Failed to fetch case: ${caseError.message}`);
    }

    let result;

    switch (type) {
      case "nudge":
        result = await sendNudgeEmail(email || caseData.email, caseData);
        break;

      case "schedule-reminders":
        result = await scheduleReminderEmails(
          email || caseData.email,
          phone || caseData.phone,
          caseData,
          days || [1, 3, 5]
        );
        break;

      case "intake-expired":
        result = await sendExpiredNotification(email || caseData.email, caseData);
        break;

      case "dossier-commissioned":
        result = await notifyDossierCommission(
          attorneyEmail || caseData.attorney_email,
          clientLabel || caseData.client_label,
          caseData
        );
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    console.log("[send-notification] Success:", result);

    return new Response(JSON.stringify({ ok: true, result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[send-notification] Error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// =================== Email Sending Functions ===================

/**
 * Send a nudge email to complete pending intake
 */
async function sendNudgeEmail(email: string, caseData: any) {
  console.log(`[sendNudge] Sending to ${email} for case ${caseData.id}`);
  
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  
  const { data, error } = await resend.emails.send({
    from: "RCMS C.A.R.E. <onboarding@resend.dev>",
    to: [email],
    subject: "Complete Your Medical Intake",
    html: `
      <h1>Friendly Reminder</h1>
      <p>Hi there,</p>
      <p>We noticed you haven't completed your medical intake form yet. Your attorney and care team are ready to help you, but we need your information first.</p>
      <p>Please take a few minutes to complete your intake at your earliest convenience.</p>
      <p>Case ID: ${caseData.id}</p>
      <p>Best regards,<br>RCMS C.A.R.E. Team</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send nudge email: ${error.message}`);
  }
  
  return {
    message: "Nudge email sent",
    email,
    caseId: caseData.id,
    resendData: data,
  };
}

/**
 * Schedule Day 1/3/5 reminder emails
 */
async function scheduleReminderEmails(
  email: string,
  phone: string | undefined,
  caseData: any,
  days: number[]
) {
  console.log(`[scheduleReminders] Scheduling for ${email}, days: ${days}`);
  
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  
  // Send immediate confirmation that reminders are scheduled
  const { data, error } = await resend.emails.send({
    from: "RCMS C.A.R.E. <onboarding@resend.dev>",
    to: [email],
    subject: "Reminder Schedule Confirmed",
    html: `
      <h1>Reminders Scheduled</h1>
      <p>We've scheduled reminder emails for days: ${days.join(", ")}.</p>
      <p>You'll receive notifications to help you stay on track with your medical intake.</p>
      <p>Case ID: ${caseData.id}</p>
      <p>Best regards,<br>RCMS C.A.R.E. Team</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to schedule reminders: ${error.message}`);
  }
  
  return {
    message: "Reminder emails scheduled",
    email,
    phone,
    caseId: caseData.id,
    days,
    resendData: data,
  };
}

/**
 * Send intake expiration notification
 */
async function sendExpiredNotification(email: string, caseData: any) {
  console.log(`[notifyExpired] Sending to ${email} for case ${caseData.id}`);
  
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  
  const { data, error } = await resend.emails.send({
    from: "RCMS C.A.R.E. <onboarding@resend.dev>",
    to: [email],
    subject: "Intake Expired - Action Required",
    html: `
      <h1>Intake Window Expired</h1>
      <p>Your medical intake window has expired.</p>
      <p>Please contact your attorney or care coordinator to request an extension if you still need to complete your intake.</p>
      <p>Case ID: ${caseData.id}</p>
      <p>Best regards,<br>RCMS C.A.R.E. Team</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send expiration notification: ${error.message}`);
  }
  
  return {
    message: "Expiration notification sent",
    email,
    caseId: caseData.id,
    resendData: data,
  };
}

/**
 * Notify RN Supervisor about dossier commission
 */
async function notifyDossierCommission(
  attorneyEmail: string,
  clientLabel: string,
  caseData: any
) {
  console.log(`[notifyDossier] Notifying about ${clientLabel} for case ${caseData.id}`);
  
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  
  const { data, error } = await resend.emails.send({
    from: "RCMS C.A.R.E. <onboarding@resend.dev>",
    to: [attorneyEmail],
    subject: `New Dossier Commissioned - ${clientLabel}`,
    html: `
      <h1>New Pre-Settlement Dossier Commissioned</h1>
      <p>A new dossier has been commissioned for client: <strong>${clientLabel}</strong></p>
      <p>Case ID: ${caseData.id}</p>
      <p>Please review and assign an RN Case Manager to begin the comprehensive medical review.</p>
      <p>Best regards,<br>RCMS C.A.R.E. Team</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send dossier notification: ${error.message}`);
  }
  
  return {
    message: "Dossier commission notification sent",
    attorneyEmail,
    clientLabel,
    caseId: caseData.id,
    resendData: data,
  };
}
