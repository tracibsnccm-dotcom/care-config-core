import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link2, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface DiaryEntryDependenciesProps {
  entryId: string;
  caseId: string;
  rnId: string;
}

export function DiaryEntryDependencies({ entryId, caseId, rnId }: DiaryEntryDependenciesProps) {
  const [selectedEntryId, setSelectedEntryId] = useState("");
  const [dependencyType, setDependencyType] = useState<"blocks" | "related" | "follows">("blocks");
  const queryClient = useQueryClient();

  // Fetch available entries for dependencies
  const { data: availableEntries } = useQuery({
    queryKey: ["diary-entries-for-dependencies", caseId, rnId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rn_diary_entries")
        .select("id, title, scheduled_date, completion_status")
        .eq("case_id", caseId)
        .eq("rn_id", rnId)
        .neq("id", entryId)
        .order("scheduled_date", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  // Fetch existing dependencies
  const { data: dependencies } = useQuery({
    queryKey: ["diary-dependencies", entryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rn_diary_entry_dependencies")
        .select(`
          id,
          depends_on_entry_id,
          dependency_type,
          rn_diary_entries!rn_diary_entry_dependencies_depends_on_entry_id_fkey(
            title,
            scheduled_date,
            completion_status
          )
        `)
        .eq("entry_id", entryId);

      if (error) throw error;
      return data;
    },
  });

  const addDependencyMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("rn_diary_entry_dependencies")
        .insert({
          entry_id: entryId,
          depends_on_entry_id: selectedEntryId,
          dependency_type: dependencyType,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dependency added");
      queryClient.invalidateQueries({ queryKey: ["diary-dependencies", entryId] });
      setSelectedEntryId("");
    },
    onError: (error) => {
      toast.error("Failed to add dependency: " + error.message);
    },
  });

  const removeDependencyMutation = useMutation({
    mutationFn: async (dependencyId: string) => {
      const { error } = await supabase
        .from("rn_diary_entry_dependencies")
        .delete()
        .eq("id", dependencyId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dependency removed");
      queryClient.invalidateQueries({ queryKey: ["diary-dependencies", entryId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Link2 className="h-4 w-4" />
        <h3 className="text-sm font-medium">Entry Dependencies</h3>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Select value={selectedEntryId} onValueChange={setSelectedEntryId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select entry..." />
            </SelectTrigger>
            <SelectContent>
              {availableEntries?.map((entry) => (
                <SelectItem key={entry.id} value={entry.id}>
                  {entry.title} ({format(new Date(entry.scheduled_date), "MMM d")})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={dependencyType}
            onValueChange={(val) => setDependencyType(val as any)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blocks">Blocks</SelectItem>
              <SelectItem value="related">Related</SelectItem>
              <SelectItem value="follows">Follows</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => addDependencyMutation.mutate()}
            disabled={!selectedEntryId || addDependencyMutation.isPending}
            size="sm"
          >
            Add
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Link related entries. "Blocks" prevents completion until dependency is done.
        </p>
      </div>

      {dependencies && dependencies.length > 0 && (
        <div className="space-y-2 mt-4">
          {dependencies.map((dep: any) => {
            const entry = dep.rn_diary_entries;
            return (
              <div key={dep.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  {dep.dependency_type === "blocks" && (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{entry.title}</p>
                    <div className="flex gap-2 items-center">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.scheduled_date), "MMM d, yyyy")}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {dep.dependency_type}
                      </Badge>
                      <Badge
                        variant={entry.completion_status === "completed" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {entry.completion_status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDependencyMutation.mutate(dep.id)}
                  disabled={removeDependencyMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
