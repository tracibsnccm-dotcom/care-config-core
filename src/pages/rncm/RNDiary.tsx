import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ROLES } from "@/config/rcms";
import { useRNDiary, useSupervisorDiary } from "@/hooks/useRNData";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RNDiary() {
  const { role } = useApp();
  const isSupervisor = role === ROLES.SUPER_USER || role === ROLES.SUPER_ADMIN;
  const { entries: myEntries, loading: myLoading } = useRNDiary();
  const { entries: allEntries, loading: allLoading } = useSupervisorDiary();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const entries = isSupervisor ? allEntries : myEntries;
  const loading = isSupervisor ? allLoading : myLoading;

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Start on Monday
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEntriesForDay = (date: Date) => {
    return entries.filter((entry) => 
      isSameDay(new Date(entry.scheduled_date), date)
    );
  };

  const getEntryTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      client_appointment: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      provider_call: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      attorney_meeting: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      client_followup: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      assessment: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };
    return colors[type] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
              <Calendar className="w-4 h-4" />
              <span>{isSupervisor ? "Team Diary" : "My Diary"}</span>
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-[#0f2a6a]">
              {isSupervisor ? "Team Schedule & Diary" : "My Schedule & Diary"}
            </h1>
            <p className="mt-2 text-[#0f2a6a]/80 max-w-2xl">
              {isSupervisor 
                ? "View all appointments, calls, and follow-ups across the team. Reassign tasks as needed."
                : "View your appointments, calls, and scheduled follow-ups in one place."}
            </p>
          </header>

          <Tabs defaultValue="week" className="space-y-6">
            <TabsList>
              <TabsTrigger value="week">Week View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>

            <TabsContent value="week" className="space-y-6">
              {/* Week Navigation */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 7)))}
                    >
                      ← Previous Week
                    </Button>
                    <div className="text-center">
                      <div className="font-semibold text-lg">
                        {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                      </div>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 7)))}
                    >
                      Next Week →
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Weekly Calendar Grid */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {weekDays.map((day) => {
                  const dayEntries = getEntriesForDay(day);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <Card key={day.toISOString()} className={isToday ? "border-[#0f2a6a] border-2" : ""}>
                      <CardHeader className="pb-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-muted-foreground">
                            {format(day, "EEE")}
                          </div>
                          <div className={`text-2xl font-bold ${isToday ? "text-[#0f2a6a]" : ""}`}>
                            {format(day, "d")}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {dayEntries.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center">No entries</p>
                        ) : (
                          <div className="space-y-2">
                            {dayEntries.map((entry) => (
                              <div 
                                key={entry.id}
                                className={`p-2 rounded text-xs ${getEntryTypeColor(entry.entry_type)}`}
                              >
                                <div className="font-medium flex items-center gap-1">
                                  {entry.scheduled_time && (
                                    <Clock className="w-3 h-3" />
                                  )}
                                  {entry.scheduled_time ? entry.scheduled_time.slice(0, 5) : "All day"}
                                </div>
                                <div className="mt-1 line-clamp-2">{entry.title}</div>
                                {isSupervisor && entry.metadata?.rn_name && (
                                  <div className="mt-1 flex items-center gap-1 text-xs opacity-75">
                                    <User className="w-3 h-3" />
                                    {entry.metadata.rn_name}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              {entries.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No diary entries found</p>
                  </CardContent>
                </Card>
              ) : (
                entries.map((entry) => (
                  <Card key={entry.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
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
                              
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <Badge className={getEntryTypeColor(entry.entry_type)}>
                                  {entry.entry_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                </Badge>
                                
                                {entry.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {entry.location}
                                  </div>
                                )}
                                
                                {isSupervisor && entry.metadata?.rn_name && (
                                  <div className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {entry.metadata.rn_name}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <Badge variant={entry.status === "scheduled" ? "secondary" : "default"}>
                              {entry.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
