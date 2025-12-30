import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link, Plus, X } from "lucide-react";

interface EntryLinkingProps {
  entryId: string;
}

export function DiaryEntryLinking({ entryId }: EntryLinkingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetEntryId, setTargetEntryId] = useState("");
  const [linkType, setLinkType] = useState("related");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: availableEntries } = useQuery({
    queryKey: ["available-entries", entryId],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("rn_diary_entries")
        .select("id, title, scheduled_date")
        .eq("rn_id", user.id)
        .neq("id", entryId)
        .order("scheduled_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: existingLinks } = useQuery({
    queryKey: ["entry-dependencies", entryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rn_diary_entry_dependencies")
        .select(`
          *,
          dependent_entry:entry_id(id, title),
          blocking_entry:depends_on_entry_id(id, title)
        `)
        .eq("entry_id", entryId);
      if (error) throw error;
      return data;
    },
  });

  const createLinkMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("rn_diary_entry_dependencies")
        .insert({
          entry_id: entryId,
          depends_on_entry_id: targetEntryId,
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entry-dependencies", entryId] });
      setIsOpen(false);
      setTargetEntryId("");
      toast.success("Entry linked successfully");
    },
    onError: () => {
      toast.error("Failed to link entry");
    },
  });

  const removeLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from("rn_diary_entry_dependencies")
        .delete()
        .eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entry-dependencies", entryId] });
      toast.success("Link removed");
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link className="h-4 w-4" />
          <span className="font-medium text-sm">Linked Entries</span>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-3 w-3 mr-1" />
              Link Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link to Another Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Entry to Link</Label>
                <Select value={targetEntryId} onValueChange={setTargetEntryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entry" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEntries?.map((entry: any) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.title} ({entry.scheduled_date})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => createLinkMutation.mutate()} 
                disabled={!targetEntryId || createLinkMutation.isPending}
                className="w-full"
              >
                Create Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {existingLinks && existingLinks.length > 0 ? (
          existingLinks.map((link: any) => (
            <div key={link.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
              <div>
                <div className="font-medium">{link.blocking_entry?.title}</div>
                <div className="text-xs text-muted-foreground">Depends on this</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeLinkMutation.mutate(link.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            No linked entries
          </p>
        )}
      </div>
    </div>
  );
}