import { useState, useEffect } from "react";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, Edit } from "lucide-react";
import { format } from "date-fns";

interface Appointment {
  id: string;
  case_id: string;
  client_id: string;
  provider_id: string | null;
  provider_ref_id: string | null;
  title: string;
  appointment_date: string;
  appointment_time: string | null;
  location: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  client_name?: string;
  provider_name?: string;
}

export function AppointmentManagement() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  async function fetchAppointments() {
    try {
      setLoading(true);

      // Fetch appointments where user is client or provider
      const { data: apptData, error } = await supabase
        .from("client_appointments")
        .select("*")
        .or(`client_id.eq.${user!.id},provider_id.eq.${user!.id}`)
        .order("appointment_date", { ascending: true });

      if (error) throw error;

      // Enrich with names
      const enriched = await Promise.all(
        (apptData || []).map(async (appt) => {
          const { data: clientProfile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", appt.client_id)
            .maybeSingle();

          let providerName = null;
          if (appt.provider_id) {
            const { data: providerProfile } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("user_id", appt.provider_id)
              .maybeSingle();
            providerName = providerProfile?.display_name;
          } else if (appt.provider_ref_id) {
            const { data: provider } = await supabase
              .from("providers")
              .select("name")
              .eq("id", appt.provider_ref_id)
              .maybeSingle();
            providerName = provider?.name;
          }

          return {
            ...appt,
            client_name: clientProfile?.display_name || "Unknown Client",
            provider_name: providerName || "Unknown Provider",
          };
        })
      );

      setAppointments(enriched);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(apptId: string, newStatus: string) {
    try {
      setUpdating(true);

      const updateData: any = { status: newStatus };
      if (newStatus === "cancelled" && cancellationReason) {
        updateData.notes = `Cancellation reason: ${cancellationReason}${
          appointments.find((a) => a.id === apptId)?.notes
            ? `\n\nOriginal notes: ${appointments.find((a) => a.id === apptId)?.notes}`
            : ""
        }`;
      }

      const { error } = await supabase
        .from("client_appointments")
        .update(updateData)
        .eq("id", apptId);

      if (error) throw error;

      toast.success(`Appointment ${newStatus}`);
      setStatusDialogOpen(false);
      setCancellationReason("");
      fetchAppointments();
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      toast.error("Failed to update appointment");
    } finally {
      setUpdating(false);
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "cancelled":
        return "destructive";
      case "completed":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Loading appointments...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">My Appointments</h2>
        <Badge variant="secondary" className="ml-auto">
          {appointments.length} Total
        </Badge>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No appointments scheduled</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <Card key={appt.id} className="p-4 border-l-4 border-l-primary">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{appt.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(appt.appointment_date), "MMM dd, yyyy")}
                      </div>
                      {appt.appointment_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {appt.appointment_time}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {appt.client_id === user?.id
                          ? `Provider: ${appt.provider_name}`
                          : `Client: ${appt.client_name}`}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(appt.status)}>
                    {appt.status || "scheduled"}
                  </Badge>
                </div>

                {appt.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span className="text-muted-foreground">{appt.location}</span>
                  </div>
                )}

                {appt.notes && (
                  <div className="bg-muted/50 p-3 rounded-md text-sm">
                    <p className="text-muted-foreground">{appt.notes}</p>
                  </div>
                )}

                {/* Actions */}
                {appt.status !== "cancelled" && appt.status !== "completed" && (
                  <div className="flex gap-2 pt-2">
                    {appt.status !== "confirmed" && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleStatusUpdate(appt.id, "confirmed")}
                        disabled={updating}
                        className="bg-success hover:bg-success/90"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Confirm
                      </Button>
                    )}
                    <Dialog
                      open={statusDialogOpen && selectedAppt?.id === appt.id}
                      onOpenChange={(open) => {
                        setStatusDialogOpen(open);
                        if (open) setSelectedAppt(appt);
                        else {
                          setSelectedAppt(null);
                          setCancellationReason("");
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cancel Appointment</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p className="text-sm text-muted-foreground">
                            Are you sure you want to cancel this appointment?
                          </p>
                          <div>
                            <Label htmlFor="reason">Cancellation Reason (Optional)</Label>
                            <Textarea
                              id="reason"
                              value={cancellationReason}
                              onChange={(e) => setCancellationReason(e.target.value)}
                              placeholder="Provide a reason for cancellation..."
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setStatusDialogOpen(false)}
                            >
                              Keep Appointment
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleStatusUpdate(appt.id, "cancelled")}
                              disabled={updating}
                            >
                              {updating ? "Cancelling..." : "Confirm Cancellation"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {appt.status === "confirmed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(appt.id, "completed")}
                        disabled={updating}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
