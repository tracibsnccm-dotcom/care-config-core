import { useState, useEffect } from "react";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  time_slot: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ProviderAvailabilityScheduler() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState<string | null>(null);

  // New slot state
  const [newDay, setNewDay] = useState(1);
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("17:00");

  useEffect(() => {
    if (user) {
      fetchProviderAndSlots();
    }
  }, [user]);

  async function fetchProviderAndSlots() {
    try {
      setLoading(true);

      // Get provider ID
      const { data: provider, error: providerError } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (providerError) throw providerError;

      if (provider) {
        setProviderId(provider.id);

        // Fetch availability slots
        const { data: slotsData, error: slotsError } = await supabase
          .from("provider_availability_slots")
          .select("*")
          .eq("provider_id", provider.id)
          .order("day_of_week")
          .order("start_time");

        if (slotsError) throw slotsError;
        setSlots(slotsData || []);
      }
    } catch (error: any) {
      console.error("Error fetching availability:", error);
      toast.error("Failed to load availability");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSlot() {
    if (!providerId) {
      toast.error("Provider profile not found");
      return;
    }

    try {
      const { error } = await supabase
        .from("provider_availability_slots")
        .insert([
          {
            provider_id: providerId,
            day_of_week: newDay,
            start_time: newStartTime,
            end_time: newEndTime,
            time_slot: `${newStartTime}-${newEndTime}`,
            is_available: true,
          },
        ]);

      if (error) throw error;

      toast.success("Availability slot added");
      fetchProviderAndSlots();
    } catch (error: any) {
      console.error("Error adding slot:", error);
      toast.error("Failed to add availability slot");
    }
  }

  async function handleToggleSlot(slotId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("provider_availability_slots")
        .update({ is_available: !currentStatus })
        .eq("id", slotId);

      if (error) throw error;

      toast.success(`Slot ${!currentStatus ? "enabled" : "disabled"}`);
      fetchProviderAndSlots();
    } catch (error: any) {
      console.error("Error toggling slot:", error);
      toast.error("Failed to update slot");
    }
  }

  async function handleDeleteSlot(slotId: string) {
    try {
      const { error } = await supabase
        .from("provider_availability_slots")
        .delete()
        .eq("id", slotId);

      if (error) throw error;

      toast.success("Slot deleted");
      fetchProviderAndSlots();
    } catch (error: any) {
      console.error("Error deleting slot:", error);
      toast.error("Failed to delete slot");
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Loading availability...</p>
      </Card>
    );
  }

  if (!providerId) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Please complete your provider profile first
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Availability Schedule</h2>
      </div>

      {/* Add New Slot */}
      <Card className="p-4 mb-6 bg-muted/50">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Availability Slot
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="day">Day</Label>
            <select
              id="day"
              value={newDay}
              onChange={(e) => setNewDay(parseInt(e.target.value))}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              {DAYS.map((day, idx) => (
                <option key={idx} value={idx}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="start-time">Start Time</Label>
            <Input
              id="start-time"
              type="time"
              value={newStartTime}
              onChange={(e) => setNewStartTime(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="end-time">End Time</Label>
            <Input
              id="end-time"
              type="time"
              value={newEndTime}
              onChange={(e) => setNewEndTime(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddSlot} className="w-full bg-primary hover:bg-primary-dark">
              <Plus className="w-4 h-4 mr-2" />
              Add Slot
            </Button>
          </div>
        </div>
      </Card>

      {/* Existing Slots */}
      <div className="space-y-3">
        {slots.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No availability slots configured</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first slot above to start accepting appointments
            </p>
          </div>
        ) : (
          <>
            {DAYS.map((day, dayIdx) => {
              const daySlots = slots.filter((s) => s.day_of_week === dayIdx);
              if (daySlots.length === 0) return null;

              return (
                <div key={dayIdx} className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">{day}</h4>
                  {daySlots.map((slot) => (
                    <Card
                      key={slot.id}
                      className={`p-4 flex items-center justify-between ${
                        slot.is_available ? "border-l-4 border-l-success" : "opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Clock className="w-4 h-4 text-primary" />
                        <div>
                          <div className="font-medium">
                            {slot.start_time} - {slot.end_time}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={slot.is_available ? "default" : "secondary"}>
                          {slot.is_available ? "Available" : "Disabled"}
                        </Badge>
                        <Switch
                          checked={slot.is_available}
                          onCheckedChange={() => handleToggleSlot(slot.id, slot.is_available)}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              );
            })}
          </>
        )}
      </div>
    </Card>
  );
}
