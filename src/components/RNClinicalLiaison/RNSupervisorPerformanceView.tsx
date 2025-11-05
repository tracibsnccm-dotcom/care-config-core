import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, TrendingUp, Award, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RNMetricsSummary {
  rn_user_id: string;
  rn_name: string;
  avg_cases_managed: number;
  avg_response_time: number;
  avg_documentation_rate: number;
  avg_task_completion: number;
  avg_client_satisfaction: number;
  avg_sla_compliance: number;
  recent_reviews: any[];
  metric_notes: any[];
}

interface PerformanceReview {
  overall_rating: number;
  performance_tier: string;
  response_time_score: number;
  documentation_score: number;
  task_completion_score: number;
  client_satisfaction_score: number;
  sla_compliance_score: number;
  quality_score: number;
  strengths: string;
  areas_for_improvement: string;
}

export function RNSupervisorPerformanceView() {
  const [rnList, setRnList] = useState<RNMetricsSummary[]>([]);
  const [selectedRN, setSelectedRN] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<Partial<PerformanceReview>>({
    performance_tier: "Meets Expectations",
  });
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRNMetrics();
  }, []);

  const fetchRNMetrics = async () => {
    try {
      // Get all RN CMs
      const { data: rnUsers, error: rnError } = await supabase
        .from("user_roles")
        .select("user_id, profiles(display_name)")
        .in("role", ["RN_CM", "RCMS_CLINICAL_MGMT"]);

      if (rnError) throw rnError;

      const rnMetrics: RNMetricsSummary[] = [];

      for (const rn of rnUsers || []) {
        // Get 30-day average metrics
        const { data: metrics, error: metricsError } = await supabase
          .from("rn_daily_metrics")
          .select("*")
          .eq("rn_user_id", rn.user_id)
          .gte("metric_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (metricsError) continue;

        // Get recent reviews
        const { data: reviews, error: reviewsError } = await supabase
          .from("rn_performance_reviews")
          .select("*")
          .eq("rn_user_id", rn.user_id)
          .order("created_at", { ascending: false })
          .limit(3);

        // Get recent metric notes (last 30 days)
        const { data: notes, error: notesError } = await supabase
          .from("rn_metric_notes")
          .select("*")
          .eq("rn_user_id", rn.user_id)
          .gte("metric_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order("metric_date", { ascending: false });

        const avgMetrics = metrics?.reduce(
          (acc, m) => ({
            cases: acc.cases + (m.cases_managed || 0),
            response: acc.response + (m.avg_response_time_hours || 0),
            docs: acc.docs + (m.documentation_completion_rate || 0),
            tasks: acc.tasks + (m.task_completion_rate || 0),
            satisfaction: acc.satisfaction + (m.client_satisfaction_score || 0),
            sla: acc.sla + (m.sla_compliance_rate || 0),
            count: acc.count + 1,
          }),
          { cases: 0, response: 0, docs: 0, tasks: 0, satisfaction: 0, sla: 0, count: 0 }
        );

        const count = avgMetrics?.count || 1;

        rnMetrics.push({
          rn_user_id: rn.user_id,
          rn_name: (rn.profiles as any)?.display_name || "Unknown RN",
          avg_cases_managed: avgMetrics ? avgMetrics.cases / count : 0,
          avg_response_time: avgMetrics ? avgMetrics.response / count : 0,
          avg_documentation_rate: avgMetrics ? avgMetrics.docs / count : 0,
          avg_task_completion: avgMetrics ? avgMetrics.tasks / count : 0,
          avg_client_satisfaction: avgMetrics ? avgMetrics.satisfaction / count : 0,
          avg_sla_compliance: avgMetrics ? avgMetrics.sla / count : 0,
          recent_reviews: reviews || [],
          metric_notes: notes || [],
        });
      }

      setRnList(rnMetrics);
    } catch (error) {
      console.error("Error fetching RN metrics:", error);
      toast({
        title: "Error",
        description: "Failed to load RN performance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallScore = () => {
    const scores = [
      reviewData.response_time_score || 0,
      reviewData.documentation_score || 0,
      reviewData.task_completion_score || 0,
      reviewData.client_satisfaction_score || 0,
      reviewData.sla_compliance_score || 0,
      reviewData.quality_score || 0,
    ];
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const submitReview = async () => {
    if (!selectedRN) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const overallRating = calculateOverallScore() / 20; // Convert 0-100 to 0-5

      const { error } = await supabase
        .from("rn_performance_reviews")
        .insert({
          rn_user_id: selectedRN,
          reviewer_id: user.id,
          review_period_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          review_period_end: new Date().toISOString().split('T')[0],
          overall_rating: overallRating,
          performance_tier: reviewData.performance_tier,
          response_time_score: reviewData.response_time_score,
          documentation_score: reviewData.documentation_score,
          task_completion_score: reviewData.task_completion_score,
          client_satisfaction_score: reviewData.client_satisfaction_score,
          sla_compliance_score: reviewData.sla_compliance_score,
          quality_score: reviewData.quality_score,
          strengths: reviewData.strengths,
          areas_for_improvement: reviewData.areas_for_improvement,
          status: "submitted",
        });

      if (error) throw error;

      toast({
        title: "Review Submitted",
        description: "Performance review has been saved successfully.",
      });

      setShowReviewDialog(false);
      setReviewData({ performance_tier: "Meets Expectations" });
      fetchRNMetrics();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  const getPerformanceBadgeVariant = (tier: string) => {
    switch (tier) {
      case "Exceeds Expectations":
        return "default";
      case "Meets Expectations":
        return "secondary";
      case "Needs Improvement":
        return "outline";
      case "Unsatisfactory":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading RN performance data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            RN Case Manager Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rnList.map((rn) => (
              <Card key={rn.rn_user_id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{rn.rn_name}</h3>
                      {rn.recent_reviews.length > 0 && (
                        <Badge variant={getPerformanceBadgeVariant(rn.recent_reviews[0].performance_tier)}>
                          {rn.recent_reviews[0].performance_tier}
                        </Badge>
                      )}
                    </div>
                    <Dialog open={showReviewDialog && selectedRN === rn.rn_user_id} onOpenChange={setShowReviewDialog}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRN(rn.rn_user_id);
                            // Pre-populate scores based on current metrics
                            setReviewData({
                              performance_tier: "Meets Expectations",
                              response_time_score: Math.min(100, Math.max(0, 100 - rn.avg_response_time * 5)),
                              documentation_score: rn.avg_documentation_rate,
                              task_completion_score: rn.avg_task_completion,
                              client_satisfaction_score: rn.avg_client_satisfaction * 20,
                              sla_compliance_score: rn.avg_sla_compliance,
                              quality_score: rn.avg_documentation_rate,
                            });
                          }}
                        >
                          Create Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Performance Review for {rn.rn_name}</DialogTitle>
                          <DialogDescription>
                            Complete the quarterly performance review based on metrics and observations
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                          {/* Overall Rating */}
                          <div>
                            <Label>Performance Tier</Label>
                            <Select
                              value={reviewData.performance_tier}
                              onValueChange={(val) => setReviewData({ ...reviewData, performance_tier: val })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Exceeds Expectations">Exceeds Expectations</SelectItem>
                                <SelectItem value="Meets Expectations">Meets Expectations</SelectItem>
                                <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                                <SelectItem value="Unsatisfactory">Unsatisfactory</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Metric Scores */}
                          <div className="grid grid-cols-2 gap-4">
                            {[
                              { key: 'response_time_score', label: 'Response Time' },
                              { key: 'documentation_score', label: 'Documentation' },
                              { key: 'task_completion_score', label: 'Task Completion' },
                              { key: 'client_satisfaction_score', label: 'Client Satisfaction' },
                              { key: 'sla_compliance_score', label: 'SLA Compliance' },
                              { key: 'quality_score', label: 'Quality' },
                            ].map((metric) => (
                              <div key={metric.key}>
                                <Label>{metric.label} Score (0-100)</Label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="w-full border rounded px-3 py-2 mt-1"
                                  value={reviewData[metric.key as keyof PerformanceReview] as number || 0}
                                  onChange={(e) =>
                                    setReviewData({ ...reviewData, [metric.key]: parseFloat(e.target.value) })
                                  }
                                />
                                <Progress
                                  value={reviewData[metric.key as keyof PerformanceReview] as number || 0}
                                  className="h-2 mt-2"
                                />
                              </div>
                            ))}
                          </div>

                          {/* Strengths */}
                          <div>
                            <Label>Strengths</Label>
                            <Textarea
                              value={reviewData.strengths || ""}
                              onChange={(e) => setReviewData({ ...reviewData, strengths: e.target.value })}
                              placeholder="Document key strengths and accomplishments..."
                              className="min-h-[100px] mt-1"
                            />
                          </div>

                          {/* Areas for Improvement */}
                          <div>
                            <Label>Areas for Improvement</Label>
                            <Textarea
                              value={reviewData.areas_for_improvement || ""}
                              onChange={(e) =>
                                setReviewData({ ...reviewData, areas_for_improvement: e.target.value })
                              }
                              placeholder="Document areas needing development..."
                              className="min-h-[100px] mt-1"
                            />
                          </div>

                          {/* Overall Score Display */}
                          <Card className="p-4 bg-primary/5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">Overall Score:</span>
                              <span className="text-2xl font-bold">{calculateOverallScore().toFixed(1)}/100</span>
                            </div>
                            <Progress value={calculateOverallScore()} className="h-2 mt-2" />
                          </Card>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={submitReview}>Submit Review</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* 30-Day Metrics Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Avg Cases/Day</p>
                      <p className="font-semibold text-lg">{rn.avg_cases_managed.toFixed(1)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Avg Response</p>
                      <p className="font-semibold text-lg">{rn.avg_response_time.toFixed(1)}h</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Documentation</p>
                      <p className="font-semibold text-lg">{rn.avg_documentation_rate.toFixed(0)}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Task Completion</p>
                      <p className="font-semibold text-lg">{rn.avg_task_completion.toFixed(0)}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Satisfaction</p>
                      <p className="font-semibold text-lg">{rn.avg_client_satisfaction.toFixed(2)}/5</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">SLA Compliance</p>
                      <p className="font-semibold text-lg">{rn.avg_sla_compliance.toFixed(0)}%</p>
                    </div>
                  </div>

                  {/* Recent Reviews */}
                  {rn.recent_reviews.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-muted-foreground mb-2">Recent Reviews</p>
                      <div className="space-y-2">
                        {rn.recent_reviews.slice(0, 2).map((review: any) => (
                          <div key={review.id} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                            <span>
                              {new Date(review.created_at).toLocaleDateString()} - {review.performance_tier}
                            </span>
                            <span className="font-medium">{review.overall_rating.toFixed(2)}/5</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Below-Standard Metric Notes */}
                  {rn.metric_notes.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Below-Standard Metric Notes (Last 30 Days)
                      </p>
                      <div className="space-y-2">
                        {rn.metric_notes.slice(0, 3).map((note: any) => (
                          <div key={note.id} className="text-xs p-2 bg-warning/10 border border-warning/20 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{note.metric_name.replace(/_/g, ' ')}</span>
                              <span className="text-muted-foreground">
                                {new Date(note.metric_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{note.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}