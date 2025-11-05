import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, AlertCircle } from "lucide-react";

export function SchedulingCalendar() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Scheduling & Calendar</h2>
          <p className="text-muted-foreground">Team schedules and coverage planning</p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Create Schedule
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Duty Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On PTO</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Call</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage Gaps</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">0</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Schedule</CardTitle>
            <CardDescription>Staff on duty and assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Sarah Johnson, RN", shift: "7am - 3pm", status: "on_duty" },
                { name: "Michael Chen, RN", shift: "7am - 3pm", status: "on_duty" },
                { name: "Emily Rodriguez, RN", shift: "3pm - 11pm", status: "scheduled" },
                { name: "David Kim, RN", shift: "11pm - 7am", status: "on_call" }
              ].map((staff, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="font-medium">{staff.name}</div>
                    <div className="text-sm text-muted-foreground">{staff.shift}</div>
                  </div>
                  <Badge variant="outline" className={
                    staff.status === "on_duty" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                    staff.status === "on_call" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                    "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  }>
                    {staff.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming PTO</CardTitle>
            <CardDescription>Planned time off next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Lisa Martinez, RN", dates: "Jan 15-17", days: 3 },
                { name: "Sarah Johnson, RN", dates: "Feb 14-18", days: 5 },
                { name: "David Kim, RN", dates: "Feb 20-24", days: 5 }
              ].map((pto, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="font-medium">{pto.name}</div>
                    <div className="text-sm text-muted-foreground">{pto.dates}</div>
                  </div>
                  <Badge variant="outline">
                    {pto.days} days
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
