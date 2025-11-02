import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttorneyProfileSettings } from "@/components/AttorneyProfileSettings";
import { AttorneyAssignmentHistory } from "@/components/AttorneyAssignmentHistory";
import { AttorneyCasePerformance } from "@/components/AttorneyCasePerformance";
import { AttorneyAvailabilitySettings } from "@/components/AttorneyAvailabilitySettings";
import { AttorneyPracticeAreas } from "@/components/AttorneyPracticeAreas";
import { AttorneySecuritySettings } from "@/components/AttorneySecuritySettings";
import { AttorneyDataExport } from "@/components/AttorneyDataExport";
import { AttorneySessionManagement } from "@/components/AttorneySessionManagement";
import { AttorneyCommunicationPreferences } from "@/components/AttorneyCommunicationPreferences";
import { AttorneyActivityLog } from "@/components/AttorneyActivityLog";
import { User, History, BarChart3, Calendar, Scale, Shield, Download, Monitor, MessageSquare, Activity } from "lucide-react";

export default function AttorneySettings() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#0f2a6a]">Attorney Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your profile, view performance, and track assignment history
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 xl:grid-cols-10 gap-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Availability</span>
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span className="hidden sm:inline">Practice</span>
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Communication</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <AttorneyProfileSettings />
          </TabsContent>

          <TabsContent value="availability">
            <AttorneyAvailabilitySettings />
          </TabsContent>

          <TabsContent value="practice">
            <AttorneyPracticeAreas />
          </TabsContent>

          <TabsContent value="communication">
            <AttorneyCommunicationPreferences />
          </TabsContent>

          <TabsContent value="security">
            <AttorneySecuritySettings />
          </TabsContent>

          <TabsContent value="sessions">
            <AttorneySessionManagement />
          </TabsContent>

          <TabsContent value="performance">
            <AttorneyCasePerformance />
          </TabsContent>

          <TabsContent value="history">
            <AttorneyAssignmentHistory />
          </TabsContent>

          <TabsContent value="activity">
            <AttorneyActivityLog />
          </TabsContent>

          <TabsContent value="export">
            <AttorneyDataExport />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
