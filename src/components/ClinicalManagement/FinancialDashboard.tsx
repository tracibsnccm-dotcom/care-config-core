import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Users } from "lucide-react";

export function FinancialDashboard() {
  const financialData = {
    budget: {
      total: 450000,
      spent: 382500,
      remaining: 67500,
      percentUsed: 85
    },
    costPerCase: 2850,
    overtimeCosts: {
      month: 12450,
      trend: "up",
      percentChange: 15
    },
    productivity: {
      visitsPerFTE: 24.5,
      target: 25,
      variance: -0.5
    },
    quarterlySpending: [
      { category: "Staffing", amount: 285000, percent: 74.5 },
      { category: "Equipment", amount: 32500, percent: 8.5 },
      { category: "Training", amount: 18500, percent: 4.8 },
      { category: "Supplies", amount: 28500, percent: 7.5 },
      { category: "Other", amount: 18000, percent: 4.7 }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Dashboard</h2>
          <p className="text-muted-foreground">Budget tracking and cost analysis</p>
        </div>
      </div>

      {financialData.budget.percentUsed > 80 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-yellow-500">Budget Alert</CardTitle>
            </div>
            <CardDescription>
              {financialData.budget.percentUsed}% of quarterly budget has been utilized
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Remaining</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(financialData.budget.remaining / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground">
              of ${(financialData.budget.total / 1000).toFixed(0)}K total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Per Case</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialData.costPerCase}</div>
            <p className="text-xs text-muted-foreground">
              Average this quarter
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime Costs</CardTitle>
            {financialData.overtimeCosts.trend === "up" ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(financialData.overtimeCosts.month / 1000).toFixed(1)}K
            </div>
            <p className={`text-xs ${financialData.overtimeCosts.trend === "up" ? "text-red-500" : "text-green-500"}`}>
              {financialData.overtimeCosts.trend === "up" ? "+" : "-"}{financialData.overtimeCosts.percentChange}% vs last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visits per FTE</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialData.productivity.visitsPerFTE}</div>
            <p className="text-xs text-muted-foreground">
              Target: {financialData.productivity.target}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget Utilization</CardTitle>
            <CardDescription>Q1 2025 spending breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Overall Usage</span>
                  <span className="font-medium">{financialData.budget.percentUsed}%</span>
                </div>
                <div className="h-3 rounded bg-muted">
                  <div 
                    className={`h-3 rounded ${financialData.budget.percentUsed > 90 ? "bg-red-500" : financialData.budget.percentUsed > 80 ? "bg-yellow-500" : "bg-green-500"}`}
                    style={{ width: `${financialData.budget.percentUsed}%` }} 
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Spent: ${(financialData.budget.spent / 1000).toFixed(0)}K</span>
                  <span>Budget: ${(financialData.budget.total / 1000).toFixed(0)}K</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spending by Category</CardTitle>
            <CardDescription>Current quarter allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {financialData.quarterlySpending.map((item) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{item.category}</span>
                    <span className="font-medium">${(item.amount / 1000).toFixed(0)}K ({item.percent}%)</span>
                  </div>
                  <div className="h-2 rounded bg-muted">
                    <div 
                      className="h-2 rounded bg-primary" 
                      style={{ width: `${item.percent * 100 / 100}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Financial Insights</CardTitle>
          <CardDescription>Key observations and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-yellow-900">High overtime costs detected</div>
                <div className="text-yellow-700">Consider workload rebalancing or temporary staffing to reduce overtime expenses</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-900">Productivity slightly below target</div>
                <div className="text-blue-700">Current visits per FTE: 24.5 (Target: 25.0). Review scheduling efficiency</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <DollarSign className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-green-900">Training budget underutilized</div>
                <div className="text-green-700">Opportunity to invest in staff development before quarter end</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
