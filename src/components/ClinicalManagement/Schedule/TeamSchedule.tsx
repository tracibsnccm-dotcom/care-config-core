import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTeamSchedule } from "@/hooks/useTeamSchedule";
import { Calendar, Clock, MapPin, Users, Plus } from "lucide-react";
import { format, isToday, isTomorrow, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { useState } from "react";

export function TeamSchedule() {
  const { events, loading } = useTeamSchedule();
  const [view, setView] = useState<'week' | 'month'>('week');

  if (loading) {
    return <div className="text-muted-foreground">Loading schedule...</div>;
  }

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const todayEvents = events.filter(e => isToday(new Date(e.start_time)));
  const tomorrowEvents = events.filter(e => isTomorrow(new Date(e.start_time)));
  const thisWeekEvents = events.filter(e => 
    isWithinInterval(new Date(e.start_time), { start: weekStart, end: weekEnd })
  );

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      meeting: 'bg-blue-100 text-blue-800 border-blue-200',
      pto: 'bg-purple-100 text-purple-800 border-purple-200',
      training: 'bg-green-100 text-green-800 border-green-200',
      deadline: 'bg-red-100 text-red-800 border-red-200',
      review: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getEventTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      meeting: Users,
      pto: Calendar,
      training: Users,
      deadline: Clock,
      review: Users,
    };
    const Icon = icons[type] || Calendar;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team Schedule</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage team events and appointments</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Quick View Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events scheduled</p>
            ) : (
              todayEvents.map((event) => (
                <Card key={event.id} className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-foreground mb-1">{event.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Clock className="h-3 w-3" />
                          {format(new Date(event.start_time), 'h:mm a')}
                        </div>
                        <Badge variant="outline" className={`text-xs ${getEventTypeColor(event.event_type)}`}>
                          {event.event_type}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Tomorrow */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Tomorrow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tomorrowEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events scheduled</p>
            ) : (
              tomorrowEvents.map((event) => (
                <Card key={event.id} className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-foreground mb-1">{event.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Clock className="h-3 w-3" />
                          {format(new Date(event.start_time), 'h:mm a')}
                        </div>
                        <Badge variant="outline" className={`text-xs ${getEventTypeColor(event.event_type)}`}>
                          {event.event_type}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* This Week */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {thisWeekEvents.slice(0, 5).map((event) => (
              <Card key={event.id} className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground mb-1">{event.title}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.start_time), 'MMM dd, h:mm a')}
                      </div>
                      <Badge variant="outline" className={`text-xs ${getEventTypeColor(event.event_type)}`}>
                        {event.event_type}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {thisWeekEvents.length > 5 && (
              <Button variant="outline" size="sm" className="w-full">
                View All {thisWeekEvents.length} Events
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events List */}
      <Card>
        <CardHeader>
          <CardTitle>All Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.slice(0, 10).map((event) => {
              const EventIcon = getEventTypeIcon(event.event_type);
              
              return (
                <div key={event.id} className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className={`p-3 rounded-lg ${getEventTypeColor(event.event_type)}`}>
                    {EventIcon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{event.title}</div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.start_time), 'MMM dd, yyyy • h:mm a')}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={getEventTypeColor(event.event_type)}>
                    {event.event_type}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}