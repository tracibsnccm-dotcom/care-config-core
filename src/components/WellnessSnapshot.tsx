import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Heart, Brain, Smile, Activity } from "lucide-react";
import { useClientCheckins } from "@/hooks/useClientCheckins";

interface WellnessSnapshotProps {
  caseId: string;
  onViewProgress: () => void;
}

export function WellnessSnapshot({ caseId, onViewProgress }: WellnessSnapshotProps) {
  const { checkins, loading } = useClientCheckins(caseId);

  // Calculate averages from last 7 checkins
  const recentCheckins = checkins.slice(0, 7);
  const avgPain = recentCheckins.length > 0
    ? Math.round((recentCheckins.reduce((sum, c) => sum + c.pain_scale, 0) / recentCheckins.length) * 10) / 10
    : 0;
  const avgDepression = recentCheckins.length > 0
    ? Math.round((recentCheckins.reduce((sum, c) => sum + (c.depression_scale || 0), 0) / recentCheckins.length) * 10) / 10
    : 0;
  const avgAnxiety = recentCheckins.length > 0
    ? Math.round((recentCheckins.reduce((sum, c) => sum + (c.anxiety_scale || 0), 0) / recentCheckins.length) * 10) / 10
    : 0;
  const avgPhysical = recentCheckins.length > 0
    ? Math.round(recentCheckins.reduce((sum, c) => sum + c.p_physical, 0) / recentCheckins.length)
    : 0;
  const avgPsychological = recentCheckins.length > 0
    ? Math.round(recentCheckins.reduce((sum, c) => sum + c.p_psychological, 0) / recentCheckins.length)
    : 0;
  const avgPsychosocial = recentCheckins.length > 0
    ? Math.round(recentCheckins.reduce((sum, c) => sum + c.p_psychosocial, 0) / recentCheckins.length)
    : 0;
  const avgProfessional = recentCheckins.length > 0
    ? Math.round(recentCheckins.reduce((sum, c) => sum + c.p_purpose, 0) / recentCheckins.length)
    : 0;

  const metrics = [
    { label: "Pain", value: avgPain, max: 10, icon: Heart, color: "text-destructive" },
    { label: "Depression", value: avgDepression, max: 10, icon: Brain, color: "text-warning" },
    { label: "Anxiety", value: avgAnxiety, max: 10, icon: Brain, color: "text-warning" },
    { label: "Physical", value: avgPhysical, max: 100, icon: Activity, color: "text-primary" },
    { label: "Psychological", value: avgPsychological, max: 100, icon: Smile, color: "text-primary" },
    { label: "Psychosocial", value: avgPsychosocial, max: 100, icon: Activity, color: "text-primary" },
    { label: "Professional", value: avgProfessional, max: 100, icon: Activity, color: "text-primary" },
  ];

  if (loading) {
    return (
      <Card className="p-6 border-primary/20">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white border-2 border-rcms-gold shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-rcms-teal" />
            Wellness Snapshot
          </h2>
          <p className="text-sm text-muted-foreground mt-1">7-day averages</p>
        </div>
        <Button 
          onClick={onViewProgress} 
          size="sm" 
          className="bg-rcms-gold text-foreground hover:bg-rcms-gold/90"
        >
          View Progress Charts
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="text-center">
            <div className={`flex justify-center mb-2 ${metric.color}`}>
              <metric.icon className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-foreground">{metric.value}</div>
            <div className="text-xs text-muted-foreground">/ {metric.max}</div>
            <div className="text-xs font-medium text-foreground mt-1">{metric.label}</div>
          </div>
        ))}
      </div>

      {recentCheckins.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No check-ins yet. Submit your first check-in to see your wellness snapshot!</p>
        </div>
      )}
    </Card>
  );
}
