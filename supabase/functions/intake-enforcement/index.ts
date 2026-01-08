/**
 * Intake Enforcement Edge Function
 * 
 * SCHEDULING: Configure this function to run every 5-10 minutes via Supabase Scheduled Functions.
 * Example cron: "*/5 * * * *" (every 5 minutes) or "*/10 * * * *" (every 10 minutes)
 * 
 * PURPOSE:
 * - Enforces 48-hour attorney confirmation window for submitted intakes
 * - Sends reminders at 24h, 8h, 4h, 1h remaining to both client and attorney
 * - Permanently deletes PHI and creates tombstone records when deadline expires
 * - Uses rc_notification_log to prevent duplicate sends
 * 
 * ENVIRONMENT VARIABLES:
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for admin operations
 * - RESEND_API_KEY: (Optional) API key for email sending via Resend
 * - CRON_SECRET: (Optional) Secret for scheduled function invocation
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Reminder thresholds in hours (must match constants from compliance.ts)
const REMINDER_THRESHOLDS_HOURS = [24, 8, 4, 1];

interface PendingIntake {
  id: string;
  case_id: string;
  intake_submitted_at: string;
  attorney_confirm_deadline_at: string;
  attorney_attested_at: string | null;
  intake_status: string;
  intake_json: any;
  // Joined from rc_cases
  client_id?: string;
  attorney_id?: string;
}

interface NotificationResult {
  sent: boolean;
  channel: string;
  error?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Optional: Verify cron secret if provided
    const authHeader = req.headers.get("authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[intake-enforcement] Starting enforcement job...");

    // Step 1: Find all pending intakes that need processing
    // Query for intakes that could need reminders OR expiration:
    // - intake_status === 'submitted_pending_attorney'
    // - attorney_attested_at IS NULL
    // - attorney_confirm_deadline_at IS NOT NULL
    // We'll check expiration and reminder thresholds in the loop below
    const { data: pendingIntakes, error: queryError } = await supabase
      .from("rc_client_intakes")
      .select(`
        id,
        case_id,
        intake_submitted_at,
        attorney_confirm_deadline_at,
        attorney_attested_at,
        intake_status,
        intake_json,
        rc_cases!inner (
          client_id,
          attorney_id
        )
      `)
      .eq("intake_status", "submitted_pending_attorney")
      .is("attorney_attested_at", null)
      .not("intake_submitted_at", "is", null)
      .not("attorney_confirm_deadline_at", "is", null);

    if (queryError) {
      console.error("[intake-enforcement] Error querying pending intakes:", queryError);
      throw new Error(`Failed to query pending intakes: ${queryError.message}`);
    }

    if (!pendingIntakes || pendingIntakes.length === 0) {
      console.log("[intake-enforcement] No pending intakes found");
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          expired: 0,
          reminders_sent: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[intake-enforcement] Found ${pendingIntakes.length} pending intake(s)`);

    const now = new Date();
    let expiredCount = 0;
    let remindersSentCount = 0;

    // Step 2: Process each pending intake
    for (const intake of pendingIntakes) {
      try {
        // Flatten the joined case data (handle both array and object responses)
        let caseData: any = null;
        if (intake.rc_cases) {
          caseData = Array.isArray(intake.rc_cases) ? intake.rc_cases[0] : intake.rc_cases;
        }
        const clientId = caseData?.client_id;
        const attorneyId = caseData?.attorney_id || (typeof intake.attorney_id === 'string' ? intake.attorney_id : undefined);

        // Double-check expiration (already filtered in query, but verify)
        const deadlineDate = new Date(intake.attorney_confirm_deadline_at);
        const msRemaining = deadlineDate.getTime() - now.getTime();

        // Only expire if still in pending status, not attested, and deadline passed
        // (These should already be filtered by the query, but verify for safety)
        const shouldExpire = 
          intake.intake_status === 'submitted_pending_attorney' &&
          !intake.attorney_attested_at &&
          msRemaining <= 0;

        if (shouldExpire) {
          console.log(`[intake-enforcement] Intake ${intake.id} has expired, processing deletion...`);
          
          // Handle expiry: create tombstone, scrub PHI, send expired notices
          await handleExpiredIntake(supabase, intake, clientId, attorneyId);
          expiredCount++;
        } else {
          // Handle reminders at thresholds
          const remindersSent = await handleReminders(
            supabase,
            intake,
            msRemaining,
            clientId,
            attorneyId
          );
          remindersSentCount += remindersSent;
        }
      } catch (error) {
        console.error(`[intake-enforcement] Error processing intake ${intake.id}:`, error);
        // Continue processing other intakes even if one fails
      }
    }

    console.log(`[intake-enforcement] Job complete. Expired: ${expiredCount}, Reminders sent: ${remindersSentCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingIntakes.length,
        expired: expiredCount,
        reminders_sent: remindersSentCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[intake-enforcement] Fatal error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Handle expired intake: create tombstone, scrub PHI, send expired notices
 */
async function handleExpiredIntake(
  supabase: any,
  intake: PendingIntake,
  clientId: string | undefined,
  attorneyId: string | undefined
) {
  const now = new Date().toISOString();

  // Step 1: Create tombstone record with non-PHI audit data
  const { error: tombstoneError } = await supabase
    .from("rc_intake_tombstones")
    .insert({
      intake_id: intake.id,
      case_id: intake.case_id,
      attorney_id: attorneyId,
      client_id: clientId,
      intake_submitted_at: intake.intake_submitted_at,
      attorney_confirm_deadline_at: intake.attorney_confirm_deadline_at,
      attorney_attested_at: intake.attorney_attested_at,
      deleted_at: now,
      reason: "attorney_not_confirmed",
    });

  if (tombstoneError) {
    console.error(`[intake-enforcement] Failed to create tombstone for intake ${intake.id}:`, tombstoneError);
    // Continue anyway - tombstone failure shouldn't block deletion
  } else {
    console.log(`[intake-enforcement] Created tombstone for intake ${intake.id}`);
  }

  // Step 2: Scrub PHI from intake record
  // Set status to expired, mark as deleted, and clear PHI fields
  const { error: scrubError } = await supabase
    .from("rc_client_intakes")
    .update({
      intake_status: "expired_deleted",
      deleted_at: now,
      deletion_reason: "attorney_not_confirmed",
      // Scrub PHI: clear intake_json (contains all PHI data)
      intake_json: {},
    })
    .eq("id", intake.id);

  if (scrubError) {
    console.error(`[intake-enforcement] Failed to scrub PHI for intake ${intake.id}:`, scrubError);
    throw new Error(`Failed to scrub PHI: ${scrubError.message}`);
  }

  console.log(`[intake-enforcement] Scrubbed PHI for intake ${intake.id}`);

  // Step 3: Send expired notices to both parties (deduped)
  await sendExpiredNotices(supabase, intake.id, intake.case_id, clientId, attorneyId);
}

/**
 * Handle reminder notifications at threshold intervals
 */
async function handleReminders(
  supabase: any,
  intake: PendingIntake,
  msRemaining: number,
  clientId: string | undefined,
  attorneyId: string | undefined
): Promise<number> {
  const hoursRemaining = msRemaining / (1000 * 60 * 60);
  let remindersSent = 0;

  // Check each threshold
  for (const thresholdHours of REMINDER_THRESHOLDS_HOURS) {
    // Only send if we're at or past the threshold
    if (hoursRemaining <= thresholdHours) {
      // Check if we've already sent this threshold notification for attorney
      const attorneyAlreadySent = await checkNotificationSent(
        supabase,
        intake.id,
        `attorney_${thresholdHours}h`,
        "attorney"
      );
      
      // Check if we've already sent this threshold notification for client
      const clientAlreadySent = await checkNotificationSent(
        supabase,
        intake.id,
        `client_${thresholdHours}h`,
        "client"
      );

      // Send to attorney if not already sent
      if (!attorneyAlreadySent) {
        const attorneySent = await sendNotification(
          supabase,
          {
            intakeId: intake.id,
            caseId: intake.case_id,
            recipientId: attorneyId,
            recipientType: "attorney",
            templateKey: `attorney_${thresholdHours}h`,
            hoursRemaining,
          }
        );

        if (attorneySent) remindersSent++;
      }

      // Send to client if not already sent
      if (!clientAlreadySent) {
        const clientSent = await sendNotification(
          supabase,
          {
            intakeId: intake.id,
            caseId: intake.case_id,
            recipientId: clientId,
            recipientType: "client",
            templateKey: `client_${thresholdHours}h`,
            hoursRemaining,
          }
        );

        if (clientSent) remindersSent++;
      }
    }
  }

  return remindersSent;
}

/**
 * Send expired notices to attorney and client
 */
async function sendExpiredNotices(
  supabase: any,
  intakeId: string,
  caseId: string,
  clientId: string | undefined,
  attorneyId: string | undefined
) {
  // Send to attorney (if not already sent)
  const attorneyAlreadySent = await checkNotificationSent(
    supabase,
    intakeId,
    "attorney_expired",
    "attorney"
  );

  if (!attorneyAlreadySent) {
    await sendNotification(
      supabase,
      {
        intakeId,
        caseId,
        recipientId: attorneyId,
        recipientType: "attorney",
        templateKey: "attorney_expired",
        hoursRemaining: 0,
      }
    );
  }

  // Send to client (if not already sent)
  const clientAlreadySent = await checkNotificationSent(
    supabase,
    intakeId,
    "client_expired",
    "client"
  );

  if (!clientAlreadySent) {
    await sendNotification(
      supabase,
      {
        intakeId,
        caseId,
        recipientId: clientId,
        recipientType: "client",
        templateKey: "client_expired",
        hoursRemaining: 0,
      }
    );
  }
}

/**
 * Check if a notification has already been sent for a specific recipient type (deduplication)
 */
async function checkNotificationSent(
  supabase: any,
  intakeId: string,
  templateKey: string,
  recipientType: "attorney" | "client"
): Promise<boolean> {
  const dedupeKey = `intake:${intakeId}:${recipientType}:${templateKey}`;

  const { data, error } = await supabase
    .from("rc_notification_log")
    .select("id")
    .eq("dedupe_key", dedupeKey)
    .limit(1);

  if (error) {
    console.error(`[intake-enforcement] Error checking notification log:`, error);
    // If we can't check, assume not sent to be safe (will attempt send and fail gracefully)
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Send a notification (email if configured, otherwise log-only)
 * Always writes to rc_notification_log for audit trail
 */
async function sendNotification(
  supabase: any,
  params: {
    intakeId: string;
    caseId: string;
    recipientId: string | undefined;
    recipientType: "attorney" | "client";
    templateKey: string;
    hoursRemaining: number;
  }
): Promise<boolean> {
  const { intakeId, caseId, recipientId, recipientType, templateKey, hoursRemaining } = params;

  if (!recipientId) {
    console.log(`[intake-enforcement] No ${recipientType} ID for intake ${intakeId}, skipping notification`);
    return false;
  }

  // Get recipient email address
  let recipientEmail: string | null = null;

  if (recipientType === "client") {
    // Get client email from rc_clients
    const { data: clientData } = await supabase
      .from("rc_clients")
      .select("email")
      .eq("id", recipientId)
      .single();

    recipientEmail = clientData?.email || null;
  } else if (recipientType === "attorney") {
    // Get attorney email (may need to go through rc_users -> auth.users)
    // For MVP, try to get from rc_users first
    const { data: userData } = await supabase
      .from("rc_users")
      .select("auth_user_id")
      .eq("id", recipientId)
      .eq("role", "attorney")
      .single();

    if (userData?.auth_user_id) {
      // Try to get email from auth.users (may require admin access)
      // For MVP fallback, we'll just log if we can't get email
      // In production, you might want to store email in rc_users or use a service role query
      console.log(`[intake-enforcement] Attorney ${recipientId} auth_user_id: ${userData.auth_user_id}`);
      // Note: Getting email from auth.users requires admin API access
      // For MVP, we'll rely on logging if email is not directly available
    }
  }

  const dedupeKey = `intake:${intakeId}:${recipientType}:${templateKey}`;
  const channel = "inapp"; // MVP default, can be 'email' or 'sms' if configured

  // Try to send email if Resend is configured and email is available
  let emailSent = false;
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (resendApiKey && recipientEmail) {
    try {
      emailSent = await sendEmailViaResend(resendApiKey, recipientEmail, templateKey, hoursRemaining);
      if (emailSent) {
        console.log(`[intake-enforcement] Email sent to ${recipientEmail} for intake ${intakeId}`);
      }
    } catch (error) {
      console.error(`[intake-enforcement] Failed to send email to ${recipientEmail}:`, error);
      // Continue to log notification even if email fails
    }
  } else {
    // Log-only mode (MVP fallback)
    console.log(
      `[intake-enforcement] Notification ${templateKey} for ${recipientType} ${recipientId} ` +
      `(email: ${recipientEmail || "not available"}, Resend: ${resendApiKey ? "configured" : "not configured"})`
    );
  }

  // Always write to notification log (even if email failed or not configured)
  const { error: logError } = await supabase
    .from("rc_notification_log")
    .insert({
      intake_id: intakeId,
      case_id: caseId,
      attorney_id: recipientType === "attorney" ? recipientId : null,
      client_id: recipientType === "client" ? recipientId : null,
      channel: emailSent ? "email" : channel,
      template_key: templateKey,
      sent_at: new Date().toISOString(),
      dedupe_key: dedupeKey,
    });

  if (logError) {
    console.error(`[intake-enforcement] Failed to log notification ${dedupeKey}:`, logError);
    // Don't throw - logging failure shouldn't break the job
    return false;
  }

  // Update last_notified_at on intake record
  await supabase
    .from("rc_client_intakes")
    .update({ last_notified_at: new Date().toISOString() })
    .eq("id", intakeId);

  return true;
}

/**
 * Send email via Resend API
 */
async function sendEmailViaResend(
  apiKey: string,
  to: string,
  templateKey: string,
  hoursRemaining: number
): Promise<boolean> {
  try {
    const subject = getEmailSubject(templateKey, hoursRemaining);
    const html = getEmailBody(templateKey, hoursRemaining);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "RCMS C.A.R.E. <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${response.status} ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error("[intake-enforcement] Resend email error:", error);
    return false;
  }
}

/**
 * Get email subject based on template key
 */
function getEmailSubject(templateKey: string, hoursRemaining: number): string {
  if (templateKey.includes("expired")) {
    return "⚠️ Intake Expired - Action Required";
  }

  const hours = Math.floor(hoursRemaining);
  if (templateKey.includes("attorney")) {
    return `⏰ Attorney Confirmation Reminder - ${hours}h Remaining`;
  } else {
    return `⏰ Intake Confirmation Reminder - ${hours}h Remaining`;
  }
}

/**
 * Get email body based on template key
 */
function getEmailBody(templateKey: string, hoursRemaining: number): string {
  const hours = Math.floor(hoursRemaining);
  const isExpired = hoursRemaining <= 0;

  if (isExpired) {
    return `
      <h1>Intake Expired</h1>
      <p>The 48-hour confirmation window has expired.</p>
      <p>All client intake data has been permanently deleted and the intake process must be restarted.</p>
      <p>Please contact RCMS support if you need assistance.</p>
    `;
  }

  if (templateKey.includes("attorney")) {
    return `
      <h1>Attorney Confirmation Reminder</h1>
      <p>You have <strong>${hours} hours</strong> remaining to confirm this intake.</p>
      <p>If you do not confirm within this window, all intake data will be permanently deleted and the intake process must start again.</p>
      <p>Please confirm the intake as soon as possible.</p>
    `;
  } else {
    return `
      <h1>Intake Confirmation Reminder</h1>
      <p>Your attorney has <strong>${hours} hours</strong> remaining to confirm your intake.</p>
      <p>If your attorney does not confirm within this window, all intake data will be permanently deleted and you will need to restart the intake process.</p>
      <p>Please contact your attorney if you have questions.</p>
    `;
  }
}