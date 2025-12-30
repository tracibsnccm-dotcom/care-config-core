import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Download, TrendingUp, Clock, DollarSign, Briefcase } from "lucide-react";
import { format, subMonths } from "date-fns";

interface MonthlyReport {
  id: string;
  attorney_id: string;
  report_month: string;
  total_cases: number;
  total_time_minutes: number;
  total_attorney_time_saved_minutes: number;
  total_cost_savings: number;
  hourly_rate_used: number;
  report_data: {
    cases: Array<{
      case_id: string;
      client_number: string;
      client_label: string;
      time_entries: number;
      total_time_minutes: number;
      total_attorney_time_saved_minutes: number;
      cost_savings: number;
    }>;
    summary: {
      total_cases: number;
      total_time_hours: number;
      total_saved_hours: number;
      hourly_rate: number;
    };
  };
  generated_at: string;
}

export function MonthlyReportsView() {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate list of last 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, "yyyy-MM-01"),
      label: format(date, "MMMM yyyy")
    };
  });

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (selectedMonth && reports.length > 0) {
      const report = reports.find(r => r.report_month === selectedMonth);
      setSelectedReport(report || null);
    }
  }, [selectedMonth, reports]);

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

      setReports((data as any) || []);
      
      // Auto-select most recent report
      if (data && data.length > 0) {
        setSelectedMonth(data[0].report_month);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedMonth) {
      toast.error("Please select a month");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc("generate_attorney_monthly_report", {
        p_attorney_id: user.id,
        p_report_month: selectedMonth
      });

      if (error) throw error;

      toast.success("Report generated successfully");
      fetchReports();
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!selectedReport) return;

    const exportData = {
      report_month: format(new Date(selectedReport.report_month), "MMMM yyyy"),
      summary: {
        total_cases: selectedReport.total_cases,
        total_time_hours: (selectedReport.total_time_minutes / 60).toFixed(2),
        attorney_time_saved_hours: (selectedReport.total_attorney_time_saved_minutes / 60).toFixed(2),
        cost_savings: `$${selectedReport.total_cost_savings.toLocaleString()}`,
        hourly_rate: `$${selectedReport.hourly_rate_used}`
      },
      cases: selectedReport.report_data.cases
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-report-${selectedReport.report_month}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Monthly Time & Cost Savings Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateReport} disabled={loading || !selectedMonth}>
              {loading ? "Generating..." : "Generate Report"}
            </Button>
            {selectedReport && (
              <Button onClick={exportReport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
          </div>

          {selectedReport && (
            <div className="space-y-4 mt-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Total Cases</span>
                    </div>
                    <div className="text-2xl font-bold">{selectedReport.total_cases}</div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Time Saved</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {(selectedReport.total_attorney_time_saved_minutes / 60).toFixed(1)} hrs
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-500/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Cost Savings</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      ${selectedReport.total_cost_savings.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Hourly Rate</span>
                    </div>
                    <div className="text-2xl font-bold">
                      ${selectedReport.hourly_rate_used}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Case Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Case-by-Case Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedReport.report_data.cases?.map((caseData) => (
                      <div key={caseData.case_id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{caseData.client_number}</h4>
                            <p className="text-sm text-muted-foreground">
                              {caseData.client_label || "Client"}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              ${caseData.cost_savings.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">saved</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Time Entries</div>
                            <div className="font-medium">{caseData.time_entries}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">RN Time</div>
                            <div className="font-medium">
                              {(caseData.total_time_minutes / 60).toFixed(1)} hrs
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Time Saved</div>
                            <div className="font-medium">
                              {(caseData.total_attorney_time_saved_minutes / 60).toFixed(1)} hrs
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!selectedReport && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              Select a month and generate a report to view details
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
