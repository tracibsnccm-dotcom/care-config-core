import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TestEvent {
  id: string;
  event_type: string;
  event_description: string;
  triggered_at: string;
  actor_name: string | null;
  metadata: any;
  created_at: string;
}

export function TestEventLog() {
  const [events, setEvents] = useState<TestEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();

    // Subscribe to new events
    const channel = supabase
      .channel('test_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'test_events',
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('test_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearAllEvents = async () => {
    try {
      const { error } = await supabase
        .from('test_events')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      toast.success('All events cleared');
      setEvents([]);
    } catch (error) {
      console.error('Error clearing events:', error);
      toast.error('Failed to clear events');
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'SCENARIO_LOADED':
        return 'text-primary';
      case 'TIME_JUMPED':
        return 'text-blue-600';
      case 'USER_ACTION':
        return 'text-green-600';
      case 'SYSTEM_EVENT':
        return 'text-purple-600';
      case 'ERROR':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Event Log</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchEvents}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={clearAllEvents}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[600px]">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No events logged yet. Events will appear here as actions are performed.
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${getEventColor(event.event_type)}`}>
                    {event.event_type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(event.triggered_at), "MMM dd, HH:mm:ss")}
                  </span>
                </div>
                <p className="text-sm mt-1">{event.event_description}</p>
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}
