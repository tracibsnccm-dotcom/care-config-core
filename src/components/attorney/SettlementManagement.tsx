import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, FileText, Clock, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Settlement {
  id: string;
  case_id: string;
  client_name: string;
  demand_amount: number;
  offer_amount?: number;
  settled_amount?: number;
  status: "negotiating" | "pending" | "settled" | "rejected";
  last_update: string;
  settlement_date?: string;
  negotiation_history: {
    date: string;
    party: string;
    amount: number;
    notes: string;
  }[];
}

export default function SettlementManagement() {
  const [settlements] = useState<Settlement[]>([
    {
      id: "1",
      case_id: "RC-12345678",
      client_name: "John Smith",
      demand_amount: 150000,
      offer_amount: 100000,
      status: "negotiating",
      last_update: "2025-10-28",
      negotiation_history: [
        { date: "2025-10-15", party: "Attorney", amount: 150000, notes: "Initial demand" },
        { date: "2025-10-20", party: "Insurance", amount: 80000, notes: "Initial offer" },
        { date: "2025-10-25", party: "Attorney", amount: 130000, notes: "Counter demand" },
        { date: "2025-10-28", party: "Insurance", amount: 100000, notes: "Increased offer" }
      ]
    },
    {
      id: "2",
      case_id: "RC-87654321",
      client_name: "Jane Doe",
      demand_amount: 200000,
      settled_amount: 175000,
      status: "settled",
      last_update: "2025-10-20",
      settlement_date: "2025-10-20",
      negotiation_history: [
        { date: "2025-09-01", party: "Attorney", amount: 200000, notes: "Demand letter sent" },
        { date: "2025-09-15", party: "Insurance", amount: 150000, notes: "Settlement offer" },
        { date: "2025-10-01", party: "Attorney", amount: 185000, notes: "Counter offer" },
        { date: "2025-10-20", party: "Insurance", amount: 175000, notes: "Final agreement" }
      ]
    }
  ]);

  const activeSettlements = settlements.filter(s => s.status !== "settled" && s.status !== "rejected");
  const settledCases = settlements.filter(s => s.status === "settled");
  const totalSettled = settledCases.reduce((sum, s) => sum + (s.settled_amount || 0), 0);
  const avgSettlement = settledCases.length > 0 ? totalSettled / settledCases.length : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "negotiating": return "default";
      case "pending": return "secondary";
      case "settled": return "default";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  const calculateProgress = (settlement: Settlement) => {
    if (settlement.status === "settled" && settlement.settled_amount) {
      return (settlement.settled_amount / settlement.demand_amount) * 100;
    }
    if (settlement.offer_amount) {
      return (settlement.offer_amount / settlement.demand_amount) * 100;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Negotiations</p>
              <p className="text-2xl font-bold">{activeSettlements.length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Settled Cases</p>
              <p className="text-2xl font-bold text-green-500">{settledCases.length}</p>
            </div>
            <FileText className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Settled</p>
              <p className="text-2xl font-bold">${totalSettled.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Settlement</p>
              <p className="text-2xl font-bold">${avgSettlement.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active ({activeSettlements.length})</TabsTrigger>
          <TabsTrigger value="settled">Settled ({settledCases.length})</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeSettlements.map((settlement) => (
            <Card key={settlement.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{settlement.client_name}</h3>
                    <p className="text-sm text-muted-foreground">Case: {settlement.case_id}</p>
                  </div>
                  <Badge variant={getStatusColor(settlement.status)}>
                    {settlement.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Demand Amount</p>
                    <p className="text-xl font-bold">${settlement.demand_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Offer</p>
                    <p className="text-xl font-bold text-blue-500">
                      ${settlement.offer_amount?.toLocaleString() || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Progress</p>
                    <p className="text-xl font-bold">{calculateProgress(settlement).toFixed(0)}%</p>
                  </div>
                </div>

                <Progress value={calculateProgress(settlement)} className="h-2" />

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Negotiation History</h4>
                  <div className="space-y-2">
                    {settlement.negotiation_history.map((history, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm">
                        <div className="min-w-[80px] text-muted-foreground">
                          {new Date(history.date).toLocaleDateString()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {history.party}
                            </Badge>
                            <span className="font-semibold">
                              ${history.amount.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-1">{history.notes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline">View Details</Button>
                  <Button>Add Counter Offer</Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="settled" className="space-y-4">
          {settledCases.map((settlement) => (
            <Card key={settlement.id} className="p-6 opacity-80">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{settlement.client_name}</h3>
                  <p className="text-sm text-muted-foreground">Case: {settlement.case_id}</p>
                </div>
                <Badge variant="default">Settled</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Demand</p>
                  <p className="text-lg font-semibold">${settlement.demand_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Settled Amount</p>
                  <p className="text-lg font-semibold text-green-500">
                    ${settlement.settled_amount?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Settlement Date</p>
                  <p className="text-lg font-semibold">
                    {settlement.settlement_date && new Date(settlement.settlement_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="calculator">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Settlement Calculator</h3>
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Calculate potential settlement values</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Open Calculator
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
