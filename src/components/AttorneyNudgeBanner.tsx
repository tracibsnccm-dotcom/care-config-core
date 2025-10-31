import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const AttorneyNudgeBanner = () => {
  const [visible, setVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    checkNudgeStatus();
    const interval = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkNudgeStatus = async () => {
    try {
      // Check if dismissed in last 24h
      const dismissedUntil = Number(localStorage.getItem('rcms_nudge_dismiss_until') || 0);
      if (Date.now() < dismissedUntil) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check for recent nudge notification
      const { data: notifications } = await supabase
        .from('notifications')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('title', 'Complete Your Intake')
        .order('created_at', { ascending: false })
        .limit(1);

      if (notifications && notifications.length > 0) {
        setVisible(true);
        updateTimeRemaining();
      }
    } catch (error) {
      console.error('Failed to check nudge status:', error);
    }
  };

  const updateTimeRemaining = () => {
    const expiryIso = localStorage.getItem('rcms_expiry_iso');
    if (!expiryIso) return;

    const ms = new Date(expiryIso).getTime() - Date.now();
    if (ms <= 0) {
      setTimeRemaining('expires soon');
      return;
    }

    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    setTimeRemaining(days > 0 ? `${days} day${days > 1 ? 's' : ''} ${hours}h remaining` : `${hours} hours remaining`);
  };

  const handleDismiss = () => {
    localStorage.setItem('rcms_nudge_dismiss_until', String(Date.now() + 24 * 3600000));
    setVisible(false);
  };

  const handleResume = () => {
    const resumeUrl = localStorage.getItem('rcms_resume_url') || '/intake';
    window.location.href = resumeUrl;
  };

  if (!visible) return null;

  return (
    <div 
      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-blue-50 border-l-4 border-primary rounded-lg p-3 mb-3 shadow-sm animate-in slide-in-from-top-2"
      role="region"
      aria-live="polite"
      aria-label="Intake reminder"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">👋</span>
        <div>
          <strong className="text-foreground">Your attorney sent a reminder.</strong>
          <div className="text-sm text-muted-foreground mt-1">
            {timeRemaining ? `You can return to your intake anytime — ${timeRemaining}.` : 'You can return to your intake anytime. Your progress is saved.'}
          </div>
        </div>
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <Button onClick={handleResume} size="sm" className="font-bold">
          Resume Intake
        </Button>
        <Button onClick={handleDismiss} variant="ghost" size="icon" aria-label="Dismiss reminder">
          ×
        </Button>
      </div>
    </div>
  );
};
