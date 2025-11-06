import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/auth/supabaseAuth";
import { Case, CaseStatus } from "@/config/rcms";
import { canSearchByName, getDisplayName } from "@/lib/rcms-core";
import { Search, Filter, Calendar, User, AlertTriangle, CheckCircle2, Clock, Shield } from "lucide-react";
import { format } from "date-fns";

export function CaseDashboardView() {
  const navigate = useNavigate();
  const { cases, role } = useApp();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const canSearchNames = canSearchByName(role);

  // Filter cases
  const filteredCases = cases.filter((c) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesId = c.id.toLowerCase().includes(query) || 
                        c.client.rcmsId.toLowerCase().includes(query);
      const matchesName = canSearchNames && c.client.fullName?.toLowerCase().includes(query);
      
      if (!matchesId && !matchesName) return false;
    }

    // Status filter
    if (statusFilter !== "all" && c.status !== statusFilter) return false;

    // Date filter
    if (dateFilter !== "all") {
      const caseDate = new Date(c.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - caseDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dateFilter === "7days" && daysDiff > 7) return false;
      if (dateFilter === "30days" && daysDiff > 30) return false;
      if (dateFilter === "90days" && daysDiff > 90) return false;
    }

    return true;
  });

  const getStatusConfig = (status: CaseStatus) => {
    const configs = {
      NEW: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock, label: "New" },
      AWAITING_CONSENT: { color: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: AlertTriangle, label: "Awaiting Consent" },
      IN_PROGRESS: { color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2, label: "In Progress" },
      ROUTED: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: User, label: "Routed" },
      HOLD_SENSITIVE: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: Shield, label: "Hold - Sensitive" },
      CLOSED: { color: "bg-muted text-muted-foreground border-border", icon: CheckCircle2, label: "Closed" },
    };
    return configs[status] || configs.NEW;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Case Dashboard</h2>
        <p className="text-muted-foreground">Manage and track all client cases</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={canSearchNames ? "Search by case #, ID, or name" : "Search by case # or ID"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="AWAITING_CONSENT">Awaiting Consent</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="ROUTED">Routed</SelectItem>
              <SelectItem value="HOLD_SENSITIVE">Hold - Sensitive</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredCases.length} of {cases.length} cases
      </div>

      {/* Case Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCases.map((caseData) => {
          const statusConfig = getStatusConfig(caseData.status);
          const StatusIcon = statusConfig.icon;

          const displayName = getDisplayName(role, caseData);
          
          return (
            <Card 
              key={caseData.id} 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/cases/${caseData.id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{caseData.id}</h3>
                  <p className="text-sm text-muted-foreground">{caseData.client.rcmsId}</p>
                </div>
                <Badge className={`border ${statusConfig.color}`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Client Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">{displayName}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Created {format(new Date(caseData.createdAt), "MMM d, yyyy")}</span>
                </div>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Incident Type</p>
                  <p className="text-sm font-medium">{caseData.intake.incidentType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Risk Level</p>
                  <p className="text-sm font-medium capitalize">{caseData.riskLevel || "Stable"}</p>
                </div>
              </div>

              {/* Consent Status */}
              {!caseData.consent.signed && (
                <div className="mt-3 flex items-center gap-2 text-xs text-orange-600 bg-orange-500/10 p-2 rounded">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Consent Required</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCases.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No cases found matching your filters.</p>
          <Button variant="outline" className="mt-4" onClick={() => {
            setSearchQuery("");
            setStatusFilter("all");
            setDateFilter("all");
          }}>
            Clear Filters
          </Button>
        </Card>
      )}
    </div>
  );
}
