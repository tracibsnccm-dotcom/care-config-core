import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useEmergencyAlertGuard() {
  const [hasIncompleteAlerts, setHasIncompleteAlerts] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Temporarily disabled - table schema needs to be configured
  useEffect(() => {
    // No-op for now to prevent navigation blocking
    setHasIncompleteAlerts(false);
    setLoading(false);
  }, []);

  const checkForIncompleteAlerts = async () => {
    // Temporarily disabled to prevent navigation blocking
    setHasIncompleteAlerts(false);
    setLoading(false);
  };

  const recordAttempt = async () => {
    // No-op for now
  };

  const notifySupervisor = async () => {
    // No-op for now
  };

  return {
    hasIncompleteAlerts: false, // Always return false to allow navigation
    attemptCount,
    loading: false,
    recordAttempt,
    checkForIncompleteAlerts
  };
}
