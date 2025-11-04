import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Download, TrendingUp, Clock, DollarSign, Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/integrations/supabase/types";

type DbMonthlyReport = Database['public']['Tables']['attorney_monthly_reports']['Row'];

interface CaseBreakdown {
  case_id: string;
  client_number: string;
  client_label: string;
  time_entries: number;
  total_time_minutes: number;
  total_attorney_time_saved_minutes: number;
  cost_savings: number;
}

interface ReportSummary {
  total_cases: number;
  total_time_hours: number;
  total_saved_hours: number;
  hourly_rate: number;
}

interface MonthlyReport extends Omit<DbMonthlyReport, 'report_data'> {
  report_data: {
    cases: CaseBreakdown[];
    summary: ReportSummary;
  };
}

export function AttorneyMonthlyReports() {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("attorney_monthly_reports")
        .select("*")
        .eq("attorney_id", user.id)
        .order("report_month", { ascending: false });

      if (error) throw error;
      setReports((data || []) as unknown as MonthlyReport[]);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const downloadReport = (report: MonthlyReport) => {
    const reportText = `
Time Savings Report - ${formatMonth(report.report_month)}
Generated: ${new Date(report.generated_at).toLocaleString()}

SUMMARY
-------
Total Cases: ${report.total_cases}
RN Time Spent: ${formatHours(report.total_time_minutes)}
Attorney Time Saved: ${formatHours(report.total_attorney_time_saved_minutes)}
Cost Savings: ${formatCurrency(report.total_cost_savings)}
Hourly Rate: ${formatCurrency(report.hourly_rate_used)}/hour

CASE BREAKDOWN
--------------
${report.report_data.cases.map(c => `
Client: ${c.client_number} - ${c.client_label}
  Time Entries: ${c.time_entries}
  RN Time: ${formatHours(c.total_time_minutes)}
  Attorney Time Saved: ${formatHours(c.total_attorney_time_saved_minutes)}
  Cost Savings: ${formatCurrency(c.cost_savings)}
`).join('\n')}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-savings-report-${report.report_month}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Report downloaded");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading reports...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Monthly Time Savings Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reports available yet.</p>
              <p className="text-sm">Reports are generated automatically at the end of each month.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <h3 className="text-lg font-semibold">{formatMonth(report.report_month)}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Generated {new Date(report.generated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReport(report)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Total Cases</span>
                        </div>
                        <div className="text-2xl font-bold">{report.total_cases}</div>
                      </div>
                      
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">RN Time Spent</span>
                        </div>
                        <div className="text-2xl font-bold">{formatHours(report.total_time_minutes)}</div>
                      </div>
                      
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Time Saved</span>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {formatHours(report.total_attorney_time_saved_minutes)}
                        </div>
                      </div>
                      
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-muted-foreground">Cost Savings</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(report.total_cost_savings)}
                        </div>
                      </div>
                    </div>

                    {selectedReport?.id === report.id ? (
                      <>
                        <div className="border-t pt-4">
                          <h4 className="font-semibold mb-3">Case Breakdown</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead className="text-right">Entries</TableHead>
                                <TableHead className="text-right">RN Time</TableHead>
                                <TableHead className="text-right">Time Saved</TableHead>
                                <TableHead className="text-right">Savings</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {report.report_data.cases.map((caseData) => (
                                <TableRow key={caseData.case_id}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{caseData.client_number}</div>
                                      <div className="text-sm text-muted-foreground">{caseData.client_label}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Badge variant="secondary">{caseData.time_entries}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatHours(caseData.total_time_minutes)}
                                  </TableCell>
                                  <TableCell className="text-right text-primary">
                                    {formatHours(caseData.total_attorney_time_saved_minutes)}
                                  </TableCell>
                                  <TableCell className="text-right text-green-600 font-semibold">
                                    {formatCurrency(caseData.cost_savings)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-4"
                          onClick={() => setSelectedReport(null)}
                        >
                          Hide Details
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                      >
                        View Case Breakdown
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}