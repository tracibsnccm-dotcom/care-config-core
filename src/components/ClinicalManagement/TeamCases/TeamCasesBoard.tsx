import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTeamCases } from "@/hooks/useTeamCases";
import { Eye, CheckCircle, Clock, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

export function TeamCasesBoard() {
  const { cases, loading } = useTeamCases();

  if (loading) {
    return <div className="text-muted-foreground">Loading cases...</div>;
  }

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      'Active': 'bg-green-100 text-green-800 border-green-200',
      'Pending Review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Under Review': 'bg-blue-100 text-blue-800 border-blue-200',
      'Closed': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Group cases by assigned RN
  const casesByRN = cases.reduce((acc, c) => {
    const key = c.assigned_name || 'Unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {} as Record<string, typeof cases>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team Cases Board</h2>
          <p className="text-sm text-muted-foreground mt-1">View all cases by team member</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Total Cases</div>
          <div className="text-3xl font-bold text-foreground">{cases.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(casesByRN).map(([rnName, rnCases]) => (
          <Card key={rnName} className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="truncate">{rnName}</span>
                <Badge variant="secondary">{rnCases.length} cases</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              {rnCases.slice(0, 5).map((c) => {
                const taskProgress = c.total_tasks > 0 ? Math.round((c.completed_tasks / c.total_tasks) * 100) : 0;
                
                return (
                  <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-foreground mb-1">
                            {c.client_label || c.client_number || 'Unknown Client'}
                          </div>
                          <Badge variant="outline" className={`text-xs ${getStatusColor(c.status)}`}>
                            {c.status}
                          </Badge>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(c.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>{c.note_count} notes</span>
                        </div>
                        {c.total_tasks > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Tasks
                              </span>
                              <span>{c.completed_tasks}/{c.total_tasks}</span>
                            </div>
                            <Progress value={taskProgress} className="h-1" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {rnCases.length > 5 && (
                <Button variant="outline" className="w-full" size="sm">
                  View All {rnCases.length} Cases
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}