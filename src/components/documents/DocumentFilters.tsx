import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search, Upload } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DocumentFiltersProps {
  selectedCase: string;
  selectedType: string;
  selectedStatus: string;
  searchQuery: string;
  dateRange: { from?: Date; to?: Date };
  cases: Array<{ id: string }>;
  onCaseChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void;
  onUploadClick: () => void;
}

export function DocumentFilters({
  selectedCase,
  selectedType,
  selectedStatus,
  searchQuery,
  dateRange,
  cases,
  onCaseChange,
  onTypeChange,
  onStatusChange,
  onSearchChange,
  onDateRangeChange,
  onUploadClick,
}: DocumentFiltersProps) {
  return (
    <Card className="p-6 border-border">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">Filter & Search</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Select Case
          </label>
          <Select value={selectedCase} onValueChange={onCaseChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All Cases" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">All Cases</SelectItem>
              {cases.slice(0, 10).map((caseItem) => (
                <SelectItem key={caseItem.id} value={caseItem.id}>
                  {caseItem.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Document Type
          </label>
          <Select value={selectedType} onValueChange={onTypeChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Clinical Report">Clinical Report</SelectItem>
              <SelectItem value="Legal Filing">Legal Filing</SelectItem>
              <SelectItem value="Client Form">Client Form</SelectItem>
              <SelectItem value="Provider Note">Provider Note</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Status
          </label>
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Date Range
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-background",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM dd, yyyy")
                  )
                ) : (
                  "Pick a date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => onDateRangeChange(range || {})}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => {
            onCaseChange("all");
            onTypeChange("all");
            onStatusChange("all");
            onSearchChange("");
            onDateRangeChange({});
          }}
        >
          Clear Filters
        </Button>
        <Button 
          className="bg-[#b09837] text-black hover:bg-black hover:text-[#b09837] transition-colors font-medium"
          onClick={onUploadClick}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload New Document
        </Button>
      </div>
    </Card>
  );
}
