import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export function PendingAssignmentsWidget() {
  const navigate = useNavigate();
  
  // Mock data - would be replaced with real data
  const pendingAssignments = [
    { id: 1, clientName: "Sarah Johnson", caseType: "TBI", receivedDate: "2 hours ago" },
    { id: 2, clientName: "Mike Torres", caseType: "Spine", receivedDate: "1 day ago" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Pending Assignments
          {pendingAssignments.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {pendingAssignments.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingAssignments.length > 0 ? (
          <>
            {pendingAssignments.slice(0, 2).map((assignment) => (
              <div
                key={assignment.id}
                className="p-2 border rounded-lg hover:bg-muted/50 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{assignment.clientName}</p>
                    <p className="text-xs text-muted-foreground">{assignment.caseType}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {assignment.receivedDate}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="flex-1">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <XCircle className="h-3 w-3 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/attorney-portal")}
            >
              View All Assignments
            </Button>
          </>
        ) : (
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No pending assignments</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
