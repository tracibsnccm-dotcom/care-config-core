import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, AlertTriangle, MapPin } from "lucide-react";

interface Event {
  id: string;
  title: string;
  type: "court" | "appointment" | "deadline" | "meeting";
  date: string;
  time: string;
  location?: string;
  case_id?: string;
  priority: "high" | "medium" | "low";
}

export default function CalendarScheduling() {
  const [events] = useState<Event[]>([
    {
      id: "1",
      title: "Court Hearing - Smith Case",
      type: "court",
      date: "2025-11-05",
      time: "09:00 AM",
      location: "District Court Room 3",
      case_id: "RC-12345678",
      priority: "high"
    },
    {
      id: "2",
      title: "Client Meeting - Johnson",
      type: "appointment",
      date: "2025-11-06",
      time: "02:00 PM",
      location: "Office Conference Room",
      case_id: "RC-87654321",
      priority: "medium"
    },
    {
      id: "3",
      title: "Discovery Deadline",
      type: "deadline",
      date: "2025-11-10",
      time: "05:00 PM",
      case_id: "RC-11223344",
      priority: "high"
    }
  ]);

  const upcomingEvents = events.filter(e => 
    new Date(e.date) >= new Date()
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const todayEvents = events.filter(e => 
    new Date(e.date).toDateString() === new Date().toDateString()
  );

  const thisWeekEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate >= today && eventDate <= weekFromNow;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case "court": return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "deadline": return <Clock className="h-5 w-5 text-orange-500" />;
      case "appointment": return <Calendar className="h-5 w-5 text-blue-500" />;
      case "meeting": return <MapPin className="h-5 w-5 text-green-500" />;
      default: return <Calendar className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-2xl font-bold text-blue-500">{todayEvents.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold">{thisWeekEvents.length}</p>
            </div>
            <Clock className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-bold text-orange-500">{upcomingEvents.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          Sync Calendar
        </Button>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Upcoming Events */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
        <div className="space-y-3">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No upcoming events</p>
            </div>
          ) : (
            upcomingEvents.map((event) => (
              <Card key={event.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getEventIcon(event.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{event.title}</h4>
                        <Badge variant={getPriorityColor(event.priority)}>
                          {event.priority}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                          <Clock className="h-3 w-3 ml-2" />
                          <span>{event.time}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.case_id && (
                          <div className="text-xs">Case: {event.case_id}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">View Details</Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      {/* Deadlines Alert */}
      <Card className="p-6 border-orange-500">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-orange-500 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-2">Important Deadlines</h3>
            <div className="space-y-2">
              {events
                .filter(e => e.type === "deadline" && new Date(e.date) >= new Date())
                .map(deadline => (
                  <div key={deadline.id} className="text-sm">
                    <span className="font-medium">{deadline.title}</span>
                    <span className="text-muted-foreground ml-2">
                      - {new Date(deadline.date).toLocaleDateString()} at {deadline.time}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
