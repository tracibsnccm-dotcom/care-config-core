import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RiskEvent {
  id: string;
  event_type: string;
  severity: string;
  status: string;
  reported_date: string;
  case_id: string | null;
  reported_by: string | null;
  description: string;
  immediate_action: string | null;
  root_cause: string | null;
  corrective_actions: string | null;
  preventive_measures: string | null;
  resolved_date: string | null;
  resolved_by: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export function useRiskEvents(filters?: { status?: string; severity?: string; search?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["risk-events", filters],
    queryFn: async () => {
      let query = supabase
        .from("risk_events")
        .select("*")
        .order("reported_date", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.severity) {
        query = query.eq("severity", filters.severity);
      }
      if (filters?.search) {
        query = query.ilike("description", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RiskEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (event: Partial<RiskEvent>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { created_at, updated_at, id, ...insertData } = event as any;
      const { data, error } = await supabase
        .from("risk_events")
        .insert({ ...insertData, reported_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-events"] });
      toast.success("Risk event reported successfully");
    },
    onError: () => {
      toast.error("Failed to report risk event");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RiskEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from("risk_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-events"] });
      toast.success("Risk event updated successfully");
    },
    onError: () => {
      toast.error("Failed to update risk event");
    },
  });

  return {
    events: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createEvent: createMutation.mutate,
    updateEvent: updateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}