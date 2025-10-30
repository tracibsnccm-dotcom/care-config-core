import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReportDocument {
  id: string;
  case_id: string;
  report_title: string;
  report_type: string;
  generated_at: string;
  review_status: "pending" | "read";
  reviewed_by: string | null;
  reviewed_at: string | null;
  filed_status: "unfiled" | "filed";
  filed_by: string | null;
  filed_at: string | null;
}

export function LatestReports() {
  const [reports, setReports] = useState<ReportDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('report-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'report_documents'
        },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("report_documents")
        .select("*")
        .order("generated_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setReports((data || []) as ReportDocument[]);
    } catch (error: any) {
      toast({
        title: "Error loading reports",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (reportId: string, currentStatus: string) => {
    const newStatus = currentStatus === "pending" ? "read" : "pending";
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updateData: any = {
      review_status: newStatus,
    };

    if (newStatus === "read") {
      updateData.reviewed_by = user.id;
      updateData.reviewed_at = new Date().toISOString();
    } else {
      updateData.reviewed_by = null;
      updateData.reviewed_at = null;
    }

    const { error } = await supabase
      .from("report_documents")
      .update(updateData)
      .eq("id", reportId);

    if (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: newStatus === "read" ? "Report marked as read" : "Status updated",
        variant: "default",
      });
      fetchReports();
    }
  };

  const handleFileToCase = async (report: ReportDocument) => {
    const confirmed = window.confirm(
      `Attach this report to case ${report.case_id.slice(-8)}?`
    );
    
    if (!confirmed) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("report_documents")
      .update({
        filed_status: "filed",
        filed_by: user.id,
        filed_at: new Date().toISOString(),
      })
      .eq("id", report.id);

    if (error) {
      toast({
        title: "Error filing report",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Report filed successfully",
        description: "Document attached to case record",
        variant: "default",
      });
      fetchReports();
    }
  };

  const getCaseShortId = (caseId: string) => {
    return caseId.slice(-8).toUpperCase();
  };

  return (
    <Card className="p-6 border-border">
      <div className="border-b border-[hsl(var(--gold))] pb-2 mb-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Latest Reports
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No reports available
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-sm font-semibold text-muted-foreground py-3 px-2">Date</th>
                <th className="text-left text-sm font-semibold text-muted-foreground py-3 px-2">Report Title</th>
                <th className="text-left text-sm font-semibold text-muted-foreground py-3 px-2">Case ID</th>
                <th className="text-left text-sm font-semibold text-muted-foreground py-3 px-2">Status</th>
                <th className="text-left text-sm font-semibold text-muted-foreground py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, index) => (
                <tr
                  key={report.id}
                  className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors ${
                    index % 2 === 0 ? "bg-background" : "bg-accent/20"
                  }`}
                >
                  <td className="py-4 px-2 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(report.generated_at), { addSuffix: true })}
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {report.report_title}
                      </span>
                      {report.filed_status === "filed" && (
                        <Paperclip className="w-4 h-4 text-[hsl(var(--teal))]" />
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-2 text-sm text-foreground">
                    {getCaseShortId(report.case_id)}
                  </td>
                  <td className="py-4 px-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(report.id, report.review_status)}
                            className="h-auto p-2"
                          >
                            {report.review_status === "pending" ? (
                              <Badge
                                variant="outline"
                                className="bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))] border-[hsl(var(--gold))]/20"
                              >
                                <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold))] mr-2"></span>
                                Pending Review
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-[hsl(var(--teal))]/10 text-[hsl(var(--teal))] border-[hsl(var(--teal))]/20"
                              >
                                <CheckCircle className="w-3 h-3 mr-2" />
                                Read
                              </Badge>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Mark this report as {report.review_status === "pending" ? "reviewed" : "unreviewed"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td className="py-4 px-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => handleFileToCase(report)}
                            disabled={report.filed_status === "filed"}
                            className={`${
                              report.filed_status === "filed"
                                ? "bg-secondary text-secondary-foreground cursor-not-allowed"
                                : "bg-[hsl(var(--gold))] text-foreground hover:bg-foreground hover:text-[hsl(var(--gold))]"
                            }`}
                          >
                            📁 {report.filed_status === "filed" ? "Filed" : "File to Case"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {report.filed_status === "filed"
                              ? "Already filed"
                              : "Files this document into the permanent case record"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
