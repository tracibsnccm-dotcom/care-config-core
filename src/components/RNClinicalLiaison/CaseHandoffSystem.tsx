import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, ArrowRight, Check, X, AlertTriangle, Plus, Clock } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CaseHandoffSystem() {
  const [handoffs, setHandoffs] = useState([
    {
      id: "1",
      case_id: "case-123",
      client_name: "J.D.",
      from_rn_name: "Sarah Chen, RN",
      to_rn_name: "Michael Torres, RN",
      handoff_reason: "workload_balance",
      status: "pending",
      requested_at: new Date(2025, 3, 10),
      critical_alerts: "Client has reported increased pain levels",
    },
    {
      id: "2",
      case_id: "case-456",
      client_name: "M.S.",
      from_rn_name: "Sarah Chen, RN",
      to_rn_name: "Emily Rodriguez, RN",
      handoff_reason: "specialty_required",
      status: "accepted",
      requested_at: new Date(2025, 3, 8),
      accepted_at: new Date(2025, 3, 9),
      critical_alerts: "Complex neurological symptoms require specialist knowledge",
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "accepted":
        return "secondary";
      case "completed":
        return "outline";
      case "declined":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      workload_balance: "Workload Balance",
      leave_of_absence: "Leave of Absence",
      specialty_required: "Specialty Required",
      geographic: "Geographic",
      client_request: "Client Request",
      performance: "Performance",
      other: "Other",
    };
    return labels[reason] || reason;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Case Handoff System</h2>
          <p className="text-sm text-muted-foreground">Transfer cases between RN Case Managers</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Initiate Handoff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Initiate Case Handoff</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground">
              Handoff form would go here...
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Declined</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Handoff List */}
      <div className="space-y-4">
        {handoffs.map((handoff) => (
          <Card key={handoff.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getStatusColor(handoff.status)} className="capitalize">
                      {handoff.status}
                    </Badge>
                    <Badge variant="outline">{getReasonLabel(handoff.handoff_reason)}</Badge>
                  </div>
                  <CardTitle className="text-lg">
                    Case Handoff - Client {handoff.client_name}
                  </CardTitle>
                </div>
                <div className="text-sm text-muted-foreground">
                  Requested: {format(handoff.requested_at, "MMM dd, yyyy")}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* RN Transfer Flow */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground mb-1">From</p>
                  <p className="font-medium">{handoff.from_rn_name}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground mb-1">To</p>
                  <p className="font-medium">{handoff.to_rn_name}</p>
                </div>
              </div>

              {/* Critical Alerts */}
              {handoff.critical_alerts && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-1">Critical Alerts</p>
                    <p className="text-sm text-muted-foreground">{handoff.critical_alerts}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                {handoff.status === "pending" && (
                  <>
                    <Button variant="outline" size="sm">
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                    <Button size="sm">
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                  </>
                )}
                {handoff.status === "accepted" && (
                  <Button size="sm">
                    <Check className="w-4 h-4 mr-1" />
                    Complete Handoff
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {handoffs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No active case handoffs</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
