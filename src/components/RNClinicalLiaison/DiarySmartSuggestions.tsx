import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Check, X, Clock, AlertTriangle, Copy } from "lucide-react";
import { toast } from "sonner";

export function DiarySmartSuggestions() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: suggestions } = useQuery({
    queryKey: ["ai-suggestions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("rn_ai_suggestions")
        .select("*")
        .eq("rn_id", user.id)
        .eq("status", "pending")
        .order("confidence_score", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const actionSuggestionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "accepted" | "dismissed" }) => {
      const { error } = await supabase
        .from("rn_ai_suggestions")
        .update({ status: action, actioned_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-suggestions"] });
      toast.success("Suggestion updated");
    },
  });

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "schedule":
        return <Clock className="h-4 w-4" />;
      case "duplicate":
        return <Copy className="h-4 w-4" />;
      case "priority":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case "schedule":
        return "text-blue-500";
      case "duplicate":
        return "text-orange-500";
      case "priority":
        return "text-red-500";
      default:
        return "text-green-500";
    }
  };

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold mb-2">No Suggestions Yet</h3>
        <p className="text-sm text-muted-foreground">
          Smart suggestions will appear here based on your diary patterns and workload.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h3 className="font-semibold">Smart Suggestions</h3>
        <Badge variant="secondary">{suggestions.length}</Badge>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion: any) => (
          <Card key={suggestion.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={getSuggestionColor(suggestion.suggestion_type)}>
                    {getSuggestionIcon(suggestion.suggestion_type)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {suggestion.suggestion_type.replace("_", " ")}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(suggestion.confidence_score * 100)}% confident
                  </Badge>
                </div>
                <p className="text-sm">{suggestion.suggestion_text}</p>
                {suggestion.metadata && Object.keys(suggestion.metadata).length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {JSON.stringify(suggestion.metadata)}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => actionSuggestionMutation.mutate({ id: suggestion.id, action: "accepted" })}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => actionSuggestionMutation.mutate({ id: suggestion.id, action: "dismissed" })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
