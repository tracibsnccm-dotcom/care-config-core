import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Square, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function RNTimeTracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [currentTimer, setCurrentTimer] = useState(0);

  // Mock data - replace with real data from hooks
  const todayEntries = [
    {
      id: "1",
      caseId: "RCMS-2024-001",
      clientName: "Sarah M.",
      activity: "Care Plan Review",
      duration: 45,
      notes: "Reviewed and updated care plan with patient goals"
    },
    {
      id: "2",
      caseId: "RCMS-2024-002",
      clientName: "John D.",
      activity: "Phone Call - Follow Up",
      duration: 20,
      notes: "Checked in on medication adherence"
    },
  ];

  const weekSummary = {
    totalHours: 32.5,
    target: 40,
    billableHours: 28,
    nonBillableHours: 4.5
  };

  const toggleTimer = () => {
    setIsTracking(!isTracking);
  };

  return (
    <AppLayout>
      <div className="py-6 px-6 bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm font-semibold mb-3">
              <span>Time Tracking</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f2a6a]">
              Daily Time Entry
            </h1>
            <p className="text-[#0f2a6a]/80 mt-2">
              Track time spent on cases and activities
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Timer & Quick Entry */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Timer Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Activity Timer</CardTitle>
                  <CardDescription>Start tracking time for a case</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <div className="text-6xl font-bold text-[#0f2a6a] mb-4">
                      {Math.floor(currentTimer / 60)}:{(currentTimer % 60).toString().padStart(2, '0')}
                    </div>
                    <Button
                      size="lg"
                      onClick={toggleTimer}
                      className={isTracking ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                    >
                      {isTracking ? (
                        <>
                          <Square className="mr-2 h-5 w-5" />
                          Stop Timer
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-5 w-5" />
                          Start Timer
                        </>
                      )}
                    </Button>
                  </div>

                  {isTracking && (
                    <div className="space-y-4 border-t pt-4">
                      <div>
                        <Label htmlFor="active-case">Case</Label>
                        <Select>
                          <SelectTrigger id="active-case">
                            <SelectValue placeholder="Select a case" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Sarah M. - RCMS-2024-001</SelectItem>
                            <SelectItem value="2">John D. - RCMS-2024-002</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="active-activity">Activity Type</Label>
                        <Select>
                          <SelectTrigger id="active-activity">
                            <SelectValue placeholder="Select activity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="care_plan">Care Plan Review</SelectItem>
                            <SelectItem value="phone">Phone Call</SelectItem>
                            <SelectItem value="documentation">Documentation</SelectItem>
                            <SelectItem value="coordination">Care Coordination</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Manual Time Entry */}
              <Card>
                <CardHeader>
                  <CardTitle>Manual Time Entry</CardTitle>
                  <CardDescription>Log time for completed activities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="manual-case">Case</Label>
                    <Select>
                      <SelectTrigger id="manual-case">
                        <SelectValue placeholder="Select a case" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Sarah M. - RCMS-2024-001</SelectItem>
                        <SelectItem value="2">John D. - RCMS-2024-002</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="manual-activity">Activity Type</Label>
                    <Select>
                      <SelectTrigger id="manual-activity">
                        <SelectValue placeholder="Select activity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="care_plan">Care Plan Review</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="documentation">Documentation</SelectItem>
                        <SelectItem value="coordination">Care Coordination</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hours">Hours</Label>
                      <Input id="hours" type="number" min="0" max="23" placeholder="0" />
                    </div>
                    <div>
                      <Label htmlFor="minutes">Minutes</Label>
                      <Input id="minutes" type="number" min="0" max="59" placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" placeholder="Add notes about this activity..." />
                  </div>
                  <Button className="w-full">Save Time Entry</Button>
                </CardContent>
              </Card>

              {/* Today's Entries */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Time Entries</CardTitle>
                  <CardDescription>{format(new Date(), "EEEE, MMMM d, yyyy")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todayEntries.map(entry => (
                      <div key={entry.id} className="border rounded-lg p-4 hover:bg-muted/50 transition">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{entry.clientName}</h4>
                            <p className="text-sm text-muted-foreground">{entry.caseId}</p>
                          </div>
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            {entry.duration} min
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mb-1">{entry.activity}</p>
                        <p className="text-sm text-muted-foreground">{entry.notes}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Today:</span>
                      <span className="text-2xl font-bold text-[#0f2a6a]">
                        {(todayEntries.reduce((acc, e) => acc + e.duration, 0) / 60).toFixed(1)} hours
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              {/* Week Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    This Week
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Total Hours</span>
                      <span className="text-2xl font-bold">{weekSummary.totalHours}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-[#128f8b] h-2 rounded-full transition-all"
                        style={{ width: `${(weekSummary.totalHours / weekSummary.target) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: {weekSummary.target} hours/week
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm">Billable Hours</span>
                      <span className="font-semibold text-green-600">{weekSummary.billableHours}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Non-Billable Hours</span>
                      <span className="font-semibold text-muted-foreground">{weekSummary.nonBillableHours}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg. Hours/Day</span>
                    <Badge variant="secondary">6.5</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cases This Week</span>
                    <Badge variant="secondary">12</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg. Time/Case</span>
                    <Badge variant="secondary">2.7h</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
