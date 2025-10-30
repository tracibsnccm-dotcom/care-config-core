import ClientCheckins from "./ClientCheckins";
import { CarePlansViewer } from "@/components/CarePlansViewer";
import { ClientMessaging } from "@/components/ClientMessaging";
import { ReportConcernDialog } from "@/components/ReportConcernDialog";
import { FileComplaintForm } from "@/components/FileComplaintForm";
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
  
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-sm font-semibold">
          <span>Client Portal</span>
          <span className="opacity-75">(Role: CLIENT)</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-primary">Your Care Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          View your care plans, submit updates, and communicate with your care team
        </p>
      </header>

      {/* Communication Options */}
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <Dialog open={concernDialogOpen} onOpenChange={setConcernDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <div className="text-center">
                <div className="font-semibold">Report a Concern</div>
                <div className="text-xs text-muted-foreground">Share a concern about your care or experience</div>
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
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-warning/50 hover:bg-warning/5">
              <AlertTriangle className="h-6 w-6 text-warning" />
              <div className="text-center">
                <div className="font-semibold">File a Complaint (Anonymous)</div>
                <div className="text-xs text-muted-foreground">Submit a confidential complaint to Administration</div>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <FileComplaintForm onSuccess={() => setComplaintDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="checkins" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checkins">Check-ins & Updates</TabsTrigger>
          <TabsTrigger value="careplans">Care Plans</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="checkins" className="space-y-4">
          <ClientCheckins />
        </TabsContent>

        <TabsContent value="careplans" className="space-y-4">
          <CarePlansViewer caseId={caseId} />
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <ClientMessaging caseId={caseId} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
