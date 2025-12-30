import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pill, Plus, AlertCircle, Edit2, StopCircle, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LabeledSelect } from "@/components/LabeledSelect";

interface MedicationChange {
  id: string;
  change_type: string;
  change_reason: string;
  previous_value: any;
  new_value: any;
  notes: string | null;
  changed_at: string;
}

interface Medication {
  id: string;
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
  prescribing_doctor: string | null;
  start_date: string | null;
  end_date: string | null;
  side_effects: string | null;
  is_active: boolean;
  created_at: string;
  injury_timing: string | null;
  change_history: MedicationChange[];
}

interface ClientMedicationTrackerProps {
  caseId: string;
}

export function ClientMedicationTracker({ caseId }: ClientMedicationTrackerProps) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [showDiscontinueDialog, setShowDiscontinueDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [changeReason, setChangeReason] = useState("");
  const [discontinueReason, setDiscontinueReason] = useState("");
  const [changeNotes, setChangeNotes] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newFrequency, setNewFrequency] = useState("");
  const [medicationHistory, setMedicationHistory] = useState<MedicationChange[]>([]);
  
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
      // Map data and ensure change_history is properly typed
      const medicationsWithHistory = (data || []).map(med => ({
        ...med,
        change_history: [] as MedicationChange[] // We'll load this separately when needed
      }));
      setMedications(medicationsWithHistory as Medication[]);
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

  async function handleChange() {
    if (!selectedMed || !changeReason) {
      toast.error("Please select a change reason");
      return;
    }

    try {
      const user = await supabase.auth.getUser();
      const previousValue = {
        dosage: selectedMed.dosage,
        frequency: selectedMed.frequency,
      };
      const newValue = {
        dosage: newDosage || selectedMed.dosage,
        frequency: newFrequency || selectedMed.frequency,
      };

      // Insert change record
      const { error: changeError } = await supabase
        .from("medication_changes")
        .insert({
          medication_id: selectedMed.id,
          case_id: caseId,
          client_id: user.data.user?.id,
          change_type: "change",
          change_reason: changeReason,
          previous_value: previousValue,
          new_value: newValue,
          notes: changeNotes,
          changed_by: user.data.user?.id,
        });

      if (changeError) throw changeError;

      // Update medication
      const { error: updateError } = await supabase
        .from("client_medications")
        .update({
          dosage: newDosage || selectedMed.dosage,
          frequency: newFrequency || selectedMed.frequency,
        })
        .eq("id", selectedMed.id);

      if (updateError) throw updateError;

      toast.success("Medication updated successfully");
      setShowChangeDialog(false);
      setChangeReason("");
      setChangeNotes("");
      setNewDosage("");
      setNewFrequency("");
      fetchMedications();
    } catch (err: any) {
      console.error("Error updating medication:", err);
      toast.error("Failed to update medication");
    }
  }

  async function handleDiscontinue() {
    if (!selectedMed || !discontinueReason) {
      toast.error("Please select a discontinue reason");
      return;
    }

    try {
      const user = await supabase.auth.getUser();

      // Insert change record
      const { error: changeError } = await supabase
        .from("medication_changes")
        .insert({
          medication_id: selectedMed.id,
          case_id: caseId,
          client_id: user.data.user?.id,
          change_type: "discontinue",
          change_reason: discontinueReason,
          previous_value: { is_active: true },
          new_value: { is_active: false },
          notes: changeNotes,
          changed_by: user.data.user?.id,
        });

      if (changeError) throw changeError;

      // Update medication
      const { error: updateError } = await supabase
        .from("client_medications")
        .update({
          is_active: false,
          end_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", selectedMed.id);

      if (updateError) throw updateError;

      toast.success("Medication discontinued");
      setShowDiscontinueDialog(false);
      setDiscontinueReason("");
      setChangeNotes("");
      fetchMedications();
    } catch (err: any) {
      console.error("Error discontinuing medication:", err);
      toast.error("Failed to discontinue medication");
    }
  }

  async function loadMedicationHistory(medId: string) {
    try {
      const { data, error } = await supabase
        .from("medication_changes")
        .select("*")
        .eq("medication_id", medId)
        .order("changed_at", { ascending: false });

      if (error) throw error;
      setMedicationHistory(data || []);
    } catch (err: any) {
      console.error("Error loading history:", err);
      toast.error("Failed to load history");
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
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedMed(med);
                            setNewDosage(med.dosage || "");
                            setNewFrequency(med.frequency || "");
                            setShowChangeDialog(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Change
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedMed(med);
                            setShowDiscontinueDialog(true);
                          }}
                        >
                          <StopCircle className="w-4 h-4 mr-1" />
                          Discontinue
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedMed(med);
                            loadMedicationHistory(med.id);
                            setShowHistoryDialog(true);
                          }}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                      </div>
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
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground line-through">{med.medication_name}</p>
                        {med.end_date && (
                          <p className="text-xs text-muted-foreground">
                            Discontinued: {new Date(med.end_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedMed(med);
                          loadMedicationHistory(med.id);
                          setShowHistoryDialog(true);
                        }}
                      >
                        <History className="w-4 h-4" />
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

      {/* Change Dialog */}
      <Dialog open={showChangeDialog} onOpenChange={setShowChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Medication: {selectedMed?.medication_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <LabeledSelect
              label="Change Reason"
              value={changeReason}
              onChange={setChangeReason}
              options={[
                "Decreased dose",
                "Increased dose",
                "Changed frequency",
                "Changed medication",
                "Dose adjustment per doctor",
              ]}
            />
            <div>
              <Label>New Dosage (optional)</Label>
              <Input
                value={newDosage}
                onChange={(e) => setNewDosage(e.target.value)}
                placeholder="e.g., 400mg"
              />
            </div>
            <div>
              <Label>New Frequency (optional)</Label>
              <Input
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value)}
                placeholder="e.g., 2 times daily"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
                placeholder="Additional notes about this change..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleChange} className="bg-rcms-gold text-rcms-black hover:bg-rcms-black hover:text-rcms-gold">
                Save Change
              </Button>
              <Button onClick={() => setShowChangeDialog(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discontinue Dialog */}
      <Dialog open={showDiscontinueDialog} onOpenChange={setShowDiscontinueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discontinue Medication: {selectedMed?.medication_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <LabeledSelect
              label="Discontinue Reason"
              value={discontinueReason}
              onChange={setDiscontinueReason}
              options={[
                "Completed dose",
                "Stopped",
                "Started a new medication",
                "Allergy to medication",
                "Ineffective",
                "Side effects (non-allergic)",
                "Treatment complete",
                "Doctor recommendation",
              ]}
            />
            <div>
              <Label>Notes</Label>
              <Textarea
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
                placeholder="Additional notes about discontinuing..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDiscontinue} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Discontinue
              </Button>
              <Button onClick={() => setShowDiscontinueDialog(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Change History: {selectedMed?.medication_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {medicationHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No change history</p>
            ) : (
              medicationHistory.map((change) => (
                <div key={change.id} className="p-3 border border-border rounded-lg bg-muted/20">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-semibold capitalize">{change.change_type}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(change.changed_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mb-1">
                    <strong>Reason:</strong> {change.change_reason}
                  </p>
                  {change.notes && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Notes:</strong> {change.notes}
                    </p>
                  )}
                  {change.change_type === "change" && change.previous_value && change.new_value && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {change.previous_value.dosage !== change.new_value.dosage && (
                        <p>Dosage: {change.previous_value.dosage} → {change.new_value.dosage}</p>
                      )}
                      {change.previous_value.frequency !== change.new_value.frequency && (
                        <p>Frequency: {change.previous_value.frequency} → {change.new_value.frequency}</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
