import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Clock, Play, SkipForward, RotateCcw, Calendar } from "lucide-react";
import { TEST_SCENARIOS, TestScenario } from "@/data/testScenarios";

export default function TestScenarioManager() {
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);
  const [simulatedTime, setSimulatedTime] = useState<Date>(new Date());
  const [timeControlActive, setTimeControlActive] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [hoursToJump, setHoursToJump] = useState<number>(24);
  const [daysToJump, setDaysToJump] = useState<number>(1);

  useEffect(() => {
    fetchSimulatedTime();
    fetchEvents();
  }, []);

  const fetchSimulatedTime = async () => {
    const { data } = await supabase
      .from('simulated_time')
      .select('*')
      .eq('is_active', true)
      .single();

    if (data) {
      setSimulatedTime(new Date(data.sim_time));
      setTimeControlActive(true);
    }
  };

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('test_events')
      .select('*')
      .order('triggered_at', { ascending: false })
      .limit(50);

    if (data) {
      setEvents(data);
    }
  };

  const loadScenario = async (scenarioId: string) => {
    const scenario = TEST_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;

    setSelectedScenario(scenario);

    // Insert scenario into database
    const { error } = await supabase
      .from('test_scenarios')
      .upsert({
        id: scenario.id,
        name: scenario.name,
        client_profile: scenario.clientProfile,
        core_pattern: scenario.corePattern,
        attorney_status: scenario.attorneyStatus,
        timeline: scenario.timeline as any
      });

    if (error) {
      toast.error("Failed to load scenario");
      return;
    }

    // Log event
    await logEvent(scenario.id, "SCENARIO_LOADED", `Scenario "${scenario.name}" loaded`, {
      scenarioId: scenario.id
    });

    toast.success(`Scenario "${scenario.name}" loaded successfully`);
  };

  const initializeTimeControl = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('simulated_time')
      .upsert({
        sim_time: new Date().toISOString(),
        is_active: true,
        created_by: user.id
      });

    if (error) {
      toast.error("Failed to initialize time control");
      return;
    }

    setTimeControlActive(true);
    setSimulatedTime(new Date());
    toast.success("Time control activated");
  };

  const jumpTime = async (hours: number) => {
    if (!timeControlActive) {
      toast.error("Time control not active. Initialize first.");
      return;
    }

    const newTime = new Date(simulatedTime.getTime() + hours * 60 * 60 * 1000);

    const { error } = await supabase
      .from('simulated_time')
      .update({ sim_time: newTime.toISOString() })
      .eq('is_active', true);

    if (error) {
      toast.error("Failed to jump time");
      return;
    }

    setSimulatedTime(newTime);

    // Log event
    await logEvent(
      selectedScenario?.id || null,
      "TIME_JUMPED",
      `Time jumped forward by ${hours} hours`,
      { hoursJumped: hours, newTime: newTime.toISOString() }
    );

    toast.success(`Time jumped forward by ${hours} hours`);
    fetchEvents();
  };

  const resetTime = async () => {
    const { error } = await supabase
      .from('simulated_time')
      .update({ 
        sim_time: new Date().toISOString(),
        is_active: false
      })
      .eq('is_active', true);

    if (error) {
      toast.error("Failed to reset time");
      return;
    }

    setSimulatedTime(new Date());
    setTimeControlActive(false);
    toast.success("Time control reset to current time");
  };

  const logEvent = async (
    scenarioId: string | null,
    eventType: string,
    description: string,
    metadata?: any
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('test_events').insert({
      scenario_id: scenarioId,
      event_type: eventType,
      event_description: description,
      triggered_at: simulatedTime.toISOString(),
      actor_id: user?.id,
      metadata: metadata || {}
    });
  };

  const clearEvents = async () => {
    const { error } = await supabase
      .from('test_events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      toast.error("Failed to clear events");
      return;
    }

    setEvents([]);
    toast.success("All test events cleared");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Test Scenario Manager</h1>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <span className="text-lg font-mono">
            {simulatedTime.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Scenario Selection */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Load Test Scenario</h2>
        <div className="space-y-4">
          <div>
            <Label>Select Scenario (1-30)</Label>
            <Select onValueChange={loadScenario}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a scenario..." />
              </SelectTrigger>
              <SelectContent>
                {TEST_SCENARIOS.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedScenario && (
            <div className="border-l-4 border-primary pl-4 space-y-2">
              <h3 className="font-semibold">{selectedScenario.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedScenario.clientProfile}</p>
              <p className="text-sm"><strong>Pattern:</strong> {selectedScenario.corePattern}</p>
              <p className="text-sm"><strong>Attorney:</strong> {selectedScenario.attorneyStatus}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Time Control Panel */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Time Control Panel
        </h2>
        <div className="space-y-4">
          {!timeControlActive ? (
            <Button onClick={initializeTimeControl} className="w-full">
              <Play className="mr-2 h-4 w-4" />
              Initialize Time Control
            </Button>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Jump by Hours</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={hoursToJump}
                    onChange={(e) => setHoursToJump(Number(e.target.value))}
                    min="1"
                  />
                  <Button onClick={() => jumpTime(hoursToJump)}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Jump by Days</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={daysToJump}
                    onChange={(e) => setDaysToJump(Number(e.target.value))}
                    min="1"
                  />
                  <Button onClick={() => jumpTime(daysToJump * 24)}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-end">
                <Button onClick={resetTime} variant="destructive" className="w-full">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Time
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Event Log */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Event Log</h2>
          <Button onClick={clearEvents} variant="outline" size="sm">
            Clear All Events
          </Button>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {events.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No events logged yet</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="border-l-2 border-primary pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{event.event_type}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.triggered_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{event.event_description}</p>
                  {event.actor_role && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Actor: {event.actor_name} ({event.actor_role})
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Timeline View */}
      {selectedScenario && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Scenario Timeline</h2>
          <div className="space-y-4">
            {selectedScenario.timeline.map((event, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-32 font-mono text-sm text-muted-foreground">
                  {event.time}
                </div>
                <div className="flex-1 border-l-2 border-primary pl-4">
                  <p className="font-medium">{event.description}</p>
                  {event.expectedAction && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Expected: {event.expectedAction}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
