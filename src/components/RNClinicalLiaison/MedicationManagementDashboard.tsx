import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pill, AlertTriangle, Calendar, TrendingUp, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Medication {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  prescribing_doctor?: string;
  side_effects?: string;
  adherence_notes?: string;
  injury_timing?: string;
  change_history?: any;
}

interface MedicationManagementDashboardProps {
  caseId: string;
}

export default function MedicationManagementDashboard({ caseId }: MedicationManagementDashboardProps) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedications();
  }, [caseId]);

  const fetchMedications = async () => {
    try {
      const { data, error } = await supabase
        .from("client_medications")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMedications(data || []);
    } catch (error: any) {
      toast.error("Failed to load medications");
    } finally {
      setLoading(false);
    }
  };

  const activeMeds = medications.filter(m => m.is_active);
  const discontinuedMeds = medications.filter(m => !m.is_active);
  const preInjuryMeds = medications.filter(m => m.injury_timing === 'pre-injury');
  const postInjuryMeds = medications.filter(m => m.injury_timing === 'post-injury');

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading medications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Medications</p>
              <p className="text-2xl font-bold">{activeMeds.length}</p>
            </div>
            <Pill className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pre-Injury</p>
              <p className="text-2xl font-bold">{preInjuryMeds.length}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Post-Injury</p>
              <p className="text-2xl font-bold">{postInjuryMeds.length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">With Side Effects</p>
              <p className="text-2xl font-bold">
                {medications.filter(m => m.side_effects).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active ({activeMeds.length})</TabsTrigger>
          <TabsTrigger value="discontinued">Discontinued ({discontinuedMeds.length})</TabsTrigger>
          <TabsTrigger value="pre-injury">Pre-Injury ({preInjuryMeds.length})</TabsTrigger>
          <TabsTrigger value="post-injury">Post-Injury ({postInjuryMeds.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="space-y-3">
            {activeMeds.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No active medications</p>
              </Card>
            ) : (
              activeMeds.map((med) => (
                <Card key={med.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{med.medication_name}</h4>
                        <Badge variant="secondary">{med.dosage}</Badge>
                        {med.injury_timing && (
                          <Badge variant="outline">{med.injury_timing}</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Frequency</p>
                          <p>{med.frequency}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Prescribing Doctor</p>
                          <p>{med.prescribing_doctor || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Start Date</p>
                          <p>{new Date(med.start_date).toLocaleDateString()}</p>
                        </div>
                        {med.side_effects && (
                          <div className="col-span-2">
                            <p className="text-muted-foreground flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Side Effects
                            </p>
                            <p className="text-orange-600">{med.side_effects}</p>
                          </div>
                        )}
                        {med.adherence_notes && (
                          <div className="col-span-2">
                            <p className="text-muted-foreground">Adherence Notes</p>
                            <p>{med.adherence_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="discontinued">
          <div className="space-y-3">
            {discontinuedMeds.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No discontinued medications</p>
              </Card>
            ) : (
              discontinuedMeds.map((med) => (
                <Card key={med.id} className="p-4 opacity-60">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{med.medication_name}</h4>
                        <Badge variant="secondary">{med.dosage}</Badge>
                        <Badge variant="destructive">Discontinued</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Start Date</p>
                          <p>{new Date(med.start_date).toLocaleDateString()}</p>
                        </div>
                        {med.end_date && (
                          <div>
                            <p className="text-muted-foreground">End Date</p>
                            <p>{new Date(med.end_date).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="pre-injury">
          <div className="space-y-3">
            {preInjuryMeds.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No pre-injury medications</p>
              </Card>
            ) : (
              preInjuryMeds.map((med) => (
                <Card key={med.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{med.medication_name}</h4>
                    <Badge variant="secondary">{med.dosage}</Badge>
                    <Badge className="bg-blue-500">Pre-Injury</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{med.frequency}</p>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="post-injury">
          <div className="space-y-3">
            {postInjuryMeds.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No post-injury medications</p>
              </Card>
            ) : (
              postInjuryMeds.map((med) => (
                <Card key={med.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{med.medication_name}</h4>
                    <Badge variant="secondary">{med.dosage}</Badge>
                    <Badge className="bg-green-500">Post-Injury</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{med.frequency}</p>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
