import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Calendar, ArrowUp, ArrowDown, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricNoteDialog } from "./MetricNoteDialog";

interface MetricComparison {
  current: number;
  yesterday: number;
  last_week: number;
  day_change: number;
  week_change: number;
  day_change_percent: number;
  week_change_percent: number;
}

interface DailyMetric {
  metric_date: string;
  cases_managed: number;
  avg_response_time_hours: number;
  documentation_completion_rate: number;
  task_completion_rate: number;
  client_satisfaction_score: number;
  sla_compliance_rate: number;
}

// Target values for metrics
const METRIC_TARGETS = {
  avg_response_time_hours: 8,
  documentation_completion_rate: 95,
  task_completion_rate: 90,
  client_satisfaction_score: 4.0,
  sla_compliance_rate: 95,
};

export function RNIndividualMetricsDashboard() {
  const [metrics, setMetrics] = useState<DailyMetric | null>(null);
  const [comparisons, setComparisons] = useState<Record<string, MetricComparison>>({});
  const [historyMonths, setHistoryMonths] = useState<number>(1);
  const [history, setHistory] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDialog, setNoteDialog] = useState<{
    open: boolean;
    metricName: string;
    metricLabel: string;
    currentValue: number;
    targetValue: number;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentMetrics();
  }, []);

  useEffect(() => {
    if (historyMonths > 0) {
      fetchHistory();
    }
  }, [historyMonths]);

  const fetchCurrentMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get today's metrics
      const { data: todayMetrics, error: metricsError } = await supabase
        .from("rn_daily_metrics")
        .select("*")
        .eq("rn_user_id", user.id)
        .eq("metric_date", new Date().toISOString().split('T')[0])
        .single();

      if (metricsError && metricsError.code !== 'PGRST116') throw metricsError;

      setMetrics(todayMetrics);

      // Get comparisons for key metrics
      const metricFields = [
        'cases_managed',
        'avg_response_time_hours',
        'documentation_completion_rate',
        'task_completion_rate',
        'client_satisfaction_score',
        'sla_compliance_rate'
      ];

      const comparisonData: Record<string, MetricComparison> = {};

      for (const field of metricFields) {
        const { data, error } = await supabase
          .rpc('get_rn_metric_comparison', {
            p_rn_user_id: user.id,
            p_metric_name: field,
            p_current_date: new Date().toISOString().split('T')[0]
          });

        if (!error && data) {
          comparisonData[field] = data as unknown as MetricComparison;
        }
      }

      setComparisons(comparisonData);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      toast({
        title: "Error",
        description: "Failed to load metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc('get_rn_metrics_history', {
          p_rn_user_id: user.id,
          p_months: historyMonths
        });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const renderTrendIndicator = (comparison: MetricComparison, isInverted = false) => {
    const dayChange = comparison.day_change_percent;
    const weekChange = comparison.week_change_percent;

    const getDayColor = () => {
      if (isInverted) {
        return dayChange < 0 ? "text-success" : dayChange > 0 ? "text-destructive" : "text-muted-foreground";
      }
      return dayChange > 0 ? "text-success" : dayChange < 0 ? "text-destructive" : "text-muted-foreground";
    };

    const getWeekColor = () => {
      if (isInverted) {
        return weekChange < 0 ? "text-success" : weekChange > 0 ? "text-destructive" : "text-muted-foreground";
      }
      return weekChange > 0 ? "text-success" : weekChange < 0 ? "text-destructive" : "text-muted-foreground";
    };

    return (
      <div className="space-y-1 text-sm">
        <div className={`flex items-center gap-1 ${getDayColor()}`}>
          {dayChange > 0 ? <ArrowUp className="h-3 w-3" /> : dayChange < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          <span className="font-medium">{Math.abs(dayChange).toFixed(1)}%</span>
          <span className="text-xs text-muted-foreground">vs yesterday</span>
        </div>
        <div className={`flex items-center gap-1 ${getWeekColor()}`}>
          {weekChange > 0 ? <ArrowUp className="h-3 w-3" /> : weekChange < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          <span className="font-medium">{Math.abs(weekChange).toFixed(1)}%</span>
          <span className="text-xs text-muted-foreground">vs last week</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading your metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Performance Metrics</CardTitle>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Cases Managed */}
            <Card className="p-4 border-primary/20 bg-primary/5">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Cases Managed</p>
                <p className="text-3xl font-bold">{metrics?.cases_managed || 0}</p>
                {comparisons.cases_managed && renderTrendIndicator(comparisons.cases_managed)}
              </div>
            </Card>

            {/* Avg Response Time */}
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  {metrics && metrics.avg_response_time_hours > METRIC_TARGETS.avg_response_time_hours && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNoteDialog({
                        open: true,
                        metricName: 'avg_response_time_hours',
                        metricLabel: 'Avg Response Time',
                        currentValue: metrics.avg_response_time_hours,
                        targetValue: METRIC_TARGETS.avg_response_time_hours,
                      })}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-3xl font-bold">{metrics?.avg_response_time_hours?.toFixed(1) || 0}h</p>
                {comparisons.avg_response_time_hours && renderTrendIndicator(comparisons.avg_response_time_hours, true)}
                {metrics && metrics.avg_response_time_hours > METRIC_TARGETS.avg_response_time_hours && (
                  <Badge variant="destructive" className="text-xs">Below Target</Badge>
                )}
              </div>
            </Card>

            {/* Documentation Rate */}
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Documentation Completion</p>
                  {metrics && metrics.documentation_completion_rate < METRIC_TARGETS.documentation_completion_rate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNoteDialog({
                        open: true,
                        metricName: 'documentation_completion_rate',
                        metricLabel: 'Documentation Completion',
                        currentValue: metrics.documentation_completion_rate,
                        targetValue: METRIC_TARGETS.documentation_completion_rate,
                      })}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-3xl font-bold">{metrics?.documentation_completion_rate?.toFixed(0) || 0}%</p>
                {comparisons.documentation_completion_rate && renderTrendIndicator(comparisons.documentation_completion_rate)}
                <Progress value={metrics?.documentation_completion_rate || 0} className="h-2" />
                {metrics && metrics.documentation_completion_rate < METRIC_TARGETS.documentation_completion_rate && (
                  <Badge variant="destructive" className="text-xs">Below Target</Badge>
                )}
              </div>
            </Card>

            {/* Task Completion Rate */}
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Task Completion Rate</p>
                  {metrics && metrics.task_completion_rate < METRIC_TARGETS.task_completion_rate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNoteDialog({
                        open: true,
                        metricName: 'task_completion_rate',
                        metricLabel: 'Task Completion Rate',
                        currentValue: metrics.task_completion_rate,
                        targetValue: METRIC_TARGETS.task_completion_rate,
                      })}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-3xl font-bold">{metrics?.task_completion_rate?.toFixed(0) || 0}%</p>
                {comparisons.task_completion_rate && renderTrendIndicator(comparisons.task_completion_rate)}
                <Progress value={metrics?.task_completion_rate || 0} className="h-2" />
                {metrics && metrics.task_completion_rate < METRIC_TARGETS.task_completion_rate && (
                  <Badge variant="destructive" className="text-xs">Below Target</Badge>
                )}
              </div>
            </Card>

            {/* Client Satisfaction */}
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Client Satisfaction</p>
                  {metrics && metrics.client_satisfaction_score < METRIC_TARGETS.client_satisfaction_score && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNoteDialog({
                        open: true,
                        metricName: 'client_satisfaction_score',
                        metricLabel: 'Client Satisfaction',
                        currentValue: metrics.client_satisfaction_score,
                        targetValue: METRIC_TARGETS.client_satisfaction_score,
                      })}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-3xl font-bold">{metrics?.client_satisfaction_score?.toFixed(2) || 0}/5</p>
                {comparisons.client_satisfaction_score && renderTrendIndicator(comparisons.client_satisfaction_score)}
                {metrics && metrics.client_satisfaction_score < METRIC_TARGETS.client_satisfaction_score && (
                  <Badge variant="destructive" className="text-xs">Below Target</Badge>
                )}
              </div>
            </Card>

            {/* SLA Compliance */}
            <Card className="p-4 border-success/20 bg-success/5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">SLA Compliance</p>
                  {metrics && metrics.sla_compliance_rate < METRIC_TARGETS.sla_compliance_rate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNoteDialog({
                        open: true,
                        metricName: 'sla_compliance_rate',
                        metricLabel: 'SLA Compliance',
                        currentValue: metrics.sla_compliance_rate,
                        targetValue: METRIC_TARGETS.sla_compliance_rate,
                      })}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-3xl font-bold">{metrics?.sla_compliance_rate?.toFixed(0) || 0}%</p>
                {comparisons.sla_compliance_rate && renderTrendIndicator(comparisons.sla_compliance_rate)}
                <Progress value={metrics?.sla_compliance_rate || 0} className="h-2" />
                {metrics && metrics.sla_compliance_rate < METRIC_TARGETS.sla_compliance_rate && (
                  <Badge variant="destructive" className="text-xs">Below Target</Badge>
                )}
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Historical Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historical Performance</CardTitle>
            <Select value={historyMonths.toString()} onValueChange={(val) => setHistoryMonths(parseInt(val))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last Month</SelectItem>
                <SelectItem value="3">Last 3 Months</SelectItem>
                <SelectItem value="6">Last 6 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No historical data available</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
                  <div>Date</div>
                  <div>Cases</div>
                  <div>Response (h)</div>
                  <div>Docs %</div>
                  <div>Tasks %</div>
                  <div>Satisfaction</div>
                  <div>SLA %</div>
                </div>
                {history.slice(0, 30).map((record) => (
                  <div key={record.metric_date} className="grid grid-cols-7 gap-2 text-sm py-2 border-b hover:bg-muted/50">
                    <div className="font-medium">{new Date(record.metric_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    <div>{record.cases_managed}</div>
                    <div>{record.avg_response_time_hours?.toFixed(1)}</div>
                    <div>{record.documentation_completion_rate?.toFixed(0)}%</div>
                    <div>{record.task_completion_rate?.toFixed(0)}%</div>
                    <div>{record.client_satisfaction_score?.toFixed(2)}</div>
                    <div>{record.sla_compliance_rate?.toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metric Note Dialog */}
      {noteDialog && (
        <MetricNoteDialog
          open={noteDialog.open}
          onOpenChange={(open) => !open && setNoteDialog(null)}
          metricName={noteDialog.metricName}
          metricLabel={noteDialog.metricLabel}
          currentValue={noteDialog.currentValue}
          targetValue={noteDialog.targetValue}
          metricDate={new Date().toISOString().split('T')[0]}
          onSaved={() => {
            toast({
              title: "Note Saved",
              description: "Your explanation has been documented for supervisor review.",
            });
          }}
        />
      )}
    </div>
  );
}