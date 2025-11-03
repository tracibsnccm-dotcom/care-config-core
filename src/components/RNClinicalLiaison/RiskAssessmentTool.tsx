import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Shield, TrendingDown, Activity } from "lucide-react";

interface RiskFactor {
  category: string;
  level: "low" | "moderate" | "high" | "critical";
  score: number;
  factors: string[];
}

interface RiskAssessmentToolProps {
  caseId: string;
}

export default function RiskAssessmentTool({ caseId }: RiskAssessmentToolProps) {
  const [riskFactors] = useState<RiskFactor[]>([
    {
      category: "Fall Risk",
      level: "moderate",
      score: 45,
      factors: ["Age > 65", "Balance issues reported", "History of falls"]
    },
    {
      category: "Medication Adherence",
      level: "high",
      score: 72,
      factors: ["Multiple medications", "Memory concerns", "Cost barriers"]
    },
    {
      category: "Pain Management",
      level: "moderate",
      score: 58,
      factors: ["Chronic pain > 6 months", "Multiple pain locations", "Sleep disruption"]
    },
    {
      category: "Mental Health",
      level: "low",
      score: 28,
      factors: ["Mild anxiety symptoms"]
    },
    {
      category: "Social Determinants",
      level: "moderate",
      score: 50,
      factors: ["Transportation barriers", "Limited social support"]
    },
    {
      category: "Re-admission Risk",
      level: "low",
      score: 32,
      factors: ["Stable condition", "Good family support"]
    }
  ]);

  const overallRiskScore = Math.round(
    riskFactors.reduce((sum, factor) => sum + factor.score, 0) / riskFactors.length
  );

  const getOverallRiskLevel = (score: number): "low" | "moderate" | "high" | "critical" => {
    if (score < 30) return "low";
    if (score < 50) return "moderate";
    if (score < 75) return "high";
    return "critical";
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "low": return "bg-green-500";
      case "moderate": return "bg-yellow-500";
      case "high": return "bg-orange-500";
      case "critical": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getLevelTextColor = (level: string) => {
    switch (level) {
      case "low": return "text-green-500";
      case "moderate": return "text-yellow-500";
      case "high": return "text-orange-500";
      case "critical": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const overallLevel = getOverallRiskLevel(overallRiskScore);
  const highRiskCount = riskFactors.filter(f => f.level === "high" || f.level === "critical").length;
  const moderateRiskCount = riskFactors.filter(f => f.level === "moderate").length;
  const lowRiskCount = riskFactors.filter(f => f.level === "low").length;

  return (
    <div className="space-y-6">
      <Card className={`p-6 border-2 ${getLevelColor(overallLevel)}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Overall Risk Assessment</h3>
            <Badge className={getLevelColor(overallLevel)} variant="default">
              {overallLevel.toUpperCase()} RISK
            </Badge>
          </div>
          <div className="text-right">
            <p className={`text-4xl font-bold ${getLevelTextColor(overallLevel)}`}>
              {overallRiskScore}
            </p>
            <p className="text-sm text-muted-foreground">Risk Score</p>
          </div>
        </div>
        <Progress value={overallRiskScore} className="h-3" />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">High Risk Areas</p>
              <p className="text-2xl font-bold text-red-500">{highRiskCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Moderate Risk</p>
              <p className="text-2xl font-bold text-yellow-500">{moderateRiskCount}</p>
            </div>
            <Activity className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Low Risk</p>
              <p className="text-2xl font-bold text-green-500">{lowRiskCount}</p>
            </div>
            <Shield className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Risk Factor Breakdown</h3>
        {riskFactors.map((risk, index) => (
          <Card key={index} className={`p-4 border-l-4 ${getLevelColor(risk.level)}`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{risk.category}</h4>
                  <Badge className={getLevelColor(risk.level)} variant="default">
                    {risk.level}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${getLevelTextColor(risk.level)}`}>
                    {risk.score}
                  </p>
                </div>
              </div>
              
              <Progress value={risk.score} className="h-2" />
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Contributing Factors:</p>
                <ul className="text-sm space-y-1">
                  {risk.factors.map((factor, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-muted-foreground">•</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-blue-50 dark:bg-blue-950">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Risk Mitigation Recommendations
        </h4>
        <ul className="text-sm space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Implement medication management program for adherence improvement</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Schedule fall prevention assessment and home safety evaluation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Refer to chronic pain management specialist</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Connect with social services for transportation assistance</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
