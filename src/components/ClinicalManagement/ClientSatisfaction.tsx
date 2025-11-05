import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smile, Frown, Meh, TrendingUp, MessageSquare, Star } from "lucide-react";

interface SatisfactionData {
  period: string;
  overallScore: number;
  responseRate: number;
  totalSurveys: number;
  responses: number;
  breakdown: {
    verySatisfied: number;
    satisfied: number;
    neutral: number;
    dissatisfied: number;
    veryDissatisfied: number;
  };
  topComplaints: string[];
  topPraise: string[];
}

export function ClientSatisfaction() {
  const [data] = useState<SatisfactionData>({
    period: "Q4 2024",
    overallScore: 87,
    responseRate: 68,
    totalSurveys: 156,
    responses: 106,
    breakdown: {
      verySatisfied: 45,
      satisfied: 38,
      neutral: 12,
      dissatisfied: 8,
      veryDissatisfied: 3
    },
    topComplaints: [
      "Response time to calls",
      "Difficulty scheduling appointments",
      "Communication gaps between team members"
    ],
    topPraise: [
      "Caring and compassionate staff",
      "Thorough explanations of care plans",
      "Professional and knowledgeable RNs"
    ]
  });

  const [teamScores] = useState([
    { name: "Sarah Johnson, RN", score: 94, surveys: 28 },
    { name: "Michael Chen, RN", score: 88, surveys: 24 },
    { name: "Emily Rodriguez, RN", score: 91, surveys: 26 },
    { name: "David Kim, RN", score: 85, surveys: 28 }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Client Satisfaction</h2>
          <p className="text-muted-foreground">Track feedback and satisfaction trends</p>
        </div>
        <Button>
          <MessageSquare className="h-4 w-4 mr-2" />
          View All Feedback
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overallScore}%</div>
            <p className="text-xs text-muted-foreground">
              {data.period}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.responseRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.responses} of {data.totalSurveys} surveys
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Very Satisfied</CardTitle>
            <Smile className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.breakdown.verySatisfied}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((data.breakdown.verySatisfied / data.responses) * 100)}% of responses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dissatisfied</CardTitle>
            <Frown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {data.breakdown.dissatisfied + data.breakdown.veryDissatisfied}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(((data.breakdown.dissatisfied + data.breakdown.veryDissatisfied) / data.responses) * 100)}% of responses
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Satisfaction Breakdown</CardTitle>
            <CardDescription>Response distribution by satisfaction level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Very Satisfied", value: data.breakdown.verySatisfied, color: "bg-green-500" },
                { label: "Satisfied", value: data.breakdown.satisfied, color: "bg-blue-500" },
                { label: "Neutral", value: data.breakdown.neutral, color: "bg-yellow-500" },
                { label: "Dissatisfied", value: data.breakdown.dissatisfied, color: "bg-orange-500" },
                { label: "Very Dissatisfied", value: data.breakdown.veryDissatisfied, color: "bg-red-500" }
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value} ({Math.round((item.value / data.responses) * 100)}%)</span>
                  </div>
                  <div className="h-2 rounded bg-muted">
                    <div 
                      className={`h-2 rounded ${item.color}`} 
                      style={{ width: `${(item.value / data.responses) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Member Scores</CardTitle>
            <CardDescription>Individual satisfaction ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamScores.map((member) => (
                <div key={member.name} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.surveys} surveys</div>
                  </div>
                  <Badge variant="outline" className={
                    member.score >= 90 ? "bg-green-500/10 text-green-500 border-green-500/20" :
                    member.score >= 80 ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                    "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                  }>
                    {member.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Frown className="h-5 w-5 text-red-500" />
              Top Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.topComplaints.map((complaint, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
                  <span className="text-sm">{complaint}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smile className="h-5 w-5 text-green-500" />
              Top Praised Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.topPraise.map((praise, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 bg-green-500/10 text-green-500 border-green-500/20">{index + 1}</Badge>
                  <span className="text-sm">{praise}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
