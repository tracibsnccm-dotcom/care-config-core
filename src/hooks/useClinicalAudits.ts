import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClinicalAudit {
  id: string;
  audit_name: string;
  audit_type: string;
  status: string;
  scheduled_date: string;
  completed_date: string | null;
  auditor_id: string | null;
  cases_reviewed: number;
  compliance_rate: number | null;
  findings: string | null;
  recommendations: string | null;
  priority: string;
  follow_up_required: boolean;
  follow_up_date: string | null;
  metadata: any;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useClinicalAudits(filters?: { status?: string; type?: string; search?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["clinical-audits", filters],
    queryFn: async () => {
      let query = supabase
        .from("clinical_audits")
        .select("*")
        .order("scheduled_date", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.type) {
        query = query.eq("audit_type", filters.type);
      }
      if (filters?.search) {
        query = query.ilike("audit_name", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ClinicalAudit[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (audit: Partial<ClinicalAudit>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { created_at, updated_at, id, ...insertData } = audit as any;
      const { data, error } = await supabase
        .from("clinical_audits")
        .insert({ ...insertData, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-audits"] });
      toast.success("Audit scheduled successfully");
    },
    onError: () => {
      toast.error("Failed to schedule audit");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClinicalAudit> & { id: string }) => {
      const { data, error } = await supabase
        .from("clinical_audits")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-audits"] });
      toast.success("Audit updated successfully");
    },
    onError: () => {
      toast.error("Failed to update audit");
    },
  });

  return {
    audits: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createAudit: createMutation.mutate,
    updateAudit: updateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}