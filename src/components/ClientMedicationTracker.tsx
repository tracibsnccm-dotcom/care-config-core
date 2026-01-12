import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Pill, Plus, ChevronDown, ChevronUp, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Medication {
  id: string;
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
  prescribing_doctor: string | null;
  start_date: string | null;
  end_date: string | null;
  side_effects: string | null;
  reason_for_taking: string | null;
  pharmacy: string | null;
  notes: string | null;
  injury_related: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ClientMedicationTrackerProps {
  caseId: string;
}

export function ClientMedicationTracker({ caseId }: ClientMedicationTrackerProps) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedMeds, setExpandedMeds] = useState<Set<string>>(new Set());
  const [showDiscontinued, setShowDiscontinued] = useState(false);
  const [lastReconciliationDate, setLastReconciliationDate] = useState<string | null>(null);
  const [showReconciliationDetails, setShowReconciliationDetails] = useState(false);
  const [reconciliationData, setReconciliationData] = useState<any | null>(null);

  const [newMed, setNewMed] = useState({
    medication_name: "",
    dosage: "",
    frequency: "",
    prescribing_doctor: "",
    start_date: "",
    reason_for_taking: "",
    pharmacy: "",
    notes: "",
    injury_related: true, // Default to post-injury (true)
  });
  const [prnFrequency, setPrnFrequency] = useState("");
  const [prnReason, setPrnReason] = useState("");

  useEffect(() => {
    fetchMedications();
    fetchLastReconciliationDate();
  }, [caseId]);

  async function fetchMedications() {
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_medications?case_id=eq.${caseId}&order=created_at.desc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch medications');
      }

      const data = await response.json();
      setMedications(data || []);
    } catch (err) {
      console.error("Error fetching medications:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLastReconciliationDate() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Get the most recent medication reconciliation
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_med_reconciliations?case_id=eq.${caseId}&order=created_at.desc&limit=1`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setLastReconciliationDate(data[0].created_at);
          setReconciliationData(data[0]);
        } else {
          // Fallback to check-in date if no reconciliation found
          const checkinResponse = await fetch(
            `${supabaseUrl}/rest/v1/rc_client_checkins?case_id=eq.${caseId}&order=created_at.desc&limit=1`,
            {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
              },
            }
          );
          if (checkinResponse.ok) {
            const checkinData = await checkinResponse.json();
            if (checkinData && checkinData.length > 0) {
              setLastReconciliationDate(checkinData[0].created_at);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching last reconciliation date:", err);
    }
  }

  async function fetchReconciliationDetails() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_med_reconciliations?case_id=eq.${caseId}&order=created_at.desc&limit=1`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setReconciliationData(data[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching reconciliation:", err);
    }
  }

  async function handleAddMedication() {
    if (!newMed.medication_name.trim()) {
      alert("Please enter a medication name");
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const medicationData = {
        case_id: caseId,
        medication_name: newMed.medication_name.trim(),
        dosage: newMed.dosage || null,
        frequency: newMed.frequency || null,
        prescribing_doctor: newMed.prescribing_doctor || null,
        start_date: newMed.start_date || null,
        reason_for_taking: newMed.reason_for_taking || null,
        pharmacy: newMed.pharmacy || null,
        notes: newMed.notes || null,
        injury_related: newMed.injury_related,
        prn_frequency: newMed.frequency === "As needed (PRN)" ? prnFrequency || null : null,
        prn_reason: newMed.frequency === "As needed (PRN)" ? prnReason || null : null,
        is_active: true,
      };

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_medications`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(medicationData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save medication');
      }

      // Reset form and refresh
      setNewMed({
        medication_name: "",
        dosage: "",
        frequency: "",
        prescribing_doctor: "",
        start_date: "",
        reason_for_taking: "",
        pharmacy: "",
        notes: "",
        injury_related: true,
      });
      setPrnFrequency("");
      setPrnReason("");
      setShowAddForm(false);
      await fetchMedications();
    } catch (err: any) {
      console.error("Error adding medication:", err);
      alert("Failed to add medication: " + (err.message || "Unknown error"));
    }
  }

  const toggleExpand = (medId: string) => {
    const newExpanded = new Set(expandedMeds);
    if (newExpanded.has(medId)) {
      newExpanded.delete(medId);
    } else {
      newExpanded.add(medId);
    }
    setExpandedMeds(newExpanded);
  };

  // Filter medications
  const activePreInjuryMeds = medications.filter(
    (m) => m.injury_related === false && m.is_active
  );
  const activePostInjuryMeds = medications.filter(
    (m) => m.injury_related === true && m.is_active
  );
  const discontinuedMeds = medications.filter((m) => !m.is_active);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-slate-600">Loading medications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white text-2xl">My Medications</CardTitle>
          <p className="text-white/80 text-sm mt-1">
            Track all medications related to your injury and recovery
          </p>
          {lastReconciliationDate && (
            <div className="mt-2">
              <p className="text-white/80 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Last reviewed: {format(new Date(lastReconciliationDate), "MMM d, yyyy")} -{" "}
                <button
                  type="button"
                  onClick={() => {
                    console.log("View Details clicked");
                    if (showReconciliationDetails) {
                      setShowReconciliationDetails(false);
                    } else {
                      fetchReconciliationDetails();
                      setShowReconciliationDetails(true);
                    }
                  }}
                  className="text-amber-200 hover:text-amber-100 underline cursor-pointer"
                >
                  View Details
                </button>
              </p>
              {showReconciliationDetails && reconciliationData && (
                <div className="mt-3 p-3 bg-white/20 rounded-lg border border-white/30">
                  <h4 className="text-white font-medium mb-2">Last Medication Review</h4>
                  <p className="text-white/80 text-sm">
                    Date: {new Date(reconciliationData.created_at).toLocaleDateString()}
                  </p>
                  {reconciliationData.has_allergies && (
                    <p className="text-white/80 text-sm">
                      Allergies: {reconciliationData.medication_allergies || 'None listed'}
                    </p>
                  )}
                  {reconciliationData.additional_comments && (
                    <p className="text-white/80 text-sm">
                      Notes: {reconciliationData.additional_comments}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Section 1: Active Pre-Injury Medications */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white">Active Pre-Injury Medications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activePreInjuryMeds.length === 0 ? (
            <p className="text-white/80 text-sm">No pre-injury medications recorded</p>
          ) : (
            activePreInjuryMeds.map((med) => (
              <Card
                key={med.id}
                className="bg-white border-slate-200"
                onClick={() => toggleExpand(med.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start cursor-pointer">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill className="w-4 h-4 text-teal-600" />
                        <h4 className="font-semibold text-slate-800">{med.medication_name}</h4>
                      </div>
                      <p className="text-sm text-slate-600">
                        {med.dosage && <span>{med.dosage}</span>}
                        {med.dosage && med.frequency && <span> • </span>}
                        {med.frequency && <span>{med.frequency}</span>}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(med.id);
                      }}
                    >
                      {expandedMeds.has(med.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {expandedMeds.has(med.id) && (
                    <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                      {med.prescribing_doctor && (
                        <div>
                          <span className="font-medium text-slate-700">Prescribing Doctor: </span>
                          <span className="text-slate-600">{med.prescribing_doctor}</span>
                        </div>
                      )}
                      {med.start_date && (
                        <div>
                          <span className="font-medium text-slate-700">Start Date: </span>
                          <span className="text-slate-600">
                            {format(new Date(med.start_date), "MMM d, yyyy")}
                          </span>
                        </div>
                      )}
                      {med.side_effects && (
                        <div>
                          <span className="font-medium text-slate-700">Side Effects: </span>
                          <span className="text-slate-600">{med.side_effects}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Section 2: Active Post-Injury Medications */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white">Active Post-Injury Medications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activePostInjuryMeds.length === 0 ? (
            <p className="text-white/80 text-sm">No post-injury medications recorded</p>
          ) : (
            activePostInjuryMeds.map((med) => (
              <Card
                key={med.id}
                className="bg-white border-slate-200"
                onClick={() => toggleExpand(med.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start cursor-pointer">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill className="w-4 h-4 text-teal-600" />
                        <h4 className="font-semibold text-slate-800">{med.medication_name}</h4>
                        <Badge className="bg-amber-600 text-white text-xs">Post-Injury</Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {med.dosage && <span>{med.dosage}</span>}
                        {med.dosage && med.frequency && <span> • </span>}
                        {med.frequency && <span>{med.frequency}</span>}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(med.id);
                      }}
                    >
                      {expandedMeds.has(med.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {expandedMeds.has(med.id) && (
                    <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                      {med.prescribing_doctor && (
                        <div>
                          <span className="font-medium text-slate-700">Prescribing Doctor: </span>
                          <span className="text-slate-600">{med.prescribing_doctor}</span>
                        </div>
                      )}
                      {med.start_date && (
                        <div>
                          <span className="font-medium text-slate-700">Start Date: </span>
                          <span className="text-slate-600">
                            {format(new Date(med.start_date), "MMM d, yyyy")}
                          </span>
                        </div>
                      )}
                      {med.reason_for_taking && (
                        <div>
                          <span className="font-medium text-slate-700">Reason for Taking: </span>
                          <span className="text-slate-600">{med.reason_for_taking}</span>
                        </div>
                      )}
                      {med.side_effects && (
                        <div>
                          <span className="font-medium text-slate-700">Side Effects: </span>
                          <span className="text-slate-600">{med.side_effects}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Section 3: Discontinued Medications */}
      {discontinuedMeds.length > 0 && (
        <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white">Discontinued Medications</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDiscontinued(!showDiscontinued)}
                className="text-white hover:text-white/80"
              >
                {showDiscontinued ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          {showDiscontinued && (
            <CardContent className="space-y-3">
              {discontinuedMeds.map((med) => (
                <Card
                  key={med.id}
                  className="bg-slate-100 border-slate-300 opacity-75"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Pill className="w-4 h-4 text-slate-500" />
                      <h4 className="font-semibold text-slate-600 line-through">{med.medication_name}</h4>
                    </div>
                    <p className="text-sm text-slate-500">
                      {med.dosage && <span>{med.dosage}</span>}
                      {med.end_date && (
                        <>
                          {med.dosage && <span> • </span>}
                          <span>Stopped: {format(new Date(med.end_date), "MMM d, yyyy")}</span>
                        </>
                      )}
                    </p>
                    {med.reason_for_taking && (
                      <p className="text-xs text-slate-500 mt-1">
                        Reason: {med.reason_for_taking}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Add Medication Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Medication
        </Button>
      </div>

      {/* Add Medication Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Medication</DialogTitle>
          </DialogHeader>
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
                <Select
                  value={newMed.frequency}
                  onValueChange={(value) => setNewMed({ ...newMed, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Once daily">Once daily</SelectItem>
                    <SelectItem value="Twice daily">Twice daily</SelectItem>
                    <SelectItem value="Three times daily">Three times daily</SelectItem>
                    <SelectItem value="Four times daily">Four times daily</SelectItem>
                    <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                    <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                    <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                    <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
                    <SelectItem value="Once weekly">Once weekly</SelectItem>
                    <SelectItem value="As needed (PRN)">As needed (PRN)</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newMed.frequency === "As needed (PRN)" && (
              <div className="space-y-4">
                <div>
                  <Label>How often can you take this medication?</Label>
                  <Select
                    value={prnFrequency}
                    onValueChange={setPrnFrequency}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select PRN frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Every 2 hours">Every 2 hours</SelectItem>
                      <SelectItem value="Every 3 hours">Every 3 hours</SelectItem>
                      <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                      <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                      <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                      <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
                      <SelectItem value="Once daily maximum">Once daily maximum</SelectItem>
                      <SelectItem value="As directed">As directed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>What do you take this medication for?</Label>
                  <Input
                    value={prnReason}
                    onChange={(e) => setPrnReason(e.target.value)}
                    placeholder="e.g., breakthrough pain, anxiety, sleep, nausea"
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prescribing Doctor</Label>
                <Input
                  value={newMed.prescribing_doctor}
                  onChange={(e) => setNewMed({ ...newMed, prescribing_doctor: e.target.value })}
                  placeholder="e.g., Dr. Smith"
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
              <Label>Reason for Taking</Label>
              <Textarea
                value={newMed.reason_for_taking}
                onChange={(e) => setNewMed({ ...newMed, reason_for_taking: e.target.value })}
                placeholder="e.g., pain management, inflammation"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pharmacy</Label>
                <Input
                  value={newMed.pharmacy}
                  onChange={(e) => setNewMed({ ...newMed, pharmacy: e.target.value })}
                  placeholder="e.g., CVS Pharmacy"
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newMed.notes}
                onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })}
                placeholder="Additional notes about this medication"
                rows={2}
              />
            </div>
            <div>
              <Label>Medication Type</Label>
              <RadioGroup
                value={newMed.injury_related ? "post-injury" : "pre-injury"}
                onValueChange={(value) => setNewMed({ ...newMed, injury_related: value === "post-injury" })}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pre-injury" id="pre-injury" />
                  <Label htmlFor="pre-injury" className="cursor-pointer">
                    Pre-Injury Medication
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="post-injury" id="post-injury" />
                  <Label htmlFor="post-injury" className="cursor-pointer">
                    Post-Injury Medication
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMedication} className="bg-amber-600 hover:bg-amber-700 text-white">
                Save Medication
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
