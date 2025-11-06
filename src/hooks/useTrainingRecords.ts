import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type TrainingRecord = Database["public"]["Tables"]["training_records"]["Row"];
type TrainingRecordInsert = Database["public"]["Tables"]["training_records"]["Insert"];

export function useTrainingRecords() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["training-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_records")
        .select("*, profiles!staff_id(display_name)")
        .order("completion_date", { ascending: false });

      if (error) throw error;
      return data as TrainingRecord[];
    },
  });

  const createRecord = useMutation({
    mutationFn: async (newRecord: Omit<TrainingRecordInsert, "id">) => {
      const { data, error } = await supabase
        .from("training_records")
        .insert(newRecord)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-records"] });
      toast({ title: "Training record created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create training record",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TrainingRecordInsert> }) => {
      const { data, error } = await supabase
        .from("training_records")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-records"] });
      toast({ title: "Training record updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update training record",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("training_records")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-records"] });
      toast({ title: "Training record deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete training record",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    records,
    isLoading,
    createRecord: createRecord.mutate,
    updateRecord: updateRecord.mutate,
    deleteRecord: deleteRecord.mutate,
  };
}
