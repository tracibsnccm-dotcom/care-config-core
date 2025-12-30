import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Activity, Plus, StopCircle, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LabeledSelect } from "@/components/LabeledSelect";
import { Badge } from "@/components/ui/badge";

interface Treatment {
  id: string;
  treatment_name: string;
  frequency: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  is_active: boolean;
  injury_timing: string | null;
  created_at: string;
}

interface ClientTreatmentTrackerProps {
  caseId: string;
}

export function ClientTreatmentTracker({ caseId }: ClientTreatmentTrackerProps) {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  
  const [formData, setFormData] = useState({
    treatment_name: "",
    frequency: "",
    start_date: "",
    end_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchTreatments();
  }, [caseId]);

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("client_treatments")
        .select("*")
        .eq("client_id", user.data.user?.id)
        .eq("case_id", caseId)
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTreatments(data || []);
    } catch (error: any) {
      console.error("Error fetching treatments:", error);
      toast.error("Failed to load treatments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const user = await supabase.auth.getUser();
      
      if (editingTreatment) {
        // Update existing treatment
        const { error } = await supabase
          .from("client_treatments")
          .update({
            treatment_name: formData.treatment_name,
            frequency: formData.frequency || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            notes: formData.notes || null,
          })
          .eq("id", editingTreatment.id);

        if (error) throw error;
        toast.success("Treatment updated successfully");
      } else {
        // Create new treatment
        const { error } = await supabase
          .from("client_treatments")
          .insert({
            case_id: caseId,
            client_id: user.data.user?.id,
            treatment_name: formData.treatment_name,
            frequency: formData.frequency || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            notes: formData.notes || null,
            is_active: true,
          });

        if (error) throw error;
        toast.success("Treatment added successfully");
      }

      setFormData({
        treatment_name: "",
        frequency: "",
        start_date: "",
        end_date: "",
        notes: "",
      });
      setShowForm(false);
      setEditingTreatment(null);
      fetchTreatments();
    } catch (error: any) {
      console.error("Error saving treatment:", error);
      toast.error("Failed to save treatment");
    }
  };

  const handleEdit = (treatment: Treatment) => {
    setEditingTreatment(treatment);
    setFormData({
      treatment_name: treatment.treatment_name,
      frequency: treatment.frequency || "",
      start_date: treatment.start_date || "",
      end_date: treatment.end_date || "",
      notes: treatment.notes || "",
    });
    setShowForm(true);
  };

  const handleStopTreatment = async (treatmentId: string) => {
    if (!confirm("Are you sure you want to stop this treatment?")) return;

    try {
      const { error } = await supabase
        .from("client_treatments")
        .update({
          is_active: false,
          end_date: new Date().toISOString().split('T')[0],
        })
        .eq("id", treatmentId);

      if (error) throw error;
      toast.success("Treatment stopped");
      fetchTreatments();
    } catch (error: any) {
      console.error("Error stopping treatment:", error);
      toast.error("Failed to stop treatment");
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const activeTreatments = treatments.filter(t => t.is_active);
  const inactiveTreatments = treatments.filter(t => !t.is_active);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">My Treatments</h3>
        </div>
        <Button
          onClick={() => {
            setEditingTreatment(null);
            setFormData({
              treatment_name: "",
              frequency: "",
              start_date: "",
              end_date: "",
              notes: "",
            });
            setShowForm(true);
          }}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Treatment
        </Button>
      </div>

      {activeTreatments.length === 0 && inactiveTreatments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No treatments recorded yet</p>
          <p className="text-sm mt-1">Click "Add Treatment" to get started</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Treatments */}
          {activeTreatments.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-green-600">Active Treatments</h4>
              <div className="space-y-3">
                {activeTreatments.map((treatment) => (
                  <Card key={treatment.id} className="p-4 border-green-200 bg-green-50/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-foreground">{treatment.treatment_name}</h4>
                          {treatment.injury_timing && (
                            <Badge variant="outline" className="text-xs">
                              {treatment.injury_timing.replace('_', '-')}
                            </Badge>
                          )}
                        </div>
                        {treatment.frequency && (
                          <p className="text-sm text-muted-foreground mb-1">
                            <strong>Frequency:</strong> {treatment.frequency}
                          </p>
                        )}
                        {treatment.start_date && (
                          <p className="text-sm text-muted-foreground mb-1">
                            <strong>Started:</strong> {new Date(treatment.start_date).toLocaleDateString()}
                          </p>
                        )}
                        {treatment.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">{treatment.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(treatment)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStopTreatment(treatment.id)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <StopCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Inactive Treatments */}
          {inactiveTreatments.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Past Treatments</h4>
              <div className="space-y-3">
                {inactiveTreatments.map((treatment) => (
                  <Card key={treatment.id} className="p-4 border-muted bg-muted/30 opacity-75">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-foreground">{treatment.treatment_name}</h4>
                          {treatment.injury_timing && (
                            <Badge variant="outline" className="text-xs">
                              {treatment.injury_timing.replace('_', '-')}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">Stopped</Badge>
                        </div>
                        {treatment.frequency && (
                          <p className="text-sm text-muted-foreground mb-1">
                            <strong>Frequency:</strong> {treatment.frequency}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {treatment.start_date && (
                            <span><strong>Started:</strong> {new Date(treatment.start_date).toLocaleDateString()}</span>
                          )}
                          {treatment.end_date && (
                            <span className="ml-3"><strong>Ended:</strong> {new Date(treatment.end_date).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTreatment ? "Edit Treatment" : "Add New Treatment"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="treatment_name">Treatment Name *</Label>
              <Input
                id="treatment_name"
                value={formData.treatment_name}
                onChange={(e) => setFormData({ ...formData, treatment_name: e.target.value })}
                placeholder="e.g., Physical Therapy, Acupuncture"
                required
              />
            </div>

            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Input
                id="frequency"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                placeholder="e.g., 2x per week, Daily"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes about this treatment..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingTreatment ? "Update" : "Add"} Treatment
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingTreatment(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
