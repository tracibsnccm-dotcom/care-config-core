import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { FileText, Target, TrendingUp } from "lucide-react";
import { RCMS } from "@/constants/brand";

interface ClinicalOverviewProps {
  caseId: string;
}

export function ClinicalOverview({ caseId }: ClinicalOverviewProps) {
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClinicalData();
  }, [caseId]);

  const fetchClinicalData = async () => {
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", caseId)
        .single();

      if (error) throw error;
      setCaseData(data);
    } catch (error) {
      console.error("Error fetching clinical data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border-2 shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  // Extract diagnoses from fourps.current_conditions
  const diagnoses = caseData?.fourps?.current_conditions || [];
  
  // Extract incident details
  const incidentDetails = caseData?.incident || {};

  return (
    <Card className="rounded-2xl border-2 shadow-lg p-6">
      <h3 className="text-lg font-bold mb-4" style={{ color: RCMS.brandNavy }}>
        Clinical Overview
      </h3>

      {/* Diagnoses Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${RCMS.brandTeal}20` }}>
            <FileText className="w-4 h-4" style={{ color: RCMS.brandTeal }} />
          </div>
          <h4 className="font-semibold text-foreground">Primary Diagnoses</h4>
        </div>
        <div className="space-y-2 pl-1">
          {diagnoses.length > 0 ? (
            diagnoses.map((condition: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-sm" style={{ color: RCMS.brandTeal }}>•</span>
                <span className="text-sm text-foreground">{condition}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">No diagnoses recorded</p>
          )}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Incident Information */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${RCMS.brandGold}20` }}>
            <TrendingUp className="w-4 h-4" style={{ color: RCMS.brandGold }} />
          </div>
          <h4 className="font-semibold text-foreground">Incident Details</h4>
        </div>
        <div className="space-y-2 pl-1">
          {incidentDetails.date && (
            <div className="text-sm">
              <span className="font-medium text-foreground">Date of Incident: </span>
              <span className="text-muted-foreground">{incidentDetails.date}</span>
            </div>
          )}
          {incidentDetails.mechanism && (
            <div className="text-sm">
              <span className="font-medium text-foreground">Mechanism: </span>
              <span className="text-muted-foreground">{incidentDetails.mechanism}</span>
            </div>
          )}
          {incidentDetails.bodyParts && incidentDetails.bodyParts.length > 0 && (
            <div className="text-sm">
              <span className="font-medium text-foreground">Body Parts Affected: </span>
              <span className="text-muted-foreground">
                {incidentDetails.bodyParts.join(", ")}
              </span>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Treatment Goals */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${RCMS.brandNavy}20` }}>
            <Target className="w-4 h-4" style={{ color: RCMS.brandNavy }} />
          </div>
          <h4 className="font-semibold text-foreground">Treatment Progress</h4>
        </div>
        <div className="space-y-3 pl-1">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Current Status</p>
            <p className="text-sm text-foreground">
              {caseData?.status === "ACTIVE" ? "Active Treatment" : caseData?.status || "Under Review"}
            </p>
          </div>
          
          {caseData?.odg_benchmarks && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">ODG Compliance</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(caseData.odg_benchmarks).map(([key, value]) => (
                  value && (
                    <span
                      key={key}
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: `${RCMS.brandTeal}20`,
                        color: RCMS.brandTeal,
                      }}
                    >
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div
        className="mt-6 p-3 rounded-lg text-xs"
        style={{ backgroundColor: `${RCMS.brandGold}15` }}
      >
        <p className="text-foreground">
          <strong>Note:</strong> Clinical data syncs from case intake and updates. Contact RN CM for detailed treatment plan adjustments.
        </p>
      </div>
    </Card>
  );
}
