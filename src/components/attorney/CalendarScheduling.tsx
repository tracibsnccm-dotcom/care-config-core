import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar as CalendarIcon, Clock, MapPin, Plus, AlertCircle } from "lucide-react";
import { useState } from "react";
import { format, isSameDay, addDays } from "date-fns";

interface Event {
  id: string;
  title: string;
  type: 'court' | 'meeting' | 'deadline' | 'appointment';
  date: Date;
  time: string;
  location?: string;
  caseId?: string;
  priority: 'high' | 'medium' | 'low';
}

export default function CalendarScheduling() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const events: Event[] = [
    {
      id: '1',
      title: 'Court Hearing - Case RC-12345678',
      type: 'court',
      date: new Date(),
      time: '10:00 AM',
      location: 'District Court Room 3',
      caseId: 'RC-12345678',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Client Meeting - Initial Consultation',
      type: 'meeting',
      date: new Date(),
      time: '2:00 PM',
      location: 'Office Conference Room',
      caseId: 'RC-87654321',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Document Submission Deadline',
      type: 'deadline',
      date: addDays(new Date(), 2),
      time: '5:00 PM',
      caseId: 'RC-11223344',
      priority: 'high'
    }
  ];

  const selectedDateEvents = events.filter(event => 
    isSameDay(event.date, selectedDate)
  );

  const upcomingEvents = events
    .filter(event => event.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">High Priority</Badge>;
      case 'medium': return <Badge variant="secondary">Medium</Badge>;
      case 'low': return <Badge variant="outline">Low</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Calendar & Scheduling</h2>
          <p className="text-sm text-muted-foreground">Manage appointments, deadlines, and court dates</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border-0"
          />

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">
              Events on {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            {selectedDateEvents.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {selectedDateEvents.map(event => (
                    <div key={event.id} className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-foreground">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{event.time}</p>
                        </div>
                        {getPriorityBadge(event.priority)}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No events scheduled for this date</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {upcomingEvents.map(event => (
                <div key={event.id} className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                  <p className="font-medium text-sm text-foreground truncate">{event.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{format(event.date, 'MMM d')}</span>
                    <span>•</span>
                    <span>{event.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
