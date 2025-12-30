import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Video, Plus } from "lucide-react";
import { useState } from "react";

interface AppointmentTrackingProps {
  caseId: string;
}

interface Appointment {
  id: string;
  title: string;
  provider: string;
  date: string;
  time: string;
  location: string;
  type: "in-person" | "telehealth";
  status: "scheduled" | "completed" | "cancelled" | "no-show";
}

export default function AppointmentTracking({ caseId }: AppointmentTrackingProps) {
  const [appointments] = useState<Appointment[]>([
    {
      id: "1",
      title: "Physical Therapy",
      provider: "Dr. Sarah Johnson",
      date: "2025-02-15",
      time: "10:00 AM",
      location: "ABC Physical Therapy Center",
      type: "in-person",
      status: "scheduled",
    },
    {
      id: "2",
      title: "Follow-up Consultation",
      provider: "Dr. Michael Chen",
      date: "2025-02-20",
      time: "2:30 PM",
      location: "Telehealth",
      type: "telehealth",
      status: "scheduled",
    },
    {
      id: "3",
      title: "MRI Scan",
      provider: "City Imaging Center",
      date: "2025-01-28",
      time: "9:00 AM",
      location: "City Imaging Center - Downtown",
      type: "in-person",
      status: "completed",
    },
  ]);

  const getStatusBadge = (status: Appointment["status"]) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      scheduled: { variant: "default", label: "Scheduled" },
      completed: { variant: "outline", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      "no-show": { variant: "destructive", label: "No-Show" },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const upcomingAppointments = appointments.filter((apt) => apt.status === "scheduled");
  const pastAppointments = appointments.filter((apt) => apt.status !== "scheduled");

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Upcoming Appointments</h3>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Appointment
          </Button>
        </div>

        {upcomingAppointments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No upcoming appointments</p>
        ) : (
          <div className="space-y-4">
            {upcomingAppointments.map((apt) => (
              <div key={apt.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{apt.title}</h4>
                      {getStatusBadge(apt.status)}
                      {apt.type === "telehealth" && (
                        <Badge variant="secondary">
                          <Video className="h-3 w-3 mr-1" />
                          Telehealth
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{apt.provider}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(apt.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{apt.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{apt.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Reschedule
                    </Button>
                    <Button variant="ghost" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Appointment History</h3>
        {pastAppointments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No past appointments</p>
        ) : (
          <div className="space-y-3">
            {pastAppointments.map((apt) => (
              <div key={apt.id} className="p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{apt.title}</h4>
                      {getStatusBadge(apt.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{apt.provider}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(apt.date).toLocaleDateString()} at {apt.time}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
