import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type SatisfactionSurvey = Database["public"]["Tables"]["client_satisfaction_surveys"]["Row"];
type SatisfactionSurveyInsert = Database["public"]["Tables"]["client_satisfaction_surveys"]["Insert"];

export function useSatisfactionSurveys() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: surveys = [], isLoading } = useQuery({
    queryKey: ["satisfaction-surveys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_satisfaction_surveys")
        .select("*, cases(client_label), profiles!client_id(display_name)")
        .order("survey_date", { ascending: false });

      if (error) throw error;
      return data as SatisfactionSurvey[];
    },
  });

  const createSurvey = useMutation({
    mutationFn: async (newSurvey: Omit<SatisfactionSurveyInsert, "id">) => {
      const { data, error } = await supabase
        .from("client_satisfaction_surveys")
        .insert(newSurvey)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["satisfaction-surveys"] });
      toast({ title: "Survey submitted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit survey",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    surveys,
    isLoading,
    createSurvey: createSurvey.mutate,
  };
}
