import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttorneyProfileSettings } from "@/components/AttorneyProfileSettings";
import { AttorneyAssignmentHistory } from "@/components/AttorneyAssignmentHistory";
import { AttorneyCasePerformance } from "@/components/AttorneyCasePerformance";
import { AttorneyAvailabilitySettings } from "@/components/AttorneyAvailabilitySettings";
import { AttorneyPracticeAreas } from "@/components/AttorneyPracticeAreas";
import { AttorneySecuritySettings } from "@/components/AttorneySecuritySettings";
import { User, History, BarChart3, Calendar, Scale, Shield } from "lucide-react";

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
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
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
              <span className="hidden sm:inline">Practice Areas</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
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

          <TabsContent value="security">
            <AttorneySecuritySettings />
          </TabsContent>

          <TabsContent value="performance">
            <AttorneyCasePerformance />
          </TabsContent>

          <TabsContent value="history">
            <AttorneyAssignmentHistory />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
