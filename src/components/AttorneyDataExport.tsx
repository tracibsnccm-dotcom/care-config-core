import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { Download, FileText, Shield, AlertCircle } from "lucide-react";
import { getAttorneyCases, AttorneyCase } from "@/lib/attorneyCaseQueries";

export function AttorneyDataExport() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [attorneyCases, setAttorneyCases] = useState<AttorneyCase[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [exportOptions, setExportOptions] = useState({
    profile: true,
    cases: true,
    assignments: true,
    performance: true,
    messages: true,
    documents: false,
  });

  // Load released-only attorney cases on mount
  useEffect(() => {
    async function loadAttorneyCases() {
      if (!user) {
        setCasesLoading(false);
        return;
      }
      try {
        const cases = await getAttorneyCases();
        setAttorneyCases(cases || []);
      } catch (error) {
        console.error("Error loading attorney cases for export:", error);
        setAttorneyCases([]);
      } finally {
        setCasesLoading(false);
      }
    }
    loadAttorneyCases();
  }, [user]);

  // Runtime guard: Check if all cases are released/closed
  const hasOnlyReleasedCases = attorneyCases.every(
    (c) => c.case_status === "released" || c.case_status === "closed"
  );
  const canExportCases = hasOnlyReleasedCases && attorneyCases.length > 0;

  const handleExport = async () => {
    setLoading(true);
    try {
      const exportData: any = {
        exported_at: new Date().toISOString(),
        user_id: user?.id,
      };

      // Export profile
      if (exportOptions.profile) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user?.id)
          .single();
        exportData.profile = profile;

        const { data: metadata } = await supabase
          .from('attorney_metadata')
          .select('*')
          .eq('user_id', user?.id)
          .single();
        exportData.attorney_metadata = metadata;
      }

      // Export cases - ONLY released/closed cases via getAttorneyCases()
      // SECURITY: This component does NOT accept caseId props to prevent draft ID injection.
      // All case data comes exclusively from getAttorneyCases() RPC which enforces released-only access.
      if (exportOptions.cases) {
        // Runtime guard #1: Pre-export validation
        if (!canExportCases) {
          toast.error("Export available for released cases only");
          setLoading(false);
          return;
        }

        // Use getAttorneyCases() which enforces released-only access via RPC: attorney_accessible_cases
        // This is already loaded in state, but refresh to ensure latest data
        const releasedCases = await getAttorneyCases();
        
        // Runtime guard #2: Hard filter - remove any cases that are not released/closed
        // This is defense-in-depth in case the RPC somehow returns a draft (should never happen)
        const validReleasedCases = releasedCases.filter(
          (c) => c.case_status === "released" || c.case_status === "closed"
        );
        
        // Runtime guard #3: Verify no drafts made it through
        if (validReleasedCases.length !== releasedCases.length) {
          const draftCount = releasedCases.length - validReleasedCases.length;
          console.error(
            `[ATTORNEY_MVP_SAFETY] ⚠️ CRITICAL: ${draftCount} draft case(s) detected in export - blocking export`,
            "This should never happen - getAttorneyCases() RPC should only return released/closed cases."
          );
          toast.error("Export available for released cases only");
          setLoading(false);
          return;
        }
        
        // Runtime guard #4: Ensure we have at least one valid case
        if (validReleasedCases.length === 0) {
          toast.error("No released cases available for export");
          setLoading(false);
          return;
        }

        // Export only released/closed cases with explicit validation
        exportData.cases = validReleasedCases.map((c: AttorneyCase) => {
          // Final validation: TypeScript type guarantees case_status is 'released' | 'closed',
          // but we double-check at runtime as defense-in-depth
          if (c.case_status !== "released" && c.case_status !== "closed") {
            throw new Error(
              `[ATTORNEY_MVP_SAFETY] Invalid case status in export: ${c.case_status} (Case ID: ${c.id})`
            );
          }
          
          return {
            id: c.id, // This is the released snapshot ID (not a draft ID, not a chain root)
            client_id: c.client_id,
            attorney_id: c.attorney_id,
            case_type: c.case_type,
            case_status: c.case_status, // Always 'released' or 'closed'
            date_of_injury: c.date_of_injury,
            jurisdiction: c.jurisdiction,
            revision_of_case_id: c.revision_of_case_id,
            released_at: c.released_at,
            closed_at: c.closed_at,
            updated_at: c.updated_at,
            created_at: c.created_at,
            _export_note: "This case data is from a released/closed snapshot only. Draft revisions are not included.",
            _export_security_note: "Case IDs in this export are released snapshot IDs only. Draft case IDs cannot be exported.",
          };
        });
      }

      // Export assignments
      if (exportOptions.assignments) {
        const { data: offers } = await supabase
          .from('assignment_offers')
          .select('*')
          .eq('attorney_id', user?.id)
          .order('offered_at', { ascending: false });
        exportData.assignment_offers = offers;
      }

      // Export performance
      if (exportOptions.performance) {
        const { data: metadata } = await supabase
          .from('attorney_metadata')
          .select('*')
          .eq('user_id', user?.id)
          .single();
        
        if (metadata) {
          const { data: performance } = await supabase
            .from('attorney_performance')
            .select('*')
            .eq('attorney_code', metadata.id)
            .single();
          exportData.performance = performance;
        }
      }

      // Export messages
      if (exportOptions.messages) {
        const { data: messages } = await supabase
          .from('attorney_rn_messages')
          .select('*')
          .eq('sender_id', user?.id)
          .order('created_at', { ascending: false });
        exportData.messages = messages;
      }

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attorney-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully");
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast.error("Failed to export data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          Data Export
        </CardTitle>
        <CardDescription>
          Download a copy of your data for your records (GDPR compliant)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Select data to export</h3>
          
          <div className="space-y-3">
            {[
              { key: 'profile', label: 'Profile Information', desc: 'Your personal and professional details' },
              { 
                key: 'cases', 
                label: 'Case Data', 
                desc: casesLoading 
                  ? 'Loading released cases...' 
                  : canExportCases
                    ? `Released/closed cases only (${attorneyCases.length} available)`
                    : 'Export available for released cases only'
              },
              { key: 'assignments', label: 'Assignment History', desc: 'All assignment offers and responses' },
              { key: 'performance', label: 'Performance Metrics', desc: 'Your acceptance rates and statistics' },
              { key: 'messages', label: 'Messages', desc: 'Communication with RN Case Managers' },
              { key: 'documents', label: 'Documents', desc: 'Document metadata (not files)' },
            ].map(({ key, label, desc }) => {
              const isCasesOption = key === 'cases';
              const isDisabled = isCasesOption && (!canExportCases || casesLoading);
              
              return (
                <div key={key} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <Checkbox
                    id={key}
                    checked={exportOptions[key as keyof typeof exportOptions]}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, [key]: checked })
                    }
                    disabled={isDisabled}
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={key} 
                      className={`text-sm font-medium ${isDisabled ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {label}
                      {isCasesOption && !canExportCases && !casesLoading && (
                        <span className="ml-2 text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Released only
                        </span>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg flex gap-3">
          <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Privacy & Security</h4>
            <p className="text-xs text-muted-foreground">
              Your exported data is generated on-demand and contains all personal information 
              stored in our system. Keep this file secure and do not share it publicly.
            </p>
          </div>
        </div>

        {/* Runtime guard message */}
        {exportOptions.cases && !canExportCases && !casesLoading && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                Export available for released cases only
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Only released and closed case snapshots can be exported. Draft cases are not included in exports.
              </p>
            </div>
          </div>
        )}

        <Button 
          onClick={handleExport} 
          disabled={
            loading || 
            !Object.values(exportOptions).some(v => v) ||
            (exportOptions.cases && !canExportCases)
          }
          className="w-full"
        >
          <FileText className="w-4 h-4 mr-2" />
          {loading ? "Exporting..." : "Export Data"}
        </Button>
      </CardContent>
    </Card>
  );
}