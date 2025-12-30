import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseAutosaveProps {
  formData: any;
  step: number;
  caseId?: string;
  enabled?: boolean;
  debounceMs?: number;
}

export function useAutosave({ 
  formData, 
  step, 
  caseId,
  enabled = true,
  debounceMs = 3000 
}: UseAutosaveProps) {
  const { toast } = useToast();
  const saveTimerRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  const draftIdRef = useRef<string | null>(null);

  const saveToDatabase = useCallback(async () => {
    if (!enabled) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentData = JSON.stringify({ formData, step });
      
      // Don't save if data hasn't changed
      if (currentData === lastSavedRef.current) return;

      if (draftIdRef.current) {
        // Update existing draft
        const { error } = await supabase
          .from('intake_drafts')
          .update({
            form_data: formData,
            step: step,
            updated_at: new Date().toISOString(),
          })
          .eq('id', draftIdRef.current);

        if (error) throw error;
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('intake_drafts')
          .insert({
            user_id: user.id,
            case_id: caseId,
            form_data: formData,
            step: step,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) draftIdRef.current = data.id;
      }

      lastSavedRef.current = currentData;
      console.log('Draft autosaved:', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Autosave failed:', error);
    }
  }, [formData, step, caseId, enabled]);

  const scheduleSave = useCallback(() => {
    if (!enabled) return;
    
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    saveTimerRef.current = setTimeout(() => {
      saveToDatabase();
    }, debounceMs);
  }, [saveToDatabase, debounceMs, enabled]);

  const loadDraft = useCallback(async () => {
    if (!enabled) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('intake_drafts')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        draftIdRef.current = data.id;
        return {
          formData: data.form_data,
          step: data.step,
          updatedAt: data.updated_at,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [enabled]);

  const deleteDraft = useCallback(async () => {
    if (!draftIdRef.current) return;

    try {
      const { error } = await supabase
        .from('intake_drafts')
        .delete()
        .eq('id', draftIdRef.current);

      if (error) throw error;
      
      draftIdRef.current = null;
      lastSavedRef.current = '';
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  }, []);

  useEffect(() => {
    scheduleSave();
    
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [scheduleSave]);

  return {
    loadDraft,
    deleteDraft,
    saveNow: saveToDatabase,
  };
}
