import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaseDashboardView } from "@/components/attorney/CaseDashboard/CaseDashboardView";
import { AssignmentsView } from "@/components/attorney/Assignments/AssignmentsView";
import { ConsentManagementView } from "@/components/attorney/Consent/ConsentManagementView";
import { SchedulingView } from "@/components/attorney/Scheduling/SchedulingView";
import { ClinicalDataPlaceholder } from "@/components/attorney/ClinicalData/ClinicalDataPlaceholder";
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileCheck, 
  Calendar, 
  Stethoscope 
} from "lucide-react";

export default function AttorneyPortalPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Attorney Portal</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive case management and clinical coordination
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-2 bg-muted/50 p-2 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Case Dashboard
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="consent" className="flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              Consent Management
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Scheduling
            </TabsTrigger>
            <TabsTrigger value="clinical" className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              Clinical Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <CaseDashboardView />
          </TabsContent>

          <TabsContent value="assignments" className="mt-0">
            <AssignmentsView />
          </TabsContent>

          <TabsContent value="consent" className="mt-0">
            <ConsentManagementView />
          </TabsContent>

          <TabsContent value="scheduling" className="mt-0">
            <SchedulingView />
          </TabsContent>

          <TabsContent value="clinical" className="mt-0">
            <ClinicalDataPlaceholder />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
