import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pin, PinOff, ExternalLink, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { toast } from "@/hooks/use-toast";

export default function PinnedCasesWidget() {
  const { cases } = useApp();
  const navigate = useNavigate();
  const [pinnedCaseIds, setPinnedCaseIds] = useState<string[]>([]);

  const pinnedCases = cases.filter((c) => pinnedCaseIds.includes(c.id)).slice(0, 5);

  const togglePin = (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedCaseIds((prev) => {
      if (prev.includes(caseId)) {
        toast({ title: "Case unpinned", variant: "default" });
        return prev.filter((id) => id !== caseId);
      } else {
        if (prev.length >= 5) {
          toast({ 
            title: "Maximum pinned cases reached", 
            description: "Unpin a case to add a new one",
            variant: "destructive" 
          });
          return prev;
        }
        toast({ title: "Case pinned", variant: "default" });
        return [...prev, caseId];
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW": return "bg-yellow-500/10 text-yellow-500";
      case "IN_PROGRESS": return "bg-green-500/10 text-green-500";
      case "AWAITING_CONSENT": return "bg-orange-500/10 text-orange-500";
      case "CLOSED": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Pin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Pinned Cases</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {pinnedCaseIds.length}/5
        </Badge>
      </div>

      <div className="space-y-3">
        {pinnedCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-1">No pinned cases</p>
            <p className="text-xs text-muted-foreground">
              Pin important cases for quick access
            </p>
          </div>
        ) : (
          pinnedCases.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/case-detail/${c.id}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    Case {c.id.slice(-8)}
                  </p>
                  <Badge variant="secondary" className={`text-xs ${getStatusColor(c.status)}`}>
                    {c.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {c.client?.fullName || c.client?.displayNameMasked || "Unknown Client"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => togglePin(c.id, e)}
                >
                  <PinOff className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/case-detail/${c.id}`);
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {pinnedCases.length === 0 && cases.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground mb-2">Suggested cases to pin:</p>
          {cases.slice(0, 3).map((c) => (
            <Button
              key={c.id}
              variant="outline"
              size="sm"
              className="w-full justify-between"
              onClick={() => togglePin(c.id, {} as React.MouseEvent)}
            >
              <span className="truncate">Case {c.id.slice(-8)}</span>
              <Pin className="h-3 w-3 ml-2 flex-shrink-0" />
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
}
