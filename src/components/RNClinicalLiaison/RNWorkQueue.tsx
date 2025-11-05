import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  FileText,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

export function RNWorkQueue() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: workQueue, isLoading } = useQuery({
    queryKey: ["work-queue", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch diary entries for this nurse
      const { data: entries, error } = await supabase
        .from("rn_diary_entries")
        .select("*")
        .eq("rn_id", user.id)
        .order("scheduled_date", { ascending: true })
        .order("priority", { ascending: false });

      if (error) throw error;
      return entries || [];
    },
    enabled: !!user?.id,
  });

  const filteredQueue = workQueue?.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.case_id?.toLowerCase().includes(query) ||
      item.entry_type?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  });

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
    <div className="space-y-4">
      {/* Search and Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              My Work Queue
            </CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span>{workQueue?.filter(w => w.completion_status === "overdue").length} Overdue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>{workQueue?.filter(w => w.completion_status === "in_progress").length} In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>{workQueue?.filter(w => w.completion_status === "completed").length} Completed</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by case ID, type, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Work Queue Table */}
      <Card>
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
                {filteredQueue?.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/case-management/${item.case_id}`)}
                    className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium">{item.case_id}</td>
                    <td className="px-4 py-3 text-sm">{item.entry_type}</td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">{item.description}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(item.scheduled_date), "MMM d, yyyy")}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{getPriorityBadge(item.priority)}</td>
                    <td className="px-4 py-3 text-sm">{getStatusBadge(item.completion_status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredQueue?.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No items in your work queue</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
