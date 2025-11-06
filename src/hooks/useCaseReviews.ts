import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type CaseReview = Database["public"]["Tables"]["case_reviews"]["Row"];
type CaseReviewInsert = Omit<Database["public"]["Tables"]["case_reviews"]["Insert"], "reviewer_id">;

export function useCaseReviews() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["case-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_reviews")
        .select("*, cases(client_label), profiles!reviewer_id(display_name)")
        .order("review_date", { ascending: false });

      if (error) throw error;
      return data as CaseReview[];
    },
  });

  const createReview = useMutation({
    mutationFn: async (newReview: Omit<CaseReviewInsert, "id">) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("case_reviews")
        .insert({ ...newReview, reviewer_id: userData?.user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-reviews"] });
      toast({ title: "Review created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateReview = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CaseReviewInsert> }) => {
      const { data, error } = await supabase
        .from("case_reviews")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-reviews"] });
      toast({ title: "Review updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    reviews,
    isLoading,
    createReview: createReview.mutate,
    updateReview: updateReview.mutate,
  };
}
