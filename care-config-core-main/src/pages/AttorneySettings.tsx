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
import { AttorneyContactInfo } from "@/components/AttorneyContactInfo";
import { AttorneyCalendarIntegration } from "@/components/AttorneyCalendarIntegration";
import { AttorneyLanguagePreferences } from "@/components/AttorneyLanguagePreferences";
import { AttorneyNotificationTiming } from "@/components/AttorneyNotificationTiming";
import { AttorneyReferralPreferences } from "@/components/AttorneyReferralPreferences";
import { User, History, BarChart3, Calendar, Scale, Shield, Download, Monitor, MessageSquare, Activity, Phone, CalendarClock, Languages, Bell, Users } from "lucide-react";

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
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-auto min-w-full">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>Contact</span>
              </TabsTrigger>
              <TabsTrigger value="availability" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Availability</span>
              </TabsTrigger>
              <TabsTrigger value="practice" className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                <span>Practice</span>
              </TabsTrigger>
              <TabsTrigger value="referrals" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Referrals</span>
              </TabsTrigger>
              <TabsTrigger value="communication" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Communication</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4" />
                <span>Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="language" className="flex items-center gap-2">
                <Languages className="w-4 h-4" />
                <span>Language</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <span>Sessions</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Performance</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                <span>History</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>Activity</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile">
            <AttorneyProfileSettings />
          </TabsContent>

          <TabsContent value="contact">
            <AttorneyContactInfo />
          </TabsContent>

          <TabsContent value="availability">
            <AttorneyAvailabilitySettings />
          </TabsContent>

          <TabsContent value="practice">
            <AttorneyPracticeAreas />
          </TabsContent>

          <TabsContent value="referrals">
            <AttorneyReferralPreferences />
          </TabsContent>

          <TabsContent value="communication">
            <AttorneyCommunicationPreferences />
          </TabsContent>

          <TabsContent value="notifications">
            <AttorneyNotificationTiming />
          </TabsContent>

          <TabsContent value="calendar">
            <AttorneyCalendarIntegration />
          </TabsContent>

          <TabsContent value="language">
            <AttorneyLanguagePreferences />
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
