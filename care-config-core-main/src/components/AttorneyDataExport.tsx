import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { Download, FileText, Shield } from "lucide-react";

export function AttorneyDataExport() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    profile: true,
    cases: true,
    assignments: true,
    performance: true,
    messages: true,
    documents: false,
  });

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

      // Export cases
      if (exportOptions.cases) {
        const { data: assignments } = await supabase
          .from('case_assignments')
          .select('case_id')
          .eq('user_id', user?.id);
        
        if (assignments && assignments.length > 0) {
          const caseIds = assignments.map(a => a.case_id);
          const { data: cases } = await supabase
            .from('cases')
            .select('*')
            .in('id', caseIds);
          exportData.cases = cases;
        }
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
              { key: 'cases', label: 'Case Data', desc: 'Cases you are assigned to' },
              { key: 'assignments', label: 'Assignment History', desc: 'All assignment offers and responses' },
              { key: 'performance', label: 'Performance Metrics', desc: 'Your acceptance rates and statistics' },
              { key: 'messages', label: 'Messages', desc: 'Communication with RN Case Managers' },
              { key: 'documents', label: 'Documents', desc: 'Document metadata (not files)' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-start space-x-3 p-3 rounded-lg border">
                <Checkbox
                  id={key}
                  checked={exportOptions[key as keyof typeof exportOptions]}
                  onCheckedChange={(checked) =>
                    setExportOptions({ ...exportOptions, [key]: checked })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                    {label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
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

        <Button 
          onClick={handleExport} 
          disabled={loading || !Object.values(exportOptions).some(v => v)}
          className="w-full"
        >
          <FileText className="w-4 h-4 mr-2" />
          {loading ? "Exporting..." : "Export Data"}
        </Button>
      </CardContent>
    </Card>
  );
}