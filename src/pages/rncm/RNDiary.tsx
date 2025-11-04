import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, Plus, BarChart3, Users, X, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/auth/supabaseAuth";
import { ROLES } from "@/config/rcms";
import { useRNDiary, useSupervisorDiary } from "@/hooks/useRNData";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiaryEntryForm } from "@/components/RNClinicalLiaison/DiaryEntryForm";
import { DiaryEntryTemplates } from "@/components/RNClinicalLiaison/DiaryEntryTemplates";
import { DiaryCalendarView } from "@/components/RNClinicalLiaison/DiaryCalendarView";
import { DiaryBulkActions } from "@/components/RNClinicalLiaison/DiaryBulkActions";
import { DiaryCompletionWorkflow } from "@/components/RNClinicalLiaison/DiaryCompletionWorkflow";
import { DiaryAnalytics } from "@/components/RNClinicalLiaison/DiaryAnalytics";
import { SupervisorDiaryCalendar } from "@/components/RNClinicalLiaison/SupervisorDiaryCalendar";
import { RNTeamManagement } from "@/components/RNClinicalLiaison/RNTeamManagement";
import { DiarySearchFilter, DiaryFilters } from "@/components/RNClinicalLiaison/DiarySearchFilter";
import { DiaryPDFExport } from "@/components/RNClinicalLiaison/DiaryPDFExport";
import { DiaryQuickStats } from "@/components/RNClinicalLiaison/DiaryQuickStats";
import { DiaryKeyboardShortcuts, useKeyboardShortcuts } from "@/components/RNClinicalLiaison/DiaryKeyboardShortcuts";
import { DiaryAIAssistant } from "@/components/RNClinicalLiaison/DiaryAIAssistant";
import { DiaryNaturalLanguageSearch } from "@/components/RNClinicalLiaison/DiaryNaturalLanguageSearch";
import { DiaryWorkloadHeatmap } from "@/components/RNClinicalLiaison/DiaryWorkloadHeatmap";
import { DiaryProductivityInsights } from "@/components/RNClinicalLiaison/DiaryProductivityInsights";
import { DiaryTeamManagement } from "@/components/RNClinicalLiaison/DiaryTeamManagement";
import { DiaryTemplates } from "@/components/RNClinicalLiaison/DiaryTemplates";
import { DiaryRecurringEntries } from "@/components/RNClinicalLiaison/DiaryRecurringEntries";
import { DiaryTeamCalendar } from "@/components/RNClinicalLiaison/DiaryBulkOperations";
import { DiaryProductivityDashboard } from "@/components/RNClinicalLiaison/DiaryProductivityDashboard";
import { DiaryHIPAAExport } from "@/components/RNClinicalLiaison/DiaryHIPAAExport";
import { DiaryQuickActions } from "@/components/RNClinicalLiaison/DiaryQuickActions";
import { DiaryNotificationsPanel } from "@/components/RNClinicalLiaison/DiaryNotificationsPanel";
import { DiaryBulkSelection } from "@/components/RNClinicalLiaison/DiaryBulkSelection";
import { DiaryAnalyticsDashboard } from "@/components/RNClinicalLiaison/DiaryAnalyticsDashboard";
import { DiaryAdvancedSearch } from "@/components/RNClinicalLiaison/DiaryAdvancedSearch";
import { DiarySmartSuggestions } from "@/components/RNClinicalLiaison/DiarySmartSuggestions";
import { DiaryTeamHandoff } from "@/components/RNClinicalLiaison/DiaryTeamHandoff";
import { DiaryQualityChecker } from "@/components/RNClinicalLiaison/DiaryQualityChecker";
import { useDiaryNotifications } from "@/hooks/useDiaryNotifications";
import { toast } from "sonner";

export default function RNDiary() {
  const { role } = useApp();
  const { session } = useAuth();
  const isSupervisor = role === ROLES.SUPER_USER || role === ROLES.SUPER_ADMIN;
  const { entries: myEntries, loading: myLoading } = useRNDiary();
  const { entries: allEntries, loading: allLoading } = useSupervisorDiary();
  
  const [formOpen, setFormOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [completionEntry, setCompletionEntry] = useState<any>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [prefillData, setPrefillData] = useState<any>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [filters, setFilters] = useState<DiaryFilters>({
    searchTerm: "",
    entryType: "all",
    priority: "all",
    completionStatus: "all",
    dateFrom: "",
    dateTo: "",
    rnId: ""
  });
  
  const entries = isSupervisor ? allEntries : myEntries;
  const loading = isSupervisor ? allLoading : myLoading;

  // Enable diary notifications
  useDiaryNotifications(session?.user?.id);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewEntry: () => {
      setSelectedEntry(null);
      setPrefillData(null);
      setFormOpen(true);
    },
    onSearch: () => {
      document.getElementById("diary-search")?.focus();
    },
    onClose: () => {
      setFormOpen(false);
      setTemplatesOpen(false);
      setShortcutsOpen(false);
    },
    onDuplicate: () => {
      if (selectedEntry) {
        handleDuplicateEntry(selectedEntry);
      }
    },
    onHelp: () => setShortcutsOpen(true),
  });

  // Filter entries based on search/filter criteria
  const filteredEntries = useMemo(() => {
    return entries.filter((entry: any) => {
      // Search term
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          entry.title?.toLowerCase().includes(searchLower) ||
          entry.description?.toLowerCase().includes(searchLower) ||
          entry.metadata?.contact_name?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Entry type
      if (filters.entryType !== "all" && entry.entry_type !== filters.entryType) {
        return false;
      }

      // Priority
      if (filters.priority !== "all" && entry.metadata?.priority !== filters.priority) {
        return false;
      }

      // Completion status
      if (filters.completionStatus !== "all" && entry.metadata?.completion_status !== filters.completionStatus) {
        return false;
      }

      // Date range
      if (filters.dateFrom && entry.scheduled_date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && entry.scheduled_date > filters.dateTo) {
        return false;
      }

      return true;
    });
  }, [entries, filters]);

  const handleEntryClick = (entry: any) => {
    if (entry.completion_status === "pending" || entry.completion_status === "overdue") {
      setCompletionEntry(entry);
    } else {
      setSelectedEntry(entry);
      setFormOpen(true);
    }
  };

  const handleDateClick = (date: Date) => {
    setPrefillData({ scheduled_date: format(date, "yyyy-MM-dd") });
    setFormOpen(true);
  };

  const handleDuplicateEntry = (entry: any) => {
    const { id, created_at, updated_at, completion_status, completed_at, completed_by, ...duplicateData } = entry;
    setPrefillData({
      ...duplicateData,
      title: `${duplicateData.title} (Copy)`,
      scheduled_date: format(new Date(), "yyyy-MM-dd"),
    });
    setSelectedEntry(null);
    setFormOpen(true);
    toast.success("Entry duplicated - adjust details and save");
  };

  const handleTemplateSelect = (template: any) => {
    setPrefillData(template);
    setTemplatesOpen(false);
    setFormOpen(true);
  };

  const handleSuccess = () => {
    myLoading ? null : null; // Trigger refetch
    allLoading ? null : null;
  };

  const toggleSelection = (id: string) => {
    setSelectedEntries(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-10 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f2a6a] mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading diary...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="py-10 px-6 bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <DiaryQuickStats rnId={!isSupervisor ? session?.user?.id : undefined} />
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mt-4">
              <Calendar className="w-4 h-4" />
              <span>{isSupervisor ? "Team Diary" : "My Diary"}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-[#0f2a6a]">
                  {isSupervisor ? "Team Schedule & Diary" : "My Schedule & Diary"}
                </h1>
                <p className="mt-2 text-[#0f2a6a]/80 max-w-2xl">
                  {isSupervisor 
                    ? "View all appointments, calls, and follow-ups across the team. Reassign tasks as needed."
                    : "View your appointments, calls, and scheduled follow-ups in one place."}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setTemplatesOpen(true)} variant="outline">
                  <Clock className="h-4 w-4 mr-2" />
                  Templates
                </Button>
                <Button onClick={() => { setPrefillData(null); setSelectedEntry(null); setFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Entry
                </Button>
              </div>
            </div>
          </header>

          <Tabs defaultValue="calendar" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="calendar">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="list">
                  <Clock className="h-4 w-4 mr-2" />
                  List
                </TabsTrigger>
                <TabsTrigger value="productivity">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Productivity
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="ai-assistant">
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Assistant
                </TabsTrigger>
                <TabsTrigger value="team-calendar">
                  <Users className="h-4 w-4 mr-2" />
                  Team Calendar
                </TabsTrigger>
                <TabsTrigger value="templates">
                  <Clock className="h-4 w-4 mr-2" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="recurring">
                  <Clock className="h-4 w-4 mr-2" />
                  Recurring
                </TabsTrigger>
                <TabsTrigger value="advanced-analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Advanced Analytics
                </TabsTrigger>
                <TabsTrigger value="team-handoffs">
                  <Users className="h-4 w-4 mr-2" />
                  Team Handoffs
                </TabsTrigger>
                {isSupervisor && (
                  <TabsTrigger value="team">
                    <Users className="h-4 w-4 mr-2" />
                    Team Mgmt
                  </TabsTrigger>
                )}
              </TabsList>

              <DiaryPDFExport 
                entries={filteredEntries as any} 
                dateFrom={filters.dateFrom}
                dateTo={filters.dateTo}
              />
            </div>

            {/* Search & Filter */}
            <div className="space-y-4">
              <DiaryAdvancedSearch onFilterChange={setFilters as any} />
              <DiarySmartSuggestions />
            </div>

            {/* Calendar View */}
            <TabsContent value="calendar" className="space-y-6">
              <DiaryWorkloadHeatmap
                entries={filteredEntries as any}
                startDate={new Date()}
              />
              
              <DiaryBulkActions
                selectedEntries={selectedEntries}
                onActionComplete={handleSuccess}
                onClearSelection={() => setSelectedEntries([])}
              />
              
              {isSupervisor ? (
                <SupervisorDiaryCalendar
                  entries={filteredEntries as any}
                  onDateClick={handleDateClick}
                  onEntryClick={handleEntryClick}
                />
              ) : (
              <DiaryCalendarView
                entries={filteredEntries as any}
                onDateClick={handleDateClick}
                onEntryClick={handleEntryClick}
              />
              )}
            </TabsContent>

            {/* List View */}
            <TabsContent value="list" className="space-y-4">
              <DiaryBulkActions
                selectedEntries={selectedEntries}
                onActionComplete={handleSuccess}
                onClearSelection={() => setSelectedEntries([])}
              />

              {filteredEntries.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      {entries.length === 0 ? "No diary entries found" : "No entries match your filters"}
                    </p>
                    <Button className="mt-4" onClick={() => entries.length === 0 ? setFormOpen(true) : setFilters({
                      searchTerm: "", entryType: "all", priority: "all", 
                      completionStatus: "all", dateFrom: "", dateTo: "", rnId: ""
                    })}>
                      <Plus className="h-4 w-4 mr-2" />
                      {entries.length === 0 ? "Create Your First Entry" : "Clear Filters"}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredEntries.map((entry) => (
                  <Card 
                    key={entry.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleEntryClick(entry)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedEntries.includes(entry.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelection(entry.id);
                          }}
                          className="mt-1"
                        />
                        
                        <div className="text-center min-w-[80px]">
                          <div className="text-sm font-semibold">
                            {format(new Date(entry.scheduled_date), "MMM d")}
                          </div>
                          {entry.scheduled_time && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {entry.scheduled_time.slice(0, 5)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-lg">{entry.title}</h3>
                              {entry.description && (
                                <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                              )}
                              
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                                <Badge variant="outline">
                                  {entry.entry_type.replace("_", " ")}
                                </Badge>
                                
                                {entry.location && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <MapPin className="w-4 h-4" />
                                    {entry.location}
                                  </div>
                                )}
                                
                                {isSupervisor && entry.metadata?.rn_name && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <User className="w-4 h-4" />
                                    {entry.metadata.rn_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Productivity Dashboard */}
            <TabsContent value="productivity" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <DiaryProductivityDashboard />
                </div>
                <DiaryNotificationsPanel />
              </div>
            </TabsContent>

            {/* Analytics View */}
            <TabsContent value="analytics" className="space-y-6">
              <DiaryProductivityInsights
                entries={filteredEntries as any}
                rnId={!isSupervisor ? session?.user?.id : undefined}
              />
              <DiaryAnalytics entries={filteredEntries as any} />
              <DiaryHIPAAExport />
            </TabsContent>

            {/* AI Assistant View */}
            <TabsContent value="ai-assistant" className="space-y-6">
              <DiaryAIAssistant
                entries={filteredEntries as any}
                currentEntry={selectedEntry}
                onSuggestionApply={(suggestion) => {
                  if (suggestion.title) {
                    // Create new entry from AI suggestion
                    setPrefillData({
                      title: suggestion.title,
                      priority: suggestion.suggested_priority || suggestion.priority,
                      entry_type: suggestion.entry_type || "follow_up",
                      scheduled_date: suggestion.suggested_date || format(new Date(), "yyyy-MM-dd"),
                      label: suggestion.suggested_label,
                    });
                    setFormOpen(true);
                  } else if (suggestion.suggested_label) {
                    // Apply AI categorization
                    setSelectedEntry((prev: any) => ({
                      ...prev,
                      label: suggestion.suggested_label,
                      priority: suggestion.suggested_priority,
                      label_color: suggestion.suggested_label === "urgent" ? "red" : 
                                   suggestion.suggested_label === "routine" ? "blue" : "gray"
                    }));
                    toast.success("AI suggestions applied!");
                  }
                }}
              />
            </TabsContent>

            {/* Team Calendar */}
            <TabsContent value="team-calendar" className="space-y-6">
              <DiaryTeamCalendar />
            </TabsContent>

            {/* Templates */}
            <TabsContent value="templates" className="space-y-6">
              <DiaryTemplates onUseTemplate={handleTemplateSelect} />
            </TabsContent>

            {/* Recurring Entries */}
            <TabsContent value="recurring" className="space-y-6">
              <DiaryRecurringEntries />
            </TabsContent>

            {/* Advanced Analytics */}
            <TabsContent value="advanced-analytics" className="space-y-6">
              <DiaryAnalyticsDashboard />
            </TabsContent>

            {/* Team Handoffs */}
            <TabsContent value="team-handoffs" className="space-y-6">
              <DiaryTeamHandoff />
            </TabsContent>

            {/* Team Management (Supervisor Only) */}
            {isSupervisor && (
              <TabsContent value="team" className="space-y-6">
                <DiaryTeamManagement />
                <RNTeamManagement />
              </TabsContent>
            )}
          </Tabs>

          {/* Quick Actions FAB */}
          <DiaryQuickActions />

          {/* Bulk Selection Bar */}
          <DiaryBulkSelection 
            selectedEntries={selectedEntries} 
            onClearSelection={() => setSelectedEntries([])} 
          />
        </div>
      </div>

      {/* Modals */}
      <DiaryEntryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
        entry={selectedEntry}
        prefillData={prefillData}
      />

      <DiaryCompletionWorkflow
        entry={completionEntry}
        open={!!completionEntry}
        onOpenChange={(open) => !open && setCompletionEntry(null)}
        onCompleted={handleSuccess}
      />

      <DiaryKeyboardShortcuts
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      {templatesOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Quick Entry Templates</h2>
                <Button variant="ghost" onClick={() => setTemplatesOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DiaryEntryTemplates onSelectTemplate={handleTemplateSelect} />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
