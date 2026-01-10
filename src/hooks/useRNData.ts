import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";

export interface RNAssignment {
  id: string;
  case_id: string;
  assigned_at: string;
  status: string;
  notes: string | null;
}

export interface RNAssessment {
  id: string;
  case_id: string;
  assessment_type: string;
  status: string;
  due_date: string | null;
  requires_followup: boolean;
  followup_reason: string | null;
  followup_due_date: string | null;
}

export interface RNDiaryEntry {
  id: string;
  case_id: string | null;
  entry_type: string;
  title: string;
  description: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
  location: string | null;
  metadata: any;
}

export function useRNAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<RNAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAssignments = async () => {
      const { data, error } = await supabase
        .from("rc_case_assignments")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("assigned_at", { ascending: false });

      if (!error && data) {
        setAssignments(data);
      }
      setLoading(false);
    };

    fetchAssignments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("rn_assignments_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rc_case_assignments",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchAssignments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { assignments, loading };
}

export function useRNAssessments() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<RNAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAssessments = async () => {
      const { data, error } = await supabase
        .from("rn_assessments")
        .select("*")
        .eq("rn_id", user.id)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (!error && data) {
        setAssessments(data);
      }
      setLoading(false);
    };

    fetchAssessments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("rn_assessments_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rn_assessments",
          filter: `rn_id=eq.${user.id}`,
        },
        () => fetchAssessments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const pending = assessments.filter((a) => a.status === "pending");
  const requireFollowup = assessments.filter((a) => a.requires_followup && a.status !== "completed");

  return { assessments, pending, requireFollowup, loading };
}

export function useRNDiary() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<RNDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from("rn_diary_entries")
        .select("*")
        .eq("rn_id", user.id)
        .gte("scheduled_date", new Date().toISOString().split("T")[0])
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true, nullsFirst: false });

      if (!error && data) {
        setEntries(data);
      }
      setLoading(false);
    };

    fetchEntries();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("rn_diary_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rn_diary_entries",
          filter: `rn_id=eq.${user.id}`,
        },
        () => fetchEntries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { entries, loading };
}

// Supervisor version - can see all RN diary entries
export function useSupervisorDiary() {
  const [entries, setEntries] = useState<RNDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from("rn_diary_entries")
        .select("*")
        .gte("scheduled_date", new Date().toISOString().split("T")[0])
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true, nullsFirst: false });

      if (!error && data) {
        setEntries(data);
      }
      setLoading(false);
    };

    fetchEntries();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("supervisor_diary_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rn_diary_entries",
        },
        () => fetchEntries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { entries, loading };
}
