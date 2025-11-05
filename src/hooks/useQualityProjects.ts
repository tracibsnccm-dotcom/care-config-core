import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface QualityProject {
  id: string;
  project_name: string;
  category: string;
  status: string;
  priority: string;
  start_date: string;
  target_completion: string | null;
  actual_completion: string | null;
  project_lead: string | null;
  description: string | null;
  baseline_metric: number | null;
  current_metric: number | null;
  target_metric: number | null;
  improvement_percentage: number | null;
  team_members: any;
  milestones: any;
  barriers: string | null;
  interventions: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useQualityProjects(filters?: { status?: string; category?: string; search?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["quality-projects", filters],
    queryFn: async () => {
      let query = supabase
        .from("quality_improvement_projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.search) {
        query = query.ilike("project_name", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as QualityProject[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (project: Partial<QualityProject>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { created_at, updated_at, id, ...insertData } = project as any;
      const { data, error } = await supabase
        .from("quality_improvement_projects")
        .insert({ ...insertData, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quality-projects"] });
      toast.success("Quality improvement project created successfully");
    },
    onError: () => {
      toast.error("Failed to create project");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QualityProject> & { id: string }) => {
      const { data, error } = await supabase
        .from("quality_improvement_projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quality-projects"] });
      toast.success("Project updated successfully");
    },
    onError: () => {
      toast.error("Failed to update project");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("quality_improvement_projects")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quality-projects"] });
      toast.success("Project deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete project");
    },
  });

  return {
    projects: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createProject: createMutation.mutate,
    updateProject: updateMutation.mutate,
    deleteProject: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}