import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, AlertCircle, CheckCircle2, TrendingDown } from "lucide-react";

export function ResourceManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Resource & Supply Management</h2>
          <p className="text-muted-foreground">Track equipment and supply inventory</p>
        </div>
        <Button>
          <Package className="h-4 w-4 mr-2" />
          Request Supplies
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">8</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">3</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Service</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Equipment Inventory</CardTitle>
          <CardDescription>Current stock levels and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { item: "Blood Pressure Monitors", quantity: 12, min: 10, status: "adequate" },
              { item: "Oxygen Concentrators", quantity: 5, min: 8, status: "low" },
              { item: "Pulse Oximeters", quantity: 18, min: 15, status: "adequate" },
              { item: "Wound Care Kits", quantity: 3, min: 6, status: "critical" },
              { item: "Glucometers", quantity: 15, min: 12, status: "adequate" }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="font-medium">{item.item}</div>
                  <div className="text-sm text-muted-foreground">
                    Minimum required: {item.min}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold">{item.quantity}</div>
                    <div className="text-xs text-muted-foreground">in stock</div>
                  </div>
                  <Badge variant="outline" className={
                    item.status === "critical" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                    item.status === "low" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                    "bg-green-500/10 text-green-500 border-green-500/20"
                  }>
                    {item.status.toUpperCase()}
                  </Badge>
                  <Button size="sm">Order</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
