import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar as CalendarIcon, Clock, MapPin, Plus, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { format, isSameDay, addDays, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface Appointment {
  id: string;
  title: string;
  provider_name: string | null;
  appointment_date: string;
  appointment_time: string | null;
  location: string | null;
  notes: string | null;
  status: string;
  case_id: string;
}

export default function CalendarScheduling() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("client_appointments")
        .select(`
          id,
          title,
          provider_name,
          appointment_date,
          appointment_time,
          location,
          notes,
          status,
          case_id
        `)
        .eq("status", "scheduled")
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  }

  const selectedDateEvents = appointments.filter(apt => 
    isSameDay(new Date(apt.appointment_date), selectedDate)
  );

  const upcomingEvents = appointments
    .filter(apt => new Date(apt.appointment_date) >= new Date())
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
    .slice(0, 5);

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "All day";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-20 bg-muted rounded"></div>
                ))}
              </div>
            ) : selectedDateEvents.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {selectedDateEvents.map(apt => (
                    <div key={apt.id} className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-foreground">{apt.title}</p>
                          {apt.provider_name && (
                            <p className="text-sm text-muted-foreground">with {apt.provider_name}</p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatTime(apt.appointment_time)}
                          </p>
                        </div>
                      </div>
                      {apt.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <MapPin className="h-4 w-4" />
                          <span>{apt.location}</span>
                        </div>
                      )}
                      {apt.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">{apt.notes}</p>
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
          <h3 className="text-lg font-semibold mb-4">Upcoming Appointments</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-muted rounded"></div>
              ))}
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {upcomingEvents.length > 0 ? upcomingEvents.map(apt => (
                  <div key={apt.id} className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                    <p className="font-medium text-sm text-foreground truncate">{apt.title}</p>
                    {apt.provider_name && (
                      <p className="text-xs text-muted-foreground">with {apt.provider_name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <CalendarIcon className="h-3 w-3" />
                      <span>{format(new Date(apt.appointment_date), 'MMM d')}</span>
                      <span>•</span>
                      <span>{apt.appointment_time ? formatTime(apt.appointment_time) : "All day"}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No upcoming appointments</p>
                )}
              </div>
            </ScrollArea>
          )}
        </Card>
      </div>
    </div>
  );
}
