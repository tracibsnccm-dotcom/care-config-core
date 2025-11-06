import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TeamCase {
  id: string;
  client_number?: string;
  client_label?: string;
  status: string;
  created_at: string;
  assigned_to?: string;
  assigned_name?: string;
  assigned_role?: string;
  note_count: number;
  completed_tasks: number;
  total_tasks: number;
}

export function useTeamCases() {
  const [cases, setCases] = useState<TeamCase[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("management_team_cases")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading cases",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  return {
    cases,
    loading,
    refresh: fetchCases,
  };
}