import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pill, Plus, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Medication {
  id: string;
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
  prescribing_doctor: string | null;
  start_date: string | null;
  side_effects: string | null;
  is_active: boolean;
  created_at: string;
}

interface ClientMedicationTrackerProps {
  caseId: string;
}

export function ClientMedicationTracker({ caseId }: ClientMedicationTrackerProps) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newMed, setNewMed] = useState({
    medication_name: "",
    dosage: "",
    frequency: "",
    prescribing_doctor: "",
    start_date: "",
    side_effects: "",
  });

  useEffect(() => {
    fetchMedications();
  }, [caseId]);

  async function fetchMedications() {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("client_medications")
        .select("*")
        .eq("client_id", user.data.user?.id)
        .eq("case_id", caseId)
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMedications(data || []);
    } catch (err: any) {
      console.error("Error fetching medications:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMedication() {
    if (!newMed.medication_name.trim()) {
      toast.error("Please enter medication name");
      return;
    }

    try {
      const user = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("client_medications")
        .insert({
          client_id: user.data.user?.id,
          case_id: caseId,
          ...newMed,
        });

      if (error) throw error;

      toast.success("Medication added successfully!");
      setNewMed({
        medication_name: "",
        dosage: "",
        frequency: "",
        prescribing_doctor: "",
        start_date: "",
        side_effects: "",
      });
      setShowForm(false);
      fetchMedications();
    } catch (err: any) {
      console.error("Error adding medication:", err);
      toast.error("Failed to add medication");
    }
  }

  async function toggleMedication(medId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("client_medications")
        .update({ 
          is_active: !currentStatus,
          end_date: !currentStatus ? null : new Date().toISOString().split('T')[0]
        })
        .eq("id", medId);

      if (error) throw error;
      fetchMedications();
      toast.success(!currentStatus ? "Medication reactivated" : "Medication marked as stopped");
    } catch (err: any) {
      console.error("Error toggling medication:", err);
      toast.error("Failed to update medication");
    }
  }

  const activeMeds = medications.filter(m => m.is_active);
  const inactiveMeds = medications.filter(m => !m.is_active);

  return (
    <Card className="p-6 border-rcms-gold bg-white shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Pill className="w-6 h-6 text-rcms-teal" />
          My Medications
        </h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="bg-rcms-gold text-rcms-black hover:bg-rcms-black hover:text-rcms-gold transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Medication
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border border-border rounded-lg bg-muted/20">
          <div className="space-y-4">
            <div>
              <Label>Medication Name *</Label>
              <Input
                value={newMed.medication_name}
                onChange={(e) => setNewMed({ ...newMed, medication_name: e.target.value })}
                placeholder="e.g., Ibuprofen"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dosage</Label>
                <Input
                  value={newMed.dosage}
                  onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                  placeholder="e.g., 200mg"
                />
              </div>
              <div>
                <Label>Frequency</Label>
                <Input
                  value={newMed.frequency}
                  onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                  placeholder="e.g., 3 times daily"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prescribing Doctor</Label>
                <Input
                  value={newMed.prescribing_doctor}
                  onChange={(e) => setNewMed({ ...newMed, prescribing_doctor: e.target.value })}
                  placeholder="Dr. Smith"
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newMed.start_date}
                  onChange={(e) => setNewMed({ ...newMed, start_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Side Effects (Optional)</Label>
              <Textarea
                value={newMed.side_effects}
                onChange={(e) => setNewMed({ ...newMed, side_effects: e.target.value })}
                placeholder="Any side effects you've noticed..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddMedication} className="bg-rcms-gold text-rcms-black hover:bg-rcms-black hover:text-rcms-gold">
                Save Medication
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse h-24 bg-muted rounded"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {activeMeds.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">Current Medications</h3>
              <div className="space-y-3">
                {activeMeds.map((med) => (
                  <div key={med.id} className="p-4 border border-border rounded-lg bg-background">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{med.medication_name}</p>
                        <div className="text-sm text-muted-foreground mt-1 space-y-1">
                          {med.dosage && <p>Dosage: {med.dosage}</p>}
                          {med.frequency && <p>Frequency: {med.frequency}</p>}
                          {med.prescribing_doctor && <p>Prescribed by: {med.prescribing_doctor}</p>}
                          {med.start_date && <p>Since: {new Date(med.start_date).toLocaleDateString()}</p>}
                        </div>
                        {med.side_effects && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                            <p className="text-yellow-800"><strong>Side Effects:</strong> {med.side_effects}</p>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleMedication(med.id, med.is_active)}
                      >
                        Stop Taking
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inactiveMeds.length > 0 && (
            <div>
              <h3 className="font-semibold text-muted-foreground mb-3">Previous Medications</h3>
              <div className="space-y-2">
                {inactiveMeds.map((med) => (
                  <div key={med.id} className="p-3 border border-border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground line-through">{med.medication_name}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleMedication(med.id, med.is_active)}
                      >
                        Resume
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {medications.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No medications tracked yet</p>
              <p className="text-sm mt-1">Add your current medications to track them</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
