import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaffDocumentsView } from "@/components/staff/Documents/StaffDocumentsView";
import { StaffCaseCoordinationView } from "@/components/staff/CaseCoordination/StaffCaseCoordinationView";
import { StaffAdminToolsView } from "@/components/staff/AdminTools/StaffAdminToolsView";
import { StaffDashboardView } from "@/components/staff/Dashboard/StaffDashboardView";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings 
} from "lucide-react";
import { useAuth } from "@/auth/supabaseAuth";

export default function StaffPortalPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user } = useAuth();
  
  const isRcmsStaff = user?.roles?.includes("RCMS_STAFF");
  const isAttorneyStaff = user?.roles?.includes("STAFF");

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Staff Portal</h1>
          <p className="text-muted-foreground mt-1">
            {isRcmsStaff && "RCMS Staff Operations & Coordination"}
            {isAttorneyStaff && !isRcmsStaff && "Attorney Firm Staff Operations"}
            {!isRcmsStaff && !isAttorneyStaff && "Staff Operations Dashboard"}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-2 bg-muted/50 p-2 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Document Management
            </TabsTrigger>
            <TabsTrigger value="coordination" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Case Coordination
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Administrative Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <StaffDashboardView />
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <StaffDocumentsView />
          </TabsContent>

          <TabsContent value="coordination" className="mt-0">
            <StaffCaseCoordinationView />
          </TabsContent>

          <TabsContent value="admin" className="mt-0">
            <StaffAdminToolsView />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
