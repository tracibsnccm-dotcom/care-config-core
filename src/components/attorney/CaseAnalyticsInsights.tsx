import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Award, BarChart3, AlertTriangle, DollarSign, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CaseAnalyticsInsights() {
  const caseOutcomes = {
    settled: 65,
    trial: 15,
    dismissed: 10,
    ongoing: 10
  };

  const treatmentPatterns = [
    { pattern: "Physical Therapy → Full Recovery", cases: 23, success: 87 },
    { pattern: "Surgery → Ongoing Care", cases: 12, success: 65 },
    { pattern: "Conservative Care Only", cases: 34, success: 72 },
    { pattern: "Multi-specialty Treatment", cases: 8, success: 90 }
  ];

  const similarCases = [
    {
      id: "1",
      description: "Lower back injury, construction worker",
      outcome: "Settled",
      amount: 125000,
      duration: "14 months",
      similarity: 92
    },
    {
      id: "2",
      description: "Shoulder injury, office worker",
      outcome: "Settled",
      amount: 85000,
      duration: "10 months",
      similarity: 87
    },
    {
      id: "3",
      description: "Neck injury, delivery driver",
      outcome: "Settled",
      amount: 110000,
      duration: "12 months",
      similarity: 85
    }
  ];

  const predictions = [
    {
      case_id: "RC-12345678",
      client: "John Smith",
      predicted_outcome: "Favorable Settlement",
      confidence: 82,
      estimated_value: "$120,000 - $150,000",
      estimated_duration: "12-16 months",
      risk_factors: ["Multiple providers", "Complex injury"]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Case Success Rate</p>
              <p className="text-2xl font-bold">87%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Settlement</p>
              <p className="text-2xl font-bold">$142K</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Case Duration</p>
              <p className="text-2xl font-bold">13 mo</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold">92%</p>
            </div>
            <Award className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="outcomes" className="w-full">
        <TabsList>
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
          <TabsTrigger value="patterns">Treatment Patterns</TabsTrigger>
          <TabsTrigger value="similar">Similar Cases</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="outcomes">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Case Outcome Distribution</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Settled</span>
                  <span className="font-semibold">{caseOutcomes.settled}%</span>
                </div>
                <Progress value={caseOutcomes.settled} className="h-2 bg-green-100 [&>div]:bg-green-500" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Trial Victory</span>
                  <span className="font-semibold">{caseOutcomes.trial}%</span>
                </div>
                <Progress value={caseOutcomes.trial} className="h-2 bg-blue-100 [&>div]:bg-blue-500" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Dismissed</span>
                  <span className="font-semibold">{caseOutcomes.dismissed}%</span>
                </div>
                <Progress value={caseOutcomes.dismissed} className="h-2 bg-orange-100 [&>div]:bg-orange-500" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Ongoing</span>
                  <span className="font-semibold">{caseOutcomes.ongoing}%</span>
                </div>
                <Progress value={caseOutcomes.ongoing} className="h-2" />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="patterns">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Treatment Pattern Analysis</h3>
            <div className="space-y-4">
              {treatmentPatterns.map((pattern, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{pattern.pattern}</h4>
                      <p className="text-sm text-muted-foreground">{pattern.cases} cases analyzed</p>
                    </div>
                    <Badge variant={pattern.success > 80 ? "default" : "secondary"}>
                      {pattern.success}% success
                    </Badge>
                  </div>
                  <Progress value={pattern.success} className="h-2" />
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="similar">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Similar Case Analysis</h3>
            <div className="space-y-4">
              {similarCases.map((case_) => (
                <Card key={case_.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{case_.description}</h4>
                        <Badge variant="outline">{case_.similarity}% match</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Outcome</p>
                          <p className="font-medium text-green-500">{case_.outcome}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">${case_.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{case_.duration}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="predictions">
          <div className="space-y-4">
            {predictions.map((pred) => (
              <Card key={pred.case_id} className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Target className="h-6 w-6 text-primary" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{pred.client}</h3>
                    <p className="text-sm text-muted-foreground">Case: {pred.case_id}</p>
                  </div>
                  <Badge variant="default">{pred.confidence}% confidence</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Predicted Outcome</p>
                    <p className="text-lg font-semibold text-green-500">{pred.predicted_outcome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Estimated Value</p>
                    <p className="text-lg font-semibold">{pred.estimated_value}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Estimated Duration</p>
                    <p className="text-lg font-semibold">{pred.estimated_duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Confidence Score</p>
                    <Progress value={pred.confidence} className="h-2 mt-2" />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold mb-1">Risk Factors</p>
                      <div className="flex flex-wrap gap-2">
                        {pred.risk_factors.map((factor, idx) => (
                          <Badge key={idx} variant="outline">{factor}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
