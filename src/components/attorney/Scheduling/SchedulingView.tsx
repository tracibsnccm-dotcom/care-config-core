import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Plus, 
  User, 
  MapPin,
  Video,
  Phone
} from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { toast } from "@/hooks/use-toast";

type AppointmentType = "in_person" | "video" | "phone";

interface Appointment {
  id: string;
  caseId: string;
  caseName: string;
  title: string;
  description: string;
  provider: string;
  providerName: string;
  type: AppointmentType;
  location?: string;
  date: string;
  time: string;
  duration: number;
  notes?: string;
}

// Mock appointments
const mockAppointments: Appointment[] = [
  {
    id: "APT-001",
    caseId: "CASE-2024-001",
    caseName: "A*** B***",
    title: "Initial Physical Therapy Consultation",
    description: "First PT session for whiplash treatment",
    provider: "PROV-001",
    providerName: "Dr. Sarah Chen",
    type: "in_person",
    location: "123 Medical Plaza, Los Angeles, CA",
    date: "2024-11-08",
    time: "10:00",
    duration: 60,
  },
  {
    id: "APT-002",
    caseId: "CASE-2024-001",
    caseName: "A*** B***",
    title: "Follow-up Assessment",
    description: "Review progress and adjust treatment plan",
    provider: "PROV-003",
    providerName: "Dr. Jennifer Park",
    type: "video",
    date: "2024-11-12",
    time: "14:00",
    duration: 30,
  },
];

export function SchedulingView() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newAppointment, setNewAppointment] = useState({
    caseId: "",
    title: "",
    description: "",
    provider: "",
    type: "in_person" as AppointmentType,
    location: "",
    date: "",
    time: "",
    duration: 60,
    notes: "",
  });

  const handleCreateAppointment = () => {
    if (!newAppointment.caseId || !newAppointment.title || !newAppointment.provider || 
        !newAppointment.date || !newAppointment.time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const appointment: Appointment = {
      id: `APT-${String(appointments.length + 1).padStart(3, "0")}`,
      caseName: "Client Name",
      providerName: "Provider Name",
      ...newAppointment,
    };

    setAppointments([...appointments, appointment]);
    setDialogOpen(false);
    setNewAppointment({
      caseId: "",
      title: "",
      description: "",
      provider: "",
      type: "in_person",
      location: "",
      date: "",
      time: "",
      duration: 60,
      notes: "",
    });

    toast({
      title: "Appointment Scheduled",
      description: "The appointment has been scheduled successfully",
    });
  };

  const getTypeIcon = (type: AppointmentType) => {
    switch (type) {
      case "in_person":
        return <MapPin className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: AppointmentType) => {
    switch (type) {
      case "in_person":
        return "In-Person";
      case "video":
        return "Video Call";
      case "phone":
        return "Phone Call";
    }
  };

  // Generate week view
  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return appointments.filter((apt) => apt.date === dateStr);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Appointment Scheduling</h2>
          <p className="text-muted-foreground">Schedule and manage provider appointments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>
                Schedule a medical appointment for a client with a provider
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="caseId">Case ID *</Label>
                <Input
                  id="caseId"
                  placeholder="CASE-2024-001"
                  value={newAppointment.caseId}
                  onChange={(e) => setNewAppointment({ ...newAppointment, caseId: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Appointment Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Initial Physical Therapy Consultation"
                  value={newAppointment.title}
                  onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the appointment..."
                  value={newAppointment.description}
                  onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="provider">Provider *</Label>
                <Select
                  value={newAppointment.provider}
                  onValueChange={(value) => setNewAppointment({ ...newAppointment, provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROV-001">Dr. Sarah Chen - Physical Therapy</SelectItem>
                    <SelectItem value="PROV-002">Dr. Michael Rodriguez - Orthopedic Surgery</SelectItem>
                    <SelectItem value="PROV-003">Dr. Jennifer Park - Pain Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Appointment Type</Label>
                  <Select
                    value={newAppointment.type}
                    onValueChange={(value: AppointmentType) => 
                      setNewAppointment({ ...newAppointment, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_person">In-Person</SelectItem>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select
                    value={String(newAppointment.duration)}
                    onValueChange={(value) => 
                      setNewAppointment({ ...newAppointment, duration: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {newAppointment.type === "in_person" && (
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Address of the appointment"
                    value={newAppointment.location}
                    onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or instructions..."
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAppointment}>Schedule Appointment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
            >
              Previous Week
            </Button>
            <h3 className="font-semibold">
              {format(weekStart, "MMMM d")} - {format(addDays(weekStart, 6), "MMMM d, yyyy")}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            >
              Next Week
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
            Today
          </Button>
        </div>
      </Card>

      {/* Week View */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => {
          const dayAppointments = getAppointmentsForDate(day);
          const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

          return (
            <Card key={index} className={`p-3 ${isToday ? "ring-2 ring-primary" : ""}`}>
              <div className="text-center mb-3">
                <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
                <p className={`text-lg font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
                  {format(day, "d")}
                </p>
              </div>
              <div className="space-y-2">
                {dayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-2 bg-primary/10 border border-primary/20 rounded text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {getTypeIcon(apt.type)}
                      <span className="font-medium">{apt.time}</span>
                    </div>
                    <p className="text-foreground font-medium truncate">{apt.title}</p>
                    <p className="text-muted-foreground truncate">{apt.caseName}</p>
                  </div>
                ))}
                {dayAppointments.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No appointments</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Upcoming Appointments List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">All Appointments</h3>
        <div className="space-y-3">
          {appointments
            .sort((a, b) => new Date(a.date + " " + a.time).getTime() - new Date(b.date + " " + b.time).getTime())
            .map((apt) => (
              <Card key={apt.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeIcon(apt.type)}
                      <div>
                        <h4 className="font-semibold text-foreground">{apt.title}</h4>
                        <p className="text-sm text-muted-foreground">{apt.description}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        {getTypeLabel(apt.type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mt-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{apt.caseName} ({apt.caseId})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{apt.providerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(apt.date), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{apt.time} ({apt.duration} min)</span>
                      </div>
                    </div>
                    {apt.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <MapPin className="w-4 h-4" />
                        <span>{apt.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">Cancel</Button>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
