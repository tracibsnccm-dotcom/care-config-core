import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CarePlanReminder {
  id: string;
  case_id: string | null;
  rn_id: string | null;
  reminder_type: string;
  priority: string | null;
  title: string;
  description?: string | null;
  reminder_date: string;
  reminder_time?: string | null;
  status: string | null;
  acknowledged_at?: string | null;
  completed_at?: string | null;
  created_at: string | null;
}

export function useCarePlanReminders() {
  const [reminders, setReminders] = useState<CarePlanReminder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReminders();

    const channel = supabase
      .channel("care-plan-reminders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "care_plan_reminders",
        },
        () => {
          fetchReminders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("care_plan_reminders")
        .select("*")
        .eq("rn_id", user.id)
        .order("reminder_date", { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      toast.error("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from("care_plan_reminders")
        .update({ 
          status: "acknowledged",
          acknowledged_at: new Date().toISOString()
        })
        .eq("id", reminderId);

      if (error) throw error;
      toast.success("Reminder acknowledged");
    } catch (error) {
      console.error("Error acknowledging reminder:", error);
      toast.error("Failed to acknowledge reminder");
    }
  };

  const completeReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from("care_plan_reminders")
        .update({ 
          status: "completed",
          completed_at: new Date().toISOString()
        })
        .eq("id", reminderId);

      if (error) throw error;
      toast.success("Reminder completed");
    } catch (error) {
      console.error("Error completing reminder:", error);
      toast.error("Failed to complete reminder");
    }
  };

  const dismissReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from("care_plan_reminders")
        .delete()
        .eq("id", reminderId);

      if (error) throw error;
      toast.success("Reminder dismissed");
    } catch (error) {
      console.error("Error dismissing reminder:", error);
      toast.error("Failed to dismiss reminder");
    }
  };

  return { reminders, loading, acknowledgeReminder, completeReminder, dismissReminder, refreshReminders: fetchReminders };
}
