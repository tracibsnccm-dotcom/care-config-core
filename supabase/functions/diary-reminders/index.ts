import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface DiaryEntry {
  id: string;
  title: string;
  scheduled_date: string;
  scheduled_time?: string;
  rn_id: string;
  reminder_enabled: boolean;
  reminder_minutes_before?: number;
  completion_status: string;
  metadata?: any;
}

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time
    const now = new Date();
    const nowISO = now.toISOString();
    
    // Check for upcoming entries in the next hour
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const today = now.toISOString().split('T')[0];
    
    // Fetch entries that need reminders
    const { data: entries, error: fetchError } = await supabase
      .from("rn_diary_entries")
      .select("*, profiles!inner(email, display_name)")
      .eq("reminder_enabled", true)
      .in("completion_status", ["pending", "in_progress"])
      .gte("scheduled_date", today)
      .lte("scheduled_date", oneHourFromNow.toISOString().split('T')[0]);

    if (fetchError) {
      throw fetchError;
    }

    if (!entries || entries.length === 0) {
      return new Response(
        JSON.stringify({ message: "No reminders to send" }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }

    const remindersSent = [];

    for (const entry of entries) {
      const scheduledDateTime = entry.scheduled_time
        ? new Date(`${entry.scheduled_date}T${entry.scheduled_time}`)
        : new Date(`${entry.scheduled_date}T09:00:00`);

      const minutesUntil = (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60);
      const reminderMinutes = entry.reminder_minutes_before || 30;

      // Send reminder if within reminder window
      if (minutesUntil > 0 && minutesUntil <= reminderMinutes) {
        // Check if reminder already sent (using metadata)
        const metadata = entry.metadata || {};
        if (metadata.reminder_sent_at) {
          const sentAt = new Date(metadata.reminder_sent_at);
          const hoursSinceSent = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60);
          if (hoursSinceSent < 1) {
            continue; // Skip if reminder sent in last hour
          }
        }

        // Create notification in system
        await supabase.from("notifications").insert({
          user_id: entry.rn_id,
          title: "Diary Reminder",
          message: `${entry.title} is scheduled in ${Math.round(minutesUntil)} minutes`,
          link: "/rncm/diary",
          priority: "high",
          metadata: { entry_id: entry.id }
        });

        // Update metadata to mark reminder as sent
        await supabase
          .from("rn_diary_entries")
          .update({
            metadata: { ...metadata, reminder_sent_at: nowISO }
          })
          .eq("id", entry.id);

        remindersSent.push({
          entry_id: entry.id,
          title: entry.title,
          minutes_until: Math.round(minutesUntil)
        });
      }

      // Check for overdue entries and escalate
      if (minutesUntil < 0 && entry.completion_status === "pending") {
        const hoursOverdue = Math.abs(minutesUntil) / 60;
        
        if (hoursOverdue > 2) {
          // Escalate to supervisors
          const { data: supervisors } = await supabase
            .from("user_roles")
            .select("user_id")
            .in("role", ["SUPER_USER", "SUPER_ADMIN"]);

          if (supervisors) {
            for (const supervisor of supervisors) {
              await supabase.from("notifications").insert({
                user_id: supervisor.user_id,
                title: "Overdue Diary Entry",
                message: `Entry "${entry.title}" is ${Math.round(hoursOverdue)} hours overdue`,
                link: `/rncm/diary`,
                priority: "urgent",
                metadata: { entry_id: entry.id, rn_id: entry.rn_id }
              });
            }
          }

          // Update status to overdue
          await supabase
            .from("rn_diary_entries")
            .update({ completion_status: "overdue" })
            .eq("id", entry.id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Reminders processed",
        reminders_sent: remindersSent.length,
        entries_checked: entries.length
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error processing reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
