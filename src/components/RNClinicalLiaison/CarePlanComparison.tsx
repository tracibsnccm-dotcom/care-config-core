import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitCompare, CheckCircle2, XCircle } from "lucide-react";

interface CarePlanComparisonProps {
  caseId: string;
}

export default function CarePlanComparison({ caseId }: CarePlanComparisonProps) {
  const plans = [
    {
      id: "1",
      name: "Conservative Treatment Plan",
      version: "1.0",
      created: "2025-01-15",
      duration: "12 weeks",
      components: [
        { name: "Physical Therapy", included: true, frequency: "3x/week" },
        { name: "Pain Management", included: true, frequency: "As needed" },
        { name: "Home Exercise Program", included: true, frequency: "Daily" },
        { name: "Surgical Intervention", included: false, frequency: "—" },
      ],
      estimatedCost: "$3,500",
      expectedOutcome: "70-80% improvement in 12 weeks",
    },
    {
      id: "2",
      name: "Intensive Treatment Plan",
      version: "2.0",
      created: "2025-01-22",
      duration: "8 weeks",
      components: [
        { name: "Physical Therapy", included: true, frequency: "5x/week" },
        { name: "Pain Management", included: true, frequency: "Weekly" },
        { name: "Home Exercise Program", included: true, frequency: "2x daily" },
        { name: "Surgical Intervention", included: false, frequency: "—" },
      ],
      estimatedCost: "$5,800",
      expectedOutcome: "80-90% improvement in 8 weeks",
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <GitCompare className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Care Plan Comparison</h3>
            <p className="text-sm text-muted-foreground">
              Compare different treatment approaches for optimal patient outcomes
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan, index) => (
          <Card key={plan.id} className="p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <Badge variant={index === 0 ? "outline" : "default"}>
                  {index === 0 ? "Current" : "Alternative"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Version {plan.version}</span>
                <span>•</span>
                <span>Created {new Date(plan.created).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <p className="text-sm font-medium mb-1">Duration</p>
                <p className="text-sm text-muted-foreground">{plan.duration}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Treatment Components</p>
                <div className="space-y-2">
                  {plan.components.map((component, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                      <div className="flex items-center gap-2">
                        {component.included ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={component.included ? "" : "text-muted-foreground"}>
                          {component.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{component.frequency}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Estimated Cost</p>
                <p className="text-lg font-bold">{plan.estimatedCost}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Expected Outcome</p>
                <p className="text-sm text-muted-foreground">{plan.expectedOutcome}</p>
              </div>
            </div>

            <Button variant={index === 0 ? "outline" : "default"} className="w-full">
              {index === 0 ? "View Details" : "Adopt This Plan"}
            </Button>
          </Card>
        ))}
      </div>

      <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
        <div className="flex gap-3">
          <GitCompare className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Plan Selection Guidance</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Consider patient goals, insurance coverage, ODG guidelines, and expected outcomes when selecting the optimal care plan.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
