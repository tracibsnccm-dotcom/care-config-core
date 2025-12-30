import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle, Plus, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Allergy {
  id: string;
  allergen_name: string;
  reaction: string;
  severity: string;
  is_active: boolean;
  reported_date?: string;
  notes?: string;
}

interface AllergyManagementSystemProps {
  caseId: string;
  clientId: string;
}

export default function AllergyManagementSystem({ caseId, clientId }: AllergyManagementSystemProps) {
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    allergen_name: "",
    reaction: "",
    severity: "moderate",
    reported_date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  useEffect(() => {
    fetchAllergies();
  }, [caseId]);

  const fetchAllergies = async () => {
    try {
      const { data, error } = await supabase
        .from("client_allergies")
        .select("*")
        .eq("case_id", caseId)
        .order("severity", { ascending: false });

      if (error) throw error;
      setAllergies(data || []);
    } catch (error: any) {
      toast.error("Failed to load allergies");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.allergen_name || !formData.reaction) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const { error } = await supabase.from("client_allergies").insert({
        case_id: caseId,
        client_id: clientId,
        ...formData,
        is_active: true
      });

      if (error) throw error;
      
      toast.success("Allergy added successfully");
      setIsOpen(false);
      setFormData({
        allergen_name: "",
        reaction: "",
        severity: "moderate",
        reported_date: new Date().toISOString().split('T')[0],
        notes: ""
      });
      fetchAllergies();
    } catch (error: any) {
      toast.error("Failed to add allergy");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "severe": return "destructive";
      case "moderate": return "default";
      case "mild": return "secondary";
      default: return "outline";
    }
  };

  const activeAllergies = allergies.filter(a => a.is_active);
  const inactiveAllergies = allergies.filter(a => !a.is_active);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading allergies...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Allergy Management</h3>
          </div>
          <Badge variant="outline">{activeAllergies.length} Active</Badge>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Allergy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Allergy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Allergen Name *</Label>
                <Input
                  value={formData.allergen_name}
                  onChange={(e) => setFormData({ ...formData, allergen_name: e.target.value })}
                  placeholder="e.g., Penicillin, Peanuts"
                />
              </div>
              <div>
                <Label>Reaction *</Label>
                <Textarea
                  value={formData.reaction}
                  onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
                  placeholder="Describe the reaction..."
                />
              </div>
              <div>
                <Label>Severity</Label>
                <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reported Date</Label>
                <Input
                  type="date"
                  value={formData.reported_date}
                  onChange={(e) => setFormData({ ...formData, reported_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">Add Allergy</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {activeAllergies.length === 0 ? (
        <Card className="p-8 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No active allergies on record</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {activeAllergies.map((allergy) => (
            <Card key={allergy.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <h4 className="font-semibold">{allergy.allergen_name}</h4>
                    <Badge variant={getSeverityColor(allergy.severity)}>
                      {allergy.severity}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Reaction</p>
                      <p>{allergy.reaction}</p>
                    </div>
                    {allergy.reported_date && (
                      <div>
                        <p className="text-muted-foreground">Reported Date</p>
                        <p>{new Date(allergy.reported_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {allergy.notes && (
                      <div>
                        <p className="text-muted-foreground">Notes</p>
                        <p>{allergy.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {inactiveAllergies.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Inactive/Resolved Allergies</h4>
          <div className="grid gap-3">
            {inactiveAllergies.map((allergy) => (
              <Card key={allergy.id} className="p-3 opacity-60">
                <div className="flex items-center gap-2">
                  <h5 className="font-medium text-sm">{allergy.allergen_name}</h5>
                  <Badge variant="outline" className="text-xs">Inactive</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
