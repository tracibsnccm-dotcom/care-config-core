import { supabaseGet } from '@/lib/supabaseRest';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useAuth } from "@/auth/supabaseAuth";
import { 
  Search, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  FileText,
  Calendar,
  ArrowUpDown,
  AlertTriangle
} from "lucide-react";
import { format, parseISO, isBefore, isToday } from "date-fns";
import { CaseDrawer } from "./CaseDrawer";

type WorkQueueItem = {
  id: string;
  case_id: string;
  type: string;
  description: string;
  due_date: string;
  priority: string;
  status: string;
  is_emergency: boolean;
  alert_message?: string;
};

export function RNWorkQueue() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"due_date" | "priority" | "type" | "status">("due_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [workQueue, setWorkQueue] = useState<WorkQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load work queue when user is available
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    const loadWorkQueue = async () => {
      setIsLoading(true);
      try {
        console.log('RNWorkQueue: Loading work queue for user', user.id);
        const workItems: WorkQueueItem[] = [];

        // Fetch cases ready for RN review (attorney_confirmed intakes)
        const { data: confirmedIntakesData, error: intakesError } = await supabaseGet(
          'rc_client_intakes',
          'select=case_id,intake_submitted_at,intake_json&intake_status=eq.attorney_confirmed'
        );

        if (intakesError) {
          console.error('Failed to load intakes:', intakesError);
          setWorkQueue([]);
          return;
        }

        console.log('RNWorkQueue: Confirmed intakes', confirmedIntakesData);
        const confirmedIntakes = Array.isArray(confirmedIntakesData) ? confirmedIntakesData : (confirmedIntakesData ? [confirmedIntakesData] : []);
        const caseIds = confirmedIntakes?.map(i => i.case_id) || [];

        if (caseIds.length === 0) {
          console.log('RNWorkQueue: No confirmed intakes found');
          setWorkQueue([]);
          return;
        }

        // Build query for multiple case IDs (PostgREST format: id=in.(id1,id2,id3))
        const caseIdsQuery = `id=in.(${caseIds.join(',')})`;

        // Fetch case data from rc_cases
        const { data: casesData, error: casesError } = await supabaseGet(
          'rc_cases',
          `select=id,case_status,case_type,created_at&${caseIdsQuery}&is_superseded=eq.false`
        );

        if (casesError) {
          console.error('Failed to load cases:', casesError);
          setWorkQueue([]);
          return;
        }

        console.log('RNWorkQueue: Cases data', casesData);
        const cases = Array.isArray(casesData) ? casesData : (casesData ? [casesData] : []);

        // Fetch case alerts for emergency detection
        const { data: alertsData, error: alertsError } = await supabaseGet(
          'case_alerts',
          `select=case_id,severity,message,alert_type&severity=eq.high&acknowledged_at=is.null&case_id=in.(${caseIds.join(',')})`
        );

        if (alertsError) {
          console.error('Failed to load alerts:', alertsError);
        }

        const alerts = Array.isArray(alertsData) ? alertsData : (alertsData ? [alertsData] : []);

        // Fetch tasks for these cases (keep case_tasks for now)
        const { data: tasksData, error: tasksError } = await supabaseGet(
          'case_tasks',
          `select=*&case_id=in.(${caseIds.join(',')})&status=neq.completed`
        );

        if (tasksError) {
          console.error('Failed to load tasks:', tasksError);
        }

        const tasks = Array.isArray(tasksData) ? tasksData : (tasksData ? [tasksData] : []);

        // Build emergency case set
        const emergencyCases = new Set(
          alerts?.filter(a => a.severity === "high").map(a => a.case_id) || []
        );

        // Process cases as work items
        cases?.forEach(caseItem => {
          const intake = confirmedIntakes?.find(i => i.case_id === caseItem.id);
          const isEmergency = emergencyCases.has(caseItem.id);
          
          // Create work item for the case itself
          workItems.push({
            id: caseItem.id,
            case_id: caseItem.id,
            type: "case_review",
            description: `Case review required - ${caseItem.case_type || "N/A"}`,
            due_date: intake?.intake_submitted_at || caseItem.created_at || new Date().toISOString(),
            priority: isEmergency ? "urgent" : "high",
            status: "pending",
            is_emergency: isEmergency,
            alert_message: isEmergency ? alerts?.find(a => a.case_id === caseItem.id)?.message : undefined
          });
        });

        // Process tasks
        tasks?.forEach(task => {
          const isEmergency = emergencyCases.has(task.case_id);
          workItems.push({
            id: task.id,
            case_id: task.case_id,
            type: "task",
            description: task.title + (task.description ? ` - ${task.description}` : ""),
            due_date: task.due_date || new Date().toISOString(),
            priority: isEmergency ? "urgent" : "medium",
            status: task.status,
            is_emergency: isEmergency,
            alert_message: isEmergency ? alerts?.find(a => a.case_id === task.case_id)?.message : undefined
          });
        });

        console.log('RNWorkQueue: Final work items', workItems);
        setWorkQueue(workItems);
      } catch (error) {
        console.error('Failed to load work queue:', error);
        setWorkQueue([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWorkQueue();
  }, [user?.id]);

  // Separate emergency and regular items
  const emergencyItems = workQueue?.filter(item => item.is_emergency) || [];
  const regularItems = workQueue?.filter(item => !item.is_emergency) || [];

  // Sort function
  const sortItems = (items: WorkQueueItem[]) => {
    return [...items].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "due_date":
          comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case "priority":
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - 
                      (priorityOrder[b.priority as keyof typeof priorityOrder] || 3);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  // Apply search filter
  const filterItems = (items: WorkQueueItem[]) => {
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.case_id?.toLowerCase().includes(query) ||
      item.type?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  };

  const sortedEmergencyItems = sortItems(filterItems(emergencyItems));
  const sortedRegularItems = sortItems(filterItems(regularItems));
  const hasEmergencies = sortedEmergencyItems.length > 0;

  const handleRowClick = (item: WorkQueueItem) => {
    // Block access to regular items if emergencies exist
    if (hasEmergencies && !item.is_emergency) {
      return; // Do nothing
    }
    setSelectedCaseId(item.case_id);
    setDrawerOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { variant: "default" as const, icon: CheckCircle2, className: "bg-green-100 text-green-800" },
      in_progress: { variant: "secondary" as const, icon: Clock, className: "bg-blue-100 text-blue-800" },
      overdue: { variant: "destructive" as const, icon: AlertCircle, className: "bg-red-100 text-red-800" },
      pending: { variant: "outline" as const, icon: FileText, className: "bg-gray-100 text-gray-800" },
    };

    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: "bg-red-500 text-white",
      high: "bg-orange-500 text-white",
      medium: "bg-yellow-500 text-white",
      low: "bg-green-500 text-white",
    };

    return (
      <Badge className={colors[priority as keyof typeof colors] || colors.medium}>
        {priority}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <CaseDrawer
        caseId={selectedCaseId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
      
      <div className="space-y-4">
      {/* Emergency Alert Banner */}
      {hasEmergencies && (
        <Card className="border-red-500 bg-red-50 animate-pulse">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-bold text-red-900">EMERGENCY CASES REQUIRE IMMEDIATE ATTENTION</h3>
                <p className="text-sm text-red-700">
                  You must address {emergencyItems.length} emergency case{emergencyItems.length > 1 ? 's' : ''} before accessing other cases.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              My Work Queue
            </CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="font-bold">{emergencyItems.length} Emergency</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                <span>{workQueue?.filter(w => w.status === "overdue" && !w.is_emergency).length} Overdue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>{workQueue?.filter(w => w.status === "in_progress").length} In Progress</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by case ID, type, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_date">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Work Queue Table */}
      {sortedEmergencyItems.length > 0 && (
        <Card className="border-red-500">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              Emergency Cases
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-red-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Case ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Due Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEmergencyItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      className="border-b bg-red-50 hover:bg-red-100 cursor-pointer transition-colors animate-pulse"
                    >
                      <td className="px-4 py-3 text-sm font-bold text-red-900">{item.case_id}</td>
                      <td className="px-4 py-3 text-sm">{item.type}</td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate font-medium">{item.description}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1 text-red-700">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(item.due_date), "MMM d, yyyy")}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className="bg-red-600 text-white">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          URGENT
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regular Work Queue Table */}
      <Card className={hasEmergencies ? "opacity-50 pointer-events-none" : ""}>
        {hasEmergencies && (
          <div className="absolute inset-0 bg-gray-900/20 z-10 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <p className="font-bold text-gray-900">Complete emergency cases first</p>
            </div>
          </div>
        )}
        <CardHeader>
          <CardTitle>Regular Cases</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Case ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Due Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Priority</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedRegularItems.map((item) => {
                  const dueDate = parseISO(item.due_date);
                  const isOverdue = isBefore(dueDate, new Date()) && !isToday(dueDate);
                  
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      className={`border-b hover:bg-muted/30 transition-colors ${
                        hasEmergencies ? "cursor-not-allowed" : "cursor-pointer"
                      } ${isOverdue ? "bg-orange-50" : ""}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium">{item.case_id}</td>
                      <td className="px-4 py-3 text-sm">{item.type}</td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate">{item.description}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className={`flex items-center gap-1 ${isOverdue ? "text-orange-700 font-medium" : ""}`}>
                          <Calendar className="h-3 w-3" />
                          {format(dueDate, "MMM d, yyyy")}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{getPriorityBadge(item.priority)}</td>
                      <td className="px-4 py-3 text-sm">{getStatusBadge(item.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {sortedRegularItems.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No items in your work queue</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
