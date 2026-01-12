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
  barrier_reason?: string;
}

export default function CalendarScheduling() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [barrierReasons, setBarrierReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Fetch all appointments (not just scheduled)
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
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);

      // Fetch barrier reasons for cancelled appointments
      const cancelledIds = (data || []).filter((a: Appointment) => a.status === 'cancelled' || a.status === 'missed').map((a: Appointment) => a.id);
      if (cancelledIds.length > 0) {
        const checkinsResponse = await fetch(
          `${supabaseUrl}/rest/v1/rc_appointment_checkins?appointment_id=in.(${cancelledIds.join(',')})&can_attend=eq.false`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            }
          }
        );
        if (checkinsResponse.ok) {
          const checkinsData = await checkinsResponse.json();
          const reasons: Record<string, string> = {};
          checkinsData.forEach((checkin: any) => {
            if (checkin.barrier_type) {
              // Map barrier type to readable label
              const barrierLabels: Record<string, string> = {
                'transportation': 'Transportation issue',
                'financial': 'Financial barrier',
                'childcare': 'Childcare issue',
                'work': 'Work conflict',
                'health': 'Health issue',
                'other': checkin.barrier_notes || 'Other barrier'
              };
              reasons[checkin.appointment_id] = barrierLabels[checkin.barrier_type] || checkin.barrier_type;
            }
          });
          setBarrierReasons(reasons);
        }
      }
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
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
    .slice(0, 20);

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
                  {selectedDateEvents.map(apt => {
                    const isCancelled = apt.status === 'cancelled';
                    const isMissed = apt.status === 'missed';
                    const hasStrikethrough = isCancelled || isMissed;
                    const barrierReason = barrierReasons[apt.id];
                    
                    return (
                      <div 
                        key={apt.id} 
                        className={`p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors ${
                          isCancelled ? 'bg-red-50/50' : isMissed ? 'bg-orange-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {isCancelled && (
                                <Badge variant="destructive" className="text-xs">Cancelled</Badge>
                              )}
                              {isMissed && (
                                <Badge className="bg-orange-500 text-white text-xs">Missed</Badge>
                              )}
                              {barrierReason && (
                                <span className={`text-xs font-medium ${isCancelled ? 'text-red-600' : 'text-orange-600'}`}>
                                  Reason: {barrierReason}
                                </span>
                              )}
                            </div>
                            <div className={hasStrikethrough ? 'line-through' : ''}>
                              <p className={`font-medium ${hasStrikethrough ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {apt.title}
                                {apt.provider_name && ` with ${apt.provider_name}`}
                              </p>
                              <p className={`text-sm mt-1 ${hasStrikethrough ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                                {format(new Date(apt.appointment_date), 'MMM d, yyyy')} at {formatTime(apt.appointment_time)}
                              </p>
                            </div>
                          </div>
                        </div>
                        {apt.location && (
                          <div className={`flex items-center gap-2 text-sm mt-2 ${hasStrikethrough ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                            <MapPin className="h-4 w-4" />
                            <span>{apt.location}</span>
                          </div>
                        )}
                        {apt.notes && (
                          <p className={`text-xs mt-2 italic ${hasStrikethrough ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>{apt.notes}</p>
                        )}
                      </div>
                    );
                  })}
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
          <h3 className="text-lg font-semibold mb-4">Appointment Activity Feed</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-muted rounded"></div>
              ))}
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {upcomingEvents.length > 0 ? upcomingEvents.map(apt => {
                  const isCancelled = apt.status === 'cancelled';
                  const isMissed = apt.status === 'missed';
                  const hasStrikethrough = isCancelled || isMissed;
                  const barrierReason = barrierReasons[apt.id];
                  
                  return (
                    <div 
                      key={apt.id} 
                      className={`p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer ${
                        isCancelled ? 'bg-red-50/50' : isMissed ? 'bg-orange-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {isCancelled && (
                              <Badge variant="destructive" className="text-xs">Cancelled</Badge>
                            )}
                            {isMissed && (
                              <Badge className="bg-orange-500 text-white text-xs">Missed</Badge>
                            )}
                          </div>
                          <div className={hasStrikethrough ? 'line-through' : ''}>
                            <p className={`font-medium text-sm ${hasStrikethrough ? 'text-muted-foreground' : 'text-foreground'} truncate`}>
                              {apt.title}
                              {apt.provider_name && ` with ${apt.provider_name}`}
                            </p>
                            <div className={`flex items-center gap-2 mt-1 text-xs ${hasStrikethrough ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                              <CalendarIcon className="h-3 w-3" />
                              <span>{format(new Date(apt.appointment_date), 'MMM d, yyyy')}</span>
                              <span>•</span>
                              <span>{apt.appointment_time ? formatTime(apt.appointment_time) : "All day"}</span>
                            </div>
                          </div>
                          {barrierReason && (
                            <p className={`text-xs mt-1 font-medium ${isCancelled ? 'text-red-600' : 'text-orange-600'}`}>
                              Reason: {barrierReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No appointments</p>
                )}
              </div>
            </ScrollArea>
          )}
        </Card>
      </div>
    </div>
  );
}
