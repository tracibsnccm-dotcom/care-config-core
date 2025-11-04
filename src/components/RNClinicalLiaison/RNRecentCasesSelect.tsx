import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";

interface RecentCase {
  case_id: string;
  client_number: string;
  client_label: string;
  last_entry: string;
}

interface RNRecentCasesSelectProps {
  value?: string;
  onValueChange: (caseId: string) => void;
}

export function RNRecentCasesSelect({ value, onValueChange }: RNRecentCasesSelectProps) {
  const [recentCases, setRecentCases] = useState<RecentCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentCases();
  }, []);

  async function fetchRecentCases() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the 10 most recent cases this RN has logged time for
      const { data: timeEntries, error: entriesError } = await supabase
        .from("rn_time_entries")
        .select("case_id, created_at")
        .eq("rn_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50); // Get more to account for duplicates

      if (entriesError) throw entriesError;

      // Get unique case IDs (most recent 10)
      const uniqueCaseIds = [...new Set(timeEntries?.map(e => e.case_id))].slice(0, 10);

      if (uniqueCaseIds.length === 0) {
        setRecentCases([]);
        setLoading(false);
        return;
      }

      // Fetch case details
      const { data: cases, error: casesError } = await supabase
        .from("cases")
        .select("id, client_number, client_label")
        .in("id", uniqueCaseIds);

      if (casesError) throw casesError;

      // Map and sort by most recent activity
      const casesMap = new Map(cases?.map(c => [c.id, c]));
      const sortedCases: RecentCase[] = uniqueCaseIds
        .map(caseId => {
          const caseData = casesMap.get(caseId);
          if (!caseData) return null;
          
          const lastEntry = timeEntries?.find(e => e.case_id === caseId)?.created_at || "";
          
          return {
            case_id: caseId,
            client_number: caseData.client_number || "N/A",
            client_label: caseData.client_label || "Unknown",
            last_entry: lastEntry
          };
        })
        .filter((c): c is RecentCase => c !== null);

      setRecentCases(sortedCases);
    } catch (error) {
      console.error("Error fetching recent cases:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading recent cases..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (recentCases.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="No recent cases" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select from recent cases...">
          {value && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {recentCases.find(c => c.case_id === value)?.client_number}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {recentCases.map((recentCase) => (
          <SelectItem key={recentCase.case_id} value={recentCase.case_id}>
            <div className="flex flex-col">
              <span className="font-medium">{recentCase.client_number}</span>
              <span className="text-xs text-muted-foreground">{recentCase.client_label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
