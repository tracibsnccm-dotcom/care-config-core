import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Checking diary entry reminders and escalations...");

    // Get all pending and in_progress entries with reminders enabled
    const { data: entries, error: entriesError } = await supabase
      .from("rn_diary_entries")
      .select(`
        id,
        title,
        entry_type,
        scheduled_date,
        scheduled_time,
        reminder_enabled,
        reminder_minutes_before,
        priority,
        shared_with_supervisor,
        rn_id,
        case_id,
        completion_status,
        created_at,
        metadata
      `)
      .in("completion_status", ["pending", "in_progress"])
      .eq("reminder_enabled", true)
      .order("scheduled_date", { ascending: true });

    if (entriesError) throw entriesError;

    console.log(`Found ${entries?.length || 0} entries with reminders enabled`);

    const now = new Date();
    const notificationsSent: string[] = [];
    const escalationsSent: string[] = [];

    for (const entry of entries || []) {
      const scheduledDateTime = new Date(`${entry.scheduled_date}T${entry.scheduled_time || "00:00"}:00`);
      const reminderTime = new Date(scheduledDateTime.getTime() - (entry.reminder_minutes_before || 60) * 60000);
      const minutesUntilScheduled = Math.floor((scheduledDateTime.getTime() - now.getTime()) / 60000);
      const minutesOverdue = Math.floor((now.getTime() - scheduledDateTime.getTime()) / 60000);

      // Get RN details
      const { data: rnProfile } = await supabase
        .from("profiles")
        .select("email, display_name")
        .eq("user_id", entry.rn_id)
        .single();

      if (!rnProfile?.email) {
        console.log(`No email found for RN ${entry.rn_id}, skipping...`);
        continue;
      }

      // Check if reminder already sent
      const metadata = entry.metadata || {};
      if (metadata.reminder_sent_at) {
        const sentAt = new Date(metadata.reminder_sent_at);
        const hoursSinceSent = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceSent < 1) {
          continue; // Skip if reminder sent in last hour
        }
      }

      // Send reminder if within reminder window
      if (now >= reminderTime && minutesUntilScheduled > 0) {
        try {
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Lovable Health <notifications@resend.dev>",
              to: [rnProfile.email],
              subject: `⏰ Reminder: ${entry.title} in ${minutesUntilScheduled} minutes`,
              html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Upcoming Diary Entry</h2>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">${entry.title}</h3>
                  <p><strong>Type:</strong> ${entry.entry_type}</p>
                  <p><strong>Scheduled:</strong> ${scheduledDateTime.toLocaleString()}</p>
                  <p><strong>Priority:</strong> ${entry.priority}</p>
                  <p><strong>Starting in:</strong> ${minutesUntilScheduled} minutes</p>
                </div>
                <p>Please prepare for this scheduled entry.</p>
              </div>
            `
            }),
          });

          if (!emailResponse.ok) {
            throw new Error(`Resend API error: ${await emailResponse.text()}`);
          }

          // Update metadata to mark reminder as sent
          await supabase
            .from("rn_diary_entries")
            .update({
              metadata: { ...metadata, reminder_sent_at: now.toISOString() }
            })
            .eq("id", entry.id);

          notificationsSent.push(entry.id);
          console.log(`✅ Reminder sent for entry ${entry.id} to ${rnProfile.email}`);
        } catch (emailError) {
          console.error(`❌ Failed to send reminder for entry ${entry.id}:`, emailError);
        }
      }

      // Handle overdue entries (more than 2 hours past scheduled time)
      if (minutesOverdue > 120 && entry.completion_status === "pending") {
        // Update status to overdue
        await supabase
          .from("rn_diary_entries")
          .update({ completion_status: "overdue" })
          .eq("id", entry.id);

        // Send overdue notification to RN
        try {
          const overdueResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Lovable Health <notifications@resend.dev>",
              to: [rnProfile.email],
              subject: `⚠️ Overdue: ${entry.title}`,
              html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Overdue Diary Entry</h2>
                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                  <h3 style="margin-top: 0; color: #dc2626;">${entry.title}</h3>
                  <p><strong>Type:</strong> ${entry.entry_type}</p>
                  <p><strong>Was scheduled:</strong> ${scheduledDateTime.toLocaleString()}</p>
                  <p><strong>Overdue by:</strong> ${Math.floor(minutesOverdue / 60)} hours ${minutesOverdue % 60} minutes</p>
                  <p><strong>Priority:</strong> ${entry.priority}</p>
                </div>
                <p style="color: #dc2626;"><strong>Action required:</strong> Please complete this entry or reschedule it.</p>
              </div>
            `
            }),
          });

          if (!overdueResponse.ok) {
            throw new Error(`Resend API error: ${await overdueResponse.text()}`);
          }
          console.log(`⚠️ Overdue notification sent for entry ${entry.id}`);
        } catch (emailError) {
          console.error(`❌ Failed to send overdue notification for entry ${entry.id}:`, emailError);
        }

        // Escalate to supervisor if shared and entry is high priority or urgent
        if (entry.shared_with_supervisor && ["high", "urgent"].includes(entry.priority)) {
          // Get supervisors
          const { data: supervisors } = await supabase
            .from("user_roles")
            .select("user_id")
            .in("role", ["SUPER_USER", "SUPER_ADMIN"])
            .limit(5);

          if (supervisors && supervisors.length > 0) {
            for (const supervisor of supervisors) {
              const { data: supervisorProfile } = await supabase
                .from("profiles")
                .select("email, display_name")
                .eq("user_id", supervisor.user_id)
                .single();

              if (supervisorProfile?.email) {
                try {
                  const escalationResponse = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                      "Authorization": `Bearer ${resendApiKey}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      from: "Lovable Health <notifications@resend.dev>",
                      to: [supervisorProfile.email],
                      subject: `🚨 Supervisor Alert: Overdue ${entry.priority} Priority Entry`,
                      html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #dc2626;">Supervisor Escalation</h2>
                        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                          <h3 style="margin-top: 0; color: #dc2626;">${entry.title}</h3>
                          <p><strong>Assigned to:</strong> ${rnProfile.display_name || "Unknown"}</p>
                          <p><strong>Type:</strong> ${entry.entry_type}</p>
                          <p><strong>Priority:</strong> <span style="color: #dc2626; font-weight: bold;">${entry.priority.toUpperCase()}</span></p>
                          <p><strong>Was scheduled:</strong> ${scheduledDateTime.toLocaleString()}</p>
                          <p><strong>Overdue by:</strong> ${Math.floor(minutesOverdue / 60)} hours ${minutesOverdue % 60} minutes</p>
                        </div>
                        <p style="color: #dc2626;"><strong>Supervisor action may be required.</strong></p>
                      </div>
                    `
                    }),
                  });

                  if (!escalationResponse.ok) {
                    throw new Error(`Resend API error: ${await escalationResponse.text()}`);
                  }
                  escalationsSent.push(entry.id);
                  console.log(`🚨 Supervisor escalation sent for entry ${entry.id}`);
                } catch (emailError) {
                  console.error(`❌ Failed to send supervisor escalation for entry ${entry.id}:`, emailError);
                }
              }
            }
          }
        }
      }
    }

    console.log(`✅ Processing complete. Reminders sent: ${notificationsSent.length}, Escalations sent: ${escalationsSent.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: entries?.length || 0,
        reminders_sent: notificationsSent.length,
        escalations_sent: escalationsSent.length,
        reminders: notificationsSent,
        escalations: escalationsSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error processing diary reminders:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});