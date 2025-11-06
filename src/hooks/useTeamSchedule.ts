import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  event_type: 'meeting' | 'pto' | 'training' | 'deadline' | 'review';
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  created_by?: string;
  case_id?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  reminder_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export function useTeamSchedule() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("team_schedule_events")
        .select("*")
        .order("start_time", { ascending: true });

      if (error) throw error;
      setEvents((data as ScheduleEvent[]) || []);
    } catch (error: any) {
      toast({
        title: "Error loading schedule",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (event: Omit<ScheduleEvent, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from("team_schedule_events")
        .insert([event]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event created successfully",
      });

      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error creating event",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateEvent = async (id: string, updates: Partial<ScheduleEvent>) => {
    try {
      const { error } = await supabase
        .from("team_schedule_events")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event updated successfully",
      });

      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error updating event",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from("team_schedule_events")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });

      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error deleting event",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    refresh: fetchEvents,
  };
}