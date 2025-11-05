import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StaffMember {
  id: string;
  user_id: string | null;
  full_name: string;
  role: string;
  department: string;
  email: string;
  phone: string | null;
  hire_date: string;
  employment_status: string;
  supervisor_id: string | null;
  certifications: any;
  performance_score: number | null;
  caseload_count: number;
  specializations: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useStaffMembers(filters?: { role?: string; department?: string; search?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["staff-members", filters],
    queryFn: async () => {
      let query = supabase
        .from("staff_members")
        .select("*")
        .order("full_name", { ascending: true });

      if (filters?.role) {
        query = query.eq("role", filters.role);
      }
      if (filters?.department) {
        query = query.eq("department", filters.department);
      }
      if (filters?.search) {
        query = query.ilike("full_name", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StaffMember[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (staff: Partial<StaffMember>) => {
      const { created_at, updated_at, id, ...insertData } = staff as any;
      const { data, error } = await supabase
        .from("staff_members")
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success("Staff member added successfully");
    },
    onError: () => {
      toast.error("Failed to add staff member");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StaffMember> & { id: string }) => {
      const { data, error } = await supabase
        .from("staff_members")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success("Staff member updated successfully");
    },
    onError: () => {
      toast.error("Failed to update staff member");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("staff_members")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success("Staff member removed successfully");
    },
    onError: () => {
      toast.error("Failed to remove staff member");
    },
  });

  return {
    staff: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createStaff: createMutation.mutate,
    updateStaff: updateMutation.mutate,
    deleteStaff: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
