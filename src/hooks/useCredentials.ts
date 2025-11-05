import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Credential {
  id: string;
  staff_id: string;
  credential_type: string;
  credential_name: string;
  license_number: string | null;
  issuing_organization: string | null;
  issue_date: string | null;
  expiration_date: string;
  status: string;
  renewal_reminder_sent: boolean;
  documents: any;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useCredentials(filters?: { status?: string; type?: string; search?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["credentials", filters],
    queryFn: async () => {
      let query = supabase
        .from("credentials_tracking")
        .select("*")
        .order("expiration_date", { ascending: true });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.type) {
        query = query.eq("credential_type", filters.type);
      }
      if (filters?.search) {
        query = query.ilike("credential_name", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Credential[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (credential: Partial<Credential>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { created_at, updated_at, id, ...insertData } = credential as any;
      const { data, error } = await supabase
        .from("credentials_tracking")
        .insert({ ...insertData, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credential added successfully");
    },
    onError: () => {
      toast.error("Failed to add credential");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Credential> & { id: string }) => {
      const { data, error } = await supabase
        .from("credentials_tracking")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credential updated successfully");
    },
    onError: () => {
      toast.error("Failed to update credential");
    },
  });

  return {
    credentials: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createCredential: createMutation.mutate,
    updateCredential: updateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}