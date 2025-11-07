import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, Minus, Activity, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface BaselineScores {
  fourPs: {
    physical: number;
    psychological: number;
    psychosocial: number;
    professional: number;
  };
  sdoh: {
    housing: number;
    food: number;
    transport: number;
    insuranceGap: number;
    financial: number;
    employment: number;
    social_support: number;
    safety: number;
    healthcare_access: number;
  };
  baselineDate: string;
}

interface CurrentScores {
  physical: number;
  psychological: number;
  psychosocial: number;
  professional: number;
  housing: number;
  food: number;
  transport: number;
  insurance: number;
  financial: number;
  employment: number;
  social_support: number;
  safety: number;
  healthcare_access: number;
  checkinDate: string;
}

interface BaselineProgressComparisonProps {
  caseId: string;
}

export function BaselineProgressComparison({ caseId }: BaselineProgressComparisonProps) {
  const [baseline, setBaseline] = useState<BaselineScores | null>(null);
  const [current, setCurrent] = useState<CurrentScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScores();
  }, [caseId]);

  const fetchScores = async () => {
    try {
      setLoading(true);

      // Fetch baseline from cases table
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("fourps, sdoh, created_at")
        .eq("id", caseId)
        .single();

      if (caseError) throw caseError;

      if (caseData?.fourps && caseData?.sdoh) {
        setBaseline({
          fourPs: caseData.fourps as any,
          sdoh: caseData.sdoh as any,
          baselineDate: caseData.created_at
        });
      }

      // Fetch latest check-in
      const user = await supabase.auth.getUser();
      const { data: checkinData, error: checkinError } = await supabase
        .from("client_checkins")
        .select("*")
        .eq("case_id", caseId)
        .eq("client_id", user.data.user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!checkinError && checkinData) {
        setCurrent({
          physical: checkinData.p_physical,
          psychological: checkinData.p_psychological,
          psychosocial: checkinData.p_psychosocial,
          professional: checkinData.p_purpose,
          housing: checkinData.sdoh_housing ?? 0,
          food: checkinData.sdoh_food ?? 0,
          transport: checkinData.sdoh_transport ?? 0,
          insurance: checkinData.sdoh_insurance ?? 0,
          financial: checkinData.sdoh_financial ?? 0,
          employment: checkinData.sdoh_employment ?? 0,
          social_support: checkinData.sdoh_social_support ?? 0,
          safety: checkinData.sdoh_safety ?? 0,
          healthcare_access: checkinData.sdoh_healthcare_access ?? 0,
          checkinDate: checkinData.created_at
        });
      }
    } catch (err: any) {
      console.error("Error fetching scores:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateChange = (baselineVal: number, currentVal: number) => {
    const change = currentVal - baselineVal;
    return {
      value: Math.abs(change).toFixed(1),
      direction: change > 0 ? "up" : change < 0 ? "down" : "same",
      isImprovement: change < 0 // Lower scores are better
    };
  };

  const getChangeIcon = (direction: string, isImprovement: boolean) => {
    if (direction === "same") return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (direction === "up") {
      return isImprovement ? 
        <TrendingUp className="w-4 h-4 text-green-600" /> : 
        <TrendingUp className="w-4 h-4 text-red-600" />;
    }
    return isImprovement ? 
      <TrendingDown className="w-4 h-4 text-green-600" /> : 
      <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Error loading baseline comparison: {error}</AlertDescription>
      </Alert>
    );
  }

  if (!baseline) {
    return (
      <Alert>
        <AlertDescription>
          Baseline scores not available. Complete your intake assessment to establish baseline.
        </AlertDescription>
      </Alert>
    );
  }

  if (!current) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Baseline Assessment Snapshot
          </CardTitle>
          <CardDescription>
            Established on {formatDate(baseline.baselineDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              Complete your first check-in to see progress compared to your baseline.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-3">Baseline 4Ps of Wellness</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Physical", value: baseline.fourPs.physical },
                  { label: "Psychological", value: baseline.fourPs.psychological },
                  { label: "Psychosocial", value: baseline.fourPs.psychosocial },
                  { label: "Professional", value: baseline.fourPs.professional }
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold text-foreground">{item.value}</div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall progress
  const fourPsComparison = [
    { label: "Physical", baseline: baseline.fourPs.physical, current: current.physical },
    { label: "Psychological", baseline: baseline.fourPs.psychological, current: current.psychological },
    { label: "Psychosocial", baseline: baseline.fourPs.psychosocial, current: current.psychosocial },
    { label: "Professional", baseline: baseline.fourPs.professional, current: current.professional }
  ];

  const sdohComparison = [
    { label: "Housing", baseline: baseline.sdoh.housing, current: current.housing },
    { label: "Food Security", baseline: baseline.sdoh.food, current: current.food },
    { label: "Transportation", baseline: baseline.sdoh.transport, current: current.transport },
    { label: "Insurance", baseline: baseline.sdoh.insuranceGap, current: current.insurance },
    { label: "Financial", baseline: baseline.sdoh.financial, current: current.financial },
    { label: "Employment", baseline: baseline.sdoh.employment, current: current.employment },
    { label: "Social Support", baseline: baseline.sdoh.social_support, current: current.social_support },
    { label: "Safety", baseline: baseline.sdoh.safety, current: current.safety },
    { label: "Healthcare Access", baseline: baseline.sdoh.healthcare_access, current: current.healthcare_access }
  ];

  // Calculate average baseline and current
  const avgBaseline = (
    [...fourPsComparison.map(c => c.baseline), ...sdohComparison.map(c => c.baseline)]
      .reduce((sum, val) => sum + val, 0) / 13
  ).toFixed(1);

  const avgCurrent = (
    [...fourPsComparison.map(c => c.current), ...sdohComparison.map(c => c.current)]
      .reduce((sum, val) => sum + val, 0) / 13
  ).toFixed(1);

  const overallChange = calculateChange(Number(avgBaseline), Number(avgCurrent));

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Baseline vs. Current Progress
            </CardTitle>
            <CardDescription>
              Comparing your journey from baseline to today
            </CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            {getChangeIcon(overallChange.direction, overallChange.isImprovement)}
            {overallChange.direction !== "same" && `${overallChange.value} change`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline dates */}
        <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Baseline:</span>
            <span>{formatDate(baseline.baselineDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Latest:</span>
            <span>{formatDate(current.checkinDate)}</span>
          </div>
        </div>

        {/* Overall comparison */}
        <div className="p-4 bg-primary/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Overall Average Score</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {avgBaseline} → {avgCurrent}
              </span>
              {getChangeIcon(overallChange.direction, overallChange.isImprovement)}
            </div>
          </div>
          <Progress value={((4 - Number(avgCurrent)) / 4) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Lower scores indicate better wellness (0 = No concerns, 4 = Critical)
          </p>
        </div>

        {/* 4Ps Comparison */}
        <div>
          <h4 className="font-semibold text-sm mb-3 text-foreground">4Ps of Wellness Comparison</h4>
          <div className="space-y-3">
            {fourPsComparison.map((item) => {
              const change = calculateChange(item.baseline, item.current);
              return (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.label}</span>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {item.baseline} → {item.current}
                        </Badge>
                        {getChangeIcon(change.direction, change.isImprovement)}
                      </div>
                    </div>
                    <Progress 
                      value={((4 - item.current) / 4) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SDOH Comparison */}
        <div>
          <h4 className="font-semibold text-sm mb-3 text-foreground">Social Determinants of Health Comparison</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sdohComparison.map((item) => {
              const change = calculateChange(item.baseline, item.current);
              return (
                <div key={item.label} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                  <span className="flex-1">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {item.baseline} → {item.current}
                    </span>
                    {getChangeIcon(change.direction, change.isImprovement)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
