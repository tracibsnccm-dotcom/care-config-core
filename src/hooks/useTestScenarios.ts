import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TestScenario {
  id: string;
  name: string;
  core_pattern: string;
  client_profile: string;
  attorney_status: string;
  timeline: any;
  created_at: string;
}

export function useTestScenarios() {
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState<TestScenario | null>(null);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('test_scenarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setScenarios(data || []);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      toast.error('Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  const loadScenario = async (scenarioId: string) => {
    try {
      const scenario = scenarios.find((s) => s.id === scenarioId);
      if (!scenario) {
        toast.error('Scenario not found');
        return;
      }

      // Log the scenario load
      await supabase.from('test_events').insert({
        event_type: 'SCENARIO_LOADED',
        event_description: `Loaded scenario: ${scenario.name}`,
        triggered_at: new Date().toISOString(),
      });

      setActiveScenario(scenario);
      toast.success(`Loaded scenario: ${scenario.name}`);
    } catch (error) {
      console.error('Error loading scenario:', error);
      toast.error('Failed to load scenario');
    }
  };

  const saveScenario = async (scenarioName: string, corePattern: string, data: any) => {
    try {
      const { data: results, error } = await supabase
        .from('test_scenarios')
        .insert([{
          name: scenarioName,
          core_pattern: corePattern,
          client_profile: data.clientProfile || '',
          attorney_status: data.attorneyStatus || 'Active',
          timeline: data.timeline || {},
        }])
        .select();

      if (error) throw error;

      toast.success('Scenario saved successfully');
      await fetchScenarios();
      return results?.[0] || null;
    } catch (error) {
      console.error('Error saving scenario:', error);
      toast.error('Failed to save scenario');
      return null;
    }
  };

  const deleteScenario = async (scenarioId: string) => {
    try {
      const { error } = await supabase
        .from('test_scenarios')
        .delete()
        .eq('id', scenarioId);

      if (error) throw error;

      toast.success('Scenario deleted');
      await fetchScenarios();
      
      if (activeScenario?.id === scenarioId) {
        setActiveScenario(null);
      }
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast.error('Failed to delete scenario');
    }
  };

  return {
    scenarios,
    loading,
    activeScenario,
    loadScenario,
    saveScenario,
    deleteScenario,
    refresh: fetchScenarios,
  };
}
