import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SimulatedTimeState {
  simTime: string | null;
  isActive: boolean;
  realTime: Date;
}

export function useSimulatedTime() {
  const [state, setState] = useState<SimulatedTimeState>({
    simTime: null,
    isActive: false,
    realTime: new Date(),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimulatedTime();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('simulated_time_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'simulated_time',
        },
        () => {
          fetchSimulatedTime();
        }
      )
      .subscribe();

    // Update real time every second
    const interval = setInterval(() => {
      setState((prev) => ({ ...prev, realTime: new Date() }));
    }, 1000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const fetchSimulatedTime = async () => {
    try {
      const { data, error } = await supabase
        .from('simulated_time')
        .select('*')
        .eq('id', '1')
        .single();

      if (error) throw error;

      setState({
        simTime: data?.sim_time || null,
        isActive: data?.is_active || false,
        realTime: new Date(),
      });
    } catch (error) {
      console.error('Error fetching simulated time:', error);
    } finally {
      setLoading(false);
    }
  };

  const activateSimulatedTime = async (timestamp?: Date) => {
    try {
      const timeToSet = timestamp || new Date();
      
      const { error } = await supabase
        .from('simulated_time')
        .upsert({
          id: '1',
          sim_time: timeToSet.toISOString(),
          is_active: true,
        });

      if (error) throw error;

      toast.success('Simulated time activated');
      await fetchSimulatedTime();
    } catch (error) {
      console.error('Error activating simulated time:', error);
      toast.error('Failed to activate simulated time');
    }
  };

  const deactivateSimulatedTime = async () => {
    try {
      const { error } = await supabase
        .from('simulated_time')
        .update({ is_active: false })
        .eq('id', '1');

      if (error) throw error;

      toast.success('Simulated time deactivated');
      await fetchSimulatedTime();
    } catch (error) {
      console.error('Error deactivating simulated time:', error);
      toast.error('Failed to deactivate simulated time');
    }
  };

  const jumpTime = async (hours: number) => {
    if (!state.isActive || !state.simTime) {
      toast.error('Simulated time must be active');
      return;
    }

    try {
      const current = new Date(state.simTime);
      const newTime = new Date(current.getTime() + hours * 60 * 60 * 1000);

      const { error } = await supabase
        .from('simulated_time')
        .update({ sim_time: newTime.toISOString() })
        .eq('id', '1');

      if (error) throw error;

      // Log the time jump
      await supabase.from('test_events').insert({
        event_type: 'TIME_JUMPED',
        event_description: `Jumped time ${hours} hours`,
        triggered_at: new Date().toISOString(),
      });

      toast.success(`Jumped ${hours > 0 ? 'forward' : 'backward'} ${Math.abs(hours)} hours`);
      await fetchSimulatedTime();
    } catch (error) {
      console.error('Error jumping time:', error);
      toast.error('Failed to jump time');
    }
  };

  const setSimulatedTime = async (timestamp: Date) => {
    try {
      const { error } = await supabase
        .from('simulated_time')
        .upsert({
          id: '1',
          sim_time: timestamp.toISOString(),
          is_active: true,
        });

      if (error) throw error;

      toast.success('Simulated time updated');
      await fetchSimulatedTime();
    } catch (error) {
      console.error('Error setting simulated time:', error);
      toast.error('Failed to set simulated time');
    }
  };

  const getCurrentTime = (): Date => {
    if (state.isActive && state.simTime) {
      return new Date(state.simTime);
    }
    return state.realTime;
  };

  return {
    ...state,
    loading,
    activateSimulatedTime,
    deactivateSimulatedTime,
    jumpTime,
    setSimulatedTime,
    getCurrentTime,
    refresh: fetchSimulatedTime,
  };
}
