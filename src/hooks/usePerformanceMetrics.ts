import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type PerformanceMetric = Database["public"]["Tables"]["performance_metrics"]["Row"];
type PerformanceMetricInsert = Database["public"]["Tables"]["performance_metrics"]["Insert"];

export function usePerformanceMetrics() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ["performance-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performance_metrics")
        .select("*, profiles!staff_id(display_name)")
        .order("metric_period_start", { ascending: false });

      if (error) throw error;
      return data as PerformanceMetric[];
    },
  });

  const createMetric = useMutation({
    mutationFn: async (newMetric: Omit<PerformanceMetricInsert, "id">) => {
      const { data, error } = await supabase
        .from("performance_metrics")
        .insert(newMetric)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-metrics"] });
      toast({ title: "Performance metric created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create metric",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    metrics,
    isLoading,
    createMetric: createMetric.mutate,
  };
}
