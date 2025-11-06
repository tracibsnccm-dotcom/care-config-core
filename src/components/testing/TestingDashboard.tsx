import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeControlPanel } from "./TimeControlPanel";
import { ScenarioManager } from "./ScenarioManager";
import { TestEventLog } from "./TestEventLog";
import { TestUserManager } from "./TestUserManager";
import { SystemStatusMonitor } from "./SystemStatusMonitor";

export function TestingDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Testing Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive testing system with simulated time and scenario management
        </p>
      </div>

      <Tabs defaultValue="time-control" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="time-control">Time Control</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="events">Event Log</TabsTrigger>
          <TabsTrigger value="users">Test Users</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
        </TabsList>

        <TabsContent value="time-control" className="space-y-4">
          <TimeControlPanel />
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <ScenarioManager />
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <TestEventLog />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <TestUserManager />
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <SystemStatusMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
