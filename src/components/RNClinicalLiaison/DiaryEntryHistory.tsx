import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Calendar, User, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface AuditEntry {
  id: string;
  action: string;
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  change_reason?: string;
  created_at: string;
  profiles?: {
    display_name?: string;
  } | null;
}

interface DiaryEntryHistoryProps {
  entryId: string;
}

export function DiaryEntryHistory({ entryId }: DiaryEntryHistoryProps) {
  const [history, setHistory] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [entryId]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("rn_diary_entry_audit")
        .select("*")
        .eq("entry_id", entryId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(a => a.changed_by).filter(Boolean))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds as string[]);

        const enrichedHistory = data.map(audit => ({
          ...audit,
          profiles: profiles?.find(p => p.user_id === audit.changed_by) || null
        }));
        
        setHistory(enrichedHistory as any);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, any> = {
      created: "default",
      rescheduled: "secondary",
      status_changed: "outline",
      reassigned: "destructive",
      deleted: "destructive",
    };

    return (
      <Badge variant={variants[action] || "outline"}>
        {action.replace("_", " ")}
      </Badge>
    );
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "rescheduled":
        return <Calendar className="h-4 w-4" />;
      case "reassigned":
        return <User className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground text-center">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5" />
          Entry History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No history available
            </p>
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                className="flex gap-3 p-3 border-l-2 border-primary/20 hover:border-primary/50 transition-colors"
              >
                <div className="mt-1">{getActionIcon(entry.action)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {getActionBadge(entry.action)}
                    {entry.field_changed && (
                      <span className="text-xs text-muted-foreground">
                        {entry.field_changed}
                      </span>
                    )}
                  </div>
                  
                  {entry.old_value && entry.new_value && (
                    <div className="text-sm">
                      <span className="line-through text-muted-foreground">
                        {entry.old_value}
                      </span>
                      {" → "}
                      <span className="font-medium">{entry.new_value}</span>
                    </div>
                  )}
                  
                  {entry.change_reason && (
                    <p className="text-sm text-muted-foreground italic">
                      "{entry.change_reason}"
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(new Date(entry.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                    {entry.profiles?.display_name && (
                      <>
                        <span>•</span>
                        <span>by {entry.profiles.display_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
