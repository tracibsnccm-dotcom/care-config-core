// supabase/functions/send-notification/index.ts
// Handles all email/notification sending for RCMS C.A.R.E.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
  
  // TODO: Integrate with email service (Resend, SendGrid, etc.)
  // For now, just log the action
  
  return {
    message: "Nudge email queued",
    email,
    caseId: caseData.id,
    // In production, return actual email service response
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
  
  // TODO: Integrate with scheduling service or use pg_cron
  // For now, just log the action
  
  return {
    message: "Reminder emails scheduled",
    email,
    phone,
    caseId: caseData.id,
    days,
    // In production, return actual scheduling service response
  };
}

/**
 * Send intake expiration notification
 */
async function sendExpiredNotification(email: string, caseData: any) {
  console.log(`[notifyExpired] Sending to ${email} for case ${caseData.id}`);
  
  // TODO: Integrate with email service
  // For now, just log the action
  
  return {
    message: "Expiration notification sent",
    email,
    caseId: caseData.id,
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
  
  // TODO: Integrate with email service
  // Notify RN_CCM role users about new dossier request
  
  return {
    message: "Dossier commission notification sent",
    attorneyEmail,
    clientLabel,
    caseId: caseData.id,
  };
}
