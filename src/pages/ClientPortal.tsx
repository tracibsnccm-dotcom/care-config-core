import ClientCheckins from "./ClientCheckins";
import { CarePlansViewer } from "@/components/CarePlansViewer";
import { ClientMessaging } from "@/components/ClientMessaging";
import { ReportConcernDialog } from "@/components/ReportConcernDialog";
import { FileComplaintForm } from "@/components/FileComplaintForm";
import { WellnessSnapshot } from "@/components/WellnessSnapshot";
import { ClientDocuments } from "@/components/ClientDocuments";
import { CaseTimeline } from "@/components/CaseTimeline";
import { ResourceLibrary } from "@/components/ResourceLibrary";
import { ClientJournal } from "@/components/ClientJournal";
import { MotivationWidget } from "@/components/MotivationWidget";
import { SupportFooter } from "@/components/SupportFooter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function ClientPortal() {
  // For demo purposes, using a placeholder case ID
  // In production, this would come from the authenticated user's case
  const caseId = "demo-case-id";
  const [concernDialogOpen, setConcernDialogOpen] = useState(false);
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6 bg-background">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
          <span>Client Portal</span>
          <span className="opacity-75">(Role: CLIENT)</span>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold text-foreground">Your Care Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          View your wellness progress, care plans, and communicate with your care team
        </p>
      </header>

      {/* Wellness Snapshot */}
      <WellnessSnapshot 
        caseId={caseId} 
        onViewProgress={() => setActiveTab("checkins")} 
      />

      {/* Motivation Widget */}
      <MotivationWidget caseId={caseId} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="careplans">Care Plans</TabsTrigger>
          <TabsTrigger value="communication">Messages</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Communication Center */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground border-b border-primary/20 pb-2">
                Communication Center
              </h2>
              <div className="grid gap-3">
                <Dialog open={concernDialogOpen} onOpenChange={setConcernDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-auto py-3 justify-start gap-3 border-primary/20">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold text-foreground">Report a Concern</div>
                        <div className="text-xs text-muted-foreground">Share a care concern with your RN</div>
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <ReportConcernDialog 
                      caseId={caseId} 
                      onSuccess={() => setConcernDialogOpen(false)} 
                    />
                  </DialogContent>
                </Dialog>

                <Dialog open={complaintDialogOpen} onOpenChange={setComplaintDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-auto py-3 justify-start gap-3 border-warning/50 hover:bg-warning/5">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      <div className="text-left">
                        <div className="font-semibold text-foreground">File a Complaint</div>
                        <div className="text-xs text-muted-foreground">Anonymous complaint to Compliance</div>
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <FileComplaintForm onSuccess={() => setComplaintDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Case Timeline */}
            <CaseTimeline caseId={caseId} />
          </div>

          {/* Journal */}
          <ClientJournal caseId={caseId} />
        </TabsContent>

        <TabsContent value="checkins" className="space-y-4">
          <ClientCheckins />
        </TabsContent>

        <TabsContent value="careplans" className="space-y-4">
          <CarePlansViewer caseId={caseId} />
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <ClientMessaging caseId={caseId} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <ClientDocuments caseId={caseId} />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <ResourceLibrary />
        </TabsContent>
      </Tabs>

      {/* Support Footer */}
      <SupportFooter />
    </main>
  );
}
