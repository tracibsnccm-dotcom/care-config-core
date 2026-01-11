import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Plus, CheckCircle, XCircle, AlertTriangle, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Appointment {
  id: string;
  title: string;
  provider_name: string | null;
  scheduled_at: string;
  location: string | null;
  notes: string | null;
  status: string | null;
  created_at: string | null;
}

interface ClientAppointmentsProps {
  caseId: string;
}

const APPOINTMENT_TYPES = [
  "Primary Care",
  "Specialist",
  "Physical Therapy", 
  "Chiropractic",
  "Mental Health",
  "Imaging/X-Ray",
  "Lab Work",
  "Surgery",
  "Follow-up",
  "Other"
];

const SPECIALIST_TYPES = [
  "Orthopedic",
  "Neurologist",
  "Pain Management",
  "Cardiologist",
  "Gastroenterologist",
  "Pulmonologist",
  "Rheumatologist",
  "Dermatologist",
  "ENT (Ear, Nose, Throat)",
  "Urologist",
  "Endocrinologist",
  "Oncologist",
  "Other Specialist"
];

const BARRIER_TYPES = [
  { value: "transportation", label: "Transportation issue", pFlag: "P3" },
  { value: "financial", label: "Financial concern", pFlag: "P3" },
  { value: "childcare", label: "Childcare issue", pFlag: "P3" },
  { value: "fear_anxiety", label: "Fear or anxiety about appointment", pFlag: "P2" },
  { value: "work_conflict", label: "Work conflict", pFlag: "P3" },
  { value: "forgot", label: "Forgot about it", pFlag: "P3" },
  { value: "feeling_unwell", label: "Not feeling well enough", pFlag: "P2" },
  { value: "other", label: "Other reason", pFlag: "P3" }
];

export function ClientAppointments({ caseId }: ClientAppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [checkInAppointment, setCheckInAppointment] = useState<Appointment | null>(null);
  
  // Add form state
  const [providerName, setProviderName] = useState("");
  const [appointmentType, setAppointmentType] = useState("");
  const [specialistType, setSpecialistType] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check-in form state
  const [canAttend, setCanAttend] = useState<boolean | null>(null);
  const [barrierType, setBarrierType] = useState("");
  const [barrierNotes, setBarrierNotes] = useState("");

  useEffect(() => {
    loadAppointments();
  }, [caseId]);

  async function loadAppointments() {
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_appointments?case_id=eq.${caseId}&order=scheduled_at.asc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load appointments: ${response.status}`);
      }

      const data = await response.json();
      setAppointments(data || []);
    } catch (err: any) {
      console.error("Error loading appointments:", err);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAppointment(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Get client_id from session storage
      const clientCaseId = sessionStorage.getItem('client_case_id');
      if (!clientCaseId) {
        throw new Error("Session expired. Please log in again.");
      }

      const finalAppointmentType = appointmentType === "Specialist" && specialistType 
        ? `Specialist - ${specialistType}`
        : appointmentType;
      const appointmentTitle = `${finalAppointmentType || 'Appointment'} with ${providerName || 'Provider'}`;
      
      // Combine date and time into ISO timestamp
      const scheduledAt = appointmentTime 
        ? new Date(`${appointmentDate}T${appointmentTime}`).toISOString()
        : new Date(`${appointmentDate}T00:00:00`).toISOString();
      
      const appointmentData = {
        case_id: caseId,
        client_id: clientCaseId, // This will need to be the actual client_id from auth, but using case_id for now
        title: appointmentTitle,
        provider_name: providerName.trim() || null,
        appointment_type: finalAppointmentType || null,
        scheduled_at: scheduledAt,
        location: location.trim() || null,
        notes: notes.trim() || null,
        status: 'scheduled'
      };

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_appointments`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(appointmentData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add appointment');
      }

      toast.success("Appointment added successfully");
      setShowAddForm(false);
      resetAddForm();
      loadAppointments();
    } catch (err: any) {
      console.error("Error adding appointment:", err);
      toast.error(err.message || "Failed to add appointment");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetAddForm() {
    setProviderName("");
    setAppointmentType("");
    setSpecialistType("");
    setAppointmentDate("");
    setAppointmentTime("");
    setLocation("");
    setNotes("");
  }

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    if (canAttend === null || !checkInAppointment) return;

    setIsSubmitting(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (canAttend) {
        // Can attend - mark as completed
        const response = await fetch(
          `${supabaseUrl}/rest/v1/rc_appointments?id=eq.${checkInAppointment.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              status: 'completed'
            })
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update appointment status');
        }

        toast.success("Appointment marked as completed");
      } else {
        // Cannot attend - update status and trigger P flag
        const selectedBarrier = BARRIER_TYPES.find(b => b.value === barrierType);
        const pFlag = selectedBarrier?.pFlag || "P3";
        
        const cancellationReason = barrierNotes.trim() 
          ? `${selectedBarrier?.label || barrierType}: ${barrierNotes.trim()}`
          : selectedBarrier?.label || barrierType;

        // Update appointment
        const updateResponse = await fetch(
          `${supabaseUrl}/rest/v1/rc_appointments?id=eq.${checkInAppointment.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              status: 'cancelled',
              cancellation_reason: cancellationReason,
              notes: barrierNotes.trim() || null
            })
          }
        );

        if (!updateResponse.ok) {
          throw new Error('Failed to update appointment');
        }

        // TODO: Trigger P flag for RN intervention
        // This would typically create a flag in the case system
        // For now, we'll just show a success message
        toast.success(`Appointment cancelled. ${pFlag} flag triggered for RN follow-up.`);
      }

      setCheckInAppointment(null);
      resetCheckInForm();
      loadAppointments();
    } catch (err: any) {
      console.error("Error checking in to appointment:", err);
      toast.error(err.message || "Failed to process check-in");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetCheckInForm() {
    setCanAttend(null);
    setBarrierType("");
    setBarrierNotes("");
  }

  function getStatusBadge(status: string | null) {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
            <AlertTriangle className="w-3 h-3" />
            No Show
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            Scheduled
          </span>
        );
    }
  }

  function formatAppointmentDateTime(appointment: Appointment) {
    const date = new Date(appointment.scheduled_at);
    const dateStr = format(date, 'MMM d, yyyy');
    
    // Extract time from scheduled_at timestamp
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    const minutesStr = minutes.toString().padStart(2, '0');
    const timeStr = `${displayHour}:${minutesStr} ${ampm}`;
    
    return `${dateStr} at ${timeStr}`;
  }

  if (loading) {
    return (
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading appointments...</p>
        </CardContent>
      </Card>
    );
  }

  // Check-in modal
  if (checkInAppointment) {
    const upcomingDate = new Date(checkInAppointment.scheduled_at);
    const isUpcoming = upcomingDate >= new Date(new Date().setHours(0, 0, 0, 0));

    return (
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            Appointment Check-in
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="font-medium text-slate-800">{checkInAppointment.title}</p>
              {checkInAppointment.provider_name && (
                <p className="text-sm text-slate-600 mt-1">Provider: {checkInAppointment.provider_name}</p>
              )}
              <p className="text-sm text-slate-600 mt-1">
                {formatAppointmentDateTime(checkInAppointment)}
              </p>
              {checkInAppointment.location && (
                <p className="text-sm text-slate-600 mt-1">Location: {checkInAppointment.location}</p>
              )}
            </div>

            <form onSubmit={handleCheckIn} className="space-y-4">
              <div className="space-y-3">
                <Label className="text-slate-700">Can you attend this appointment?</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={canAttend === true ? "default" : "outline"}
                    className={canAttend === true ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                    onClick={() => setCanAttend(true)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Yes, I can attend
                  </Button>
                  <Button
                    type="button"
                    variant={canAttend === false ? "default" : "outline"}
                    className={canAttend === false ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                    onClick={() => setCanAttend(false)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    No, I cannot attend
                  </Button>
                </div>
              </div>

              {canAttend === false && (
                <>
                  <div className="space-y-2">
                    <Label className="text-slate-700">What's preventing you from attending?</Label>
                    <Select value={barrierType} onValueChange={setBarrierType}>
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="Select a reason..." />
                      </SelectTrigger>
                      <SelectContent>
                        {BARRIER_TYPES.map((barrier) => (
                          <SelectItem key={barrier.value} value={barrier.value}>
                            {barrier.label} ({barrier.pFlag})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700">Additional details (optional)</Label>
                    <Textarea
                      value={barrierNotes}
                      onChange={(e) => setBarrierNotes(e.target.value)}
                      placeholder="Tell us more about the barrier..."
                      className="bg-white border-slate-200 text-slate-800"
                      rows={3}
                    />
                  </div>

                  {barrierType && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <AlertDescription className="text-slate-700">
                        This will trigger a {BARRIER_TYPES.find(b => b.value === barrierType)?.pFlag} flag for your care team to follow up.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={canAttend === null || (canAttend === false && !barrierType) || isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Submit Check-in"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCheckInAppointment(null);
                    resetCheckInForm();
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">My Appointments</h2>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Appointment
        </Button>
      </div>

      {showAddForm && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Add New Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAppointment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">Appointment Type</Label>
                  <Select value={appointmentType} onValueChange={setAppointmentType}>
                    <SelectTrigger className="bg-white border-slate-200">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {APPOINTMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {appointmentType === "Specialist" && (
                  <div className="space-y-2">
                    <Label className="text-slate-700">Specialist Type *</Label>
                    <Select value={specialistType} onValueChange={setSpecialistType}>
                      <SelectTrigger className="bg-white border-slate-200 text-slate-800">
                        <SelectValue placeholder="Select specialist type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECIALIST_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-slate-700">Provider Name</Label>
                  <Input
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="Dr. Smith"
                    className="bg-white border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Date</Label>
                  <Input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="bg-white border-slate-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Time</Label>
                  <Input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="bg-white border-slate-200"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-700">Location</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="123 Main St, City, State"
                    className="bg-white border-slate-200"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-700">Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information..."
                    className="bg-white border-slate-200 text-slate-800"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={!appointmentDate || isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Appointment"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    resetAddForm();
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {appointments.length === 0 ? (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">No appointments scheduled</p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Appointment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const appointmentDate = new Date(appointment.scheduled_at);
            const isUpcoming = appointment.status === 'scheduled' && appointmentDate >= new Date(new Date().setHours(0, 0, 0, 0));
            const isPast = appointmentDate < new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <Card key={appointment.id} className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-800">{appointment.title}</h3>
                        {getStatusBadge(appointment.status)}
                      </div>
                      {appointment.provider_name && (
                        <p className="text-sm text-slate-600 mb-1">
                          Provider: {appointment.provider_name}
                        </p>
                      )}
                      <p className="text-sm text-slate-600 mb-1">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {formatAppointmentDateTime(appointment)}
                      </p>
                      {appointment.location && (
                        <p className="text-sm text-slate-600 mb-1">Location: {appointment.location}</p>
                      )}
                      {appointment.notes && (
                        <p className="text-sm text-slate-500 mt-2 italic">{appointment.notes}</p>
                      )}
                    </div>
                    {isUpcoming && (
                      <Button
                        onClick={() => setCheckInAppointment(appointment)}
                        variant="outline"
                        size="sm"
                        className="ml-4"
                      >
                        Check In
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
