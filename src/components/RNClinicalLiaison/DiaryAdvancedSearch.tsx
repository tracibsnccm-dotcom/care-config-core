import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Filter, Save, Star, X, Tag, Plus } from "lucide-react";
import { toast } from "sonner";

interface FilterConfig {
  searchText?: string;
  entryType?: string;
  priority?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  caseId?: string;
}

export function DiaryAdvancedSearch({ onFilterChange }: { onFilterChange: (filters: FilterConfig) => void }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterConfig>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState("");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch saved filters
  const { data: savedFilters } = useQuery({
    queryKey: ["saved-filters", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("rn_saved_filters")
        .select("*")
        .eq("rn_id", user.id)
        .order("is_favorite", { ascending: false })
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!user?.id,
  });

  // Fetch available tags
  const { data: tags } = useQuery({
    queryKey: ["diary-tags"],
    queryFn: async () => {
      const { data } = await supabase
        .from("rn_diary_tags")
        .select("*")
        .order("tag_name");
      return data || [];
    },
  });

  // Save filter mutation
  const saveFilterMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("rn_saved_filters")
        .insert({
          rn_id: user.id,
          filter_name: name,
          filter_config: filters as any
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-filters"] });
      toast.success("Filter saved successfully");
      setIsSaveDialogOpen(false);
      setFilterName("");
    },
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from("rn_saved_filters")
        .update({ is_favorite: !isFavorite })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-filters"] });
    },
  });

  const handleApplyFilters = () => {
    onFilterChange(filters);
    setIsFilterOpen(false);
  };

  const handleLoadFilter = (config: FilterConfig) => {
    setFilters(config);
    onFilterChange(config);
  };

  const handleClearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const activeFilterCount = Object.values(filters).filter(v => 
    v !== undefined && v !== "" && (!Array.isArray(v) || v.length > 0)
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            value={filters.searchText || ""}
            onChange={(e) => {
              const newFilters = { ...filters, searchText: e.target.value };
              setFilters(newFilters);
              onFilterChange(newFilters);
            }}
            className="pl-10"
          />
        </div>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Advanced Filters</h3>
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear All
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Entry Type</Label>
                  <Select value={filters.entryType || ""} onValueChange={(v) => setFilters({ ...filters, entryType: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="client_followup">Client Follow-up</SelectItem>
                      <SelectItem value="phone_call">Phone Call</SelectItem>
                      <SelectItem value="client_appointment">Client Appointment</SelectItem>
                      <SelectItem value="team_meeting">Team Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Priority</Label>
                  <Select value={filters.priority || ""} onValueChange={(v) => setFilters({ ...filters, priority: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={filters.status || ""} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Date From</Label>
                    <Input
                      type="date"
                      value={filters.dateFrom || ""}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Date To</Label>
                    <Input
                      type="date"
                      value={filters.dateTo || ""}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    />
                  </div>
                </div>

                {tags && tags.length > 0 && (
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag: any) => (
                        <Badge
                          key={tag.id}
                          variant={filters.tags?.includes(tag.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          style={filters.tags?.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                          onClick={() => {
                            const currentTags = filters.tags || [];
                            const newTags = currentTags.includes(tag.id)
                              ? currentTags.filter(t => t !== tag.id)
                              : [...currentTags, tag.id];
                            setFilters({ ...filters, tags: newTags });
                          }}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag.tag_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Save Filter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Filter</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Filter Name</Label>
                        <Input
                          value={filterName}
                          onChange={(e) => setFilterName(e.target.value)}
                          placeholder="e.g., High Priority This Week"
                        />
                      </div>
                      <Button
                        onClick={() => saveFilterMutation.mutate(filterName)}
                        disabled={!filterName}
                        className="w-full"
                      >
                        Save
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button onClick={handleApplyFilters} className="flex-1">
                  Apply Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Saved Filters */}
      {savedFilters && savedFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {savedFilters.map((filter: any) => (
            <Badge
              key={filter.id}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 pr-1"
              onClick={() => handleLoadFilter(filter.filter_config)}
            >
              {filter.is_favorite && <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />}
              {filter.filter_name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavoriteMutation.mutate({ id: filter.id, isFavorite: filter.is_favorite });
                }}
              >
                <Star className={`h-3 w-3 ${filter.is_favorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
