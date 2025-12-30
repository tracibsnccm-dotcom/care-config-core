import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DiarySearchFilterProps {
  onFilterChange: (filters: DiaryFilters) => void;
  showRNFilter?: boolean;
}

export interface DiaryFilters {
  searchTerm: string;
  entryType: string;
  priority: string;
  completionStatus: string;
  dateFrom: string;
  dateTo: string;
  rnId?: string;
}

export function DiarySearchFilter({ onFilterChange, showRNFilter = false }: DiarySearchFilterProps) {
  const [filters, setFilters] = useState<DiaryFilters>({
    searchTerm: "",
    entryType: "all",
    priority: "all",
    completionStatus: "all",
    dateFrom: "",
    dateTo: "",
    rnId: ""
  });

  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof DiaryFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: DiaryFilters = {
      searchTerm: "",
      entryType: "all",
      priority: "all",
      completionStatus: "all",
      dateFrom: "",
      dateTo: "",
      rnId: ""
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "searchTerm") return value.length > 0;
    return value !== "all" && value !== "";
  }).length;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, description, or contact name..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">Entry Type</label>
                <Select value={filters.entryType} onValueChange={(v) => handleFilterChange("entryType", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="client_appointment">Client Appointment</SelectItem>
                    <SelectItem value="provider_appointment">Provider Appointment</SelectItem>
                    <SelectItem value="phone_call">Phone Call</SelectItem>
                    <SelectItem value="text_message">Text Message</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="client_followup">Client Follow-up</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select value={filters.priority} onValueChange={(v) => handleFilterChange("priority", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filters.completionStatus} onValueChange={(v) => handleFilterChange("completionStatus", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
