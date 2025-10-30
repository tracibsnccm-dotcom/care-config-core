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
import { Card } from "@/components/ui/card";
import { MessageSquare, AlertTriangle, ClipboardCheck, FileText, Clock, BookOpen } from "lucide-react";
import { useState } from "react";

export default function ClientPortal() {
  const caseId = "demo-case-id";
  const [concernDialogOpen, setConcernDialogOpen] = useState(false);
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("checkins");
  
  return (
    <div className="min-h-screen bg-rcms-white">
      {/* SECTION 1 - HEADER BAR */}
      <header className="bg-rcms-navy border-b-4 border-rcms-gold shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2 tracking-tight">
                <span className="text-white">Reconcile </span>
                <span className="text-rcms-orange">C.A.R.E.</span>
                <span className="text-white"> Client Portal</span>
              </h1>
              <p className="text-rcms-mint text-lg">
                Your care, communication, and progress in one place
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:self-end md:mb-1">
              <Button 
                onClick={() => setActiveTab("checkins")}
                className="bg-rcms-gold text-black hover:bg-black hover:text-rcms-gold transition-all duration-300 font-medium"
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Check-Ins
              </Button>
              <Button 
                onClick={() => setActiveTab("communication")}
                className="bg-rcms-gold text-black hover:bg-black hover:text-rcms-gold transition-all duration-300 font-medium"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Messages
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* SECTION 2 - SNAPSHOT + ACTIONS (navy→teal gradient) */}
      <section className="bg-gradient-navy-teal py-12">
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          {/* Wellness Snapshot */}
          <WellnessSnapshot 
            caseId={caseId} 
            onViewProgress={() => setActiveTab("checkins")} 
          />

          {/* Quick Actions Row */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Motivation Widget */}
            <div className="md:col-span-2">
              <MotivationWidget caseId={caseId} />
            </div>

            {/* Quick Contact Card */}
            <Card className="p-6 bg-white border-rcms-gold shadow-lg">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-rcms-gold" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Dialog open={concernDialogOpen} onOpenChange={setConcernDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="w-full bg-rcms-gold text-rcms-black hover:bg-rcms-black hover:text-rcms-gold transition-all duration-300"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Report Concern
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
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full border-rcms-coral text-rcms-coral hover:bg-rcms-coral/10 transition-all duration-300"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      File Complaint
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <FileComplaintForm onSuccess={() => setComplaintDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 3 - DATA & CHECK-INS (mint background) */}
      <section className="bg-rcms-mint py-12">
        <div className="max-w-7xl mx-auto px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-white border-2 border-rcms-gold shadow-lg">
              <TabsTrigger 
                value="checkins"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300"
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Check-Ins</span>
              </TabsTrigger>
              <TabsTrigger 
                value="careplans"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Care Plans</span>
              </TabsTrigger>
              <TabsTrigger 
                value="communication"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Messages</span>
              </TabsTrigger>
              <TabsTrigger 
                value="documents"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
              <TabsTrigger 
                value="timeline"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300"
              >
                <Clock className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Timeline</span>
              </TabsTrigger>
              <TabsTrigger 
                value="resources"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Resources</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Content with white cards */}
            <div className="bg-white rounded-xl border-2 border-rcms-gold shadow-xl p-6">
              <TabsContent value="checkins" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                      <ClipboardCheck className="w-6 h-6 text-rcms-teal" />
                      Check-Ins & Updates
                    </h2>
                  </div>
                  <ClientCheckins />
                  <div className="mt-6 pt-6 border-t-2 border-rcms-gold">
                    <ClientJournal caseId={caseId} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="careplans" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <FileText className="w-6 h-6 text-rcms-teal" />
                    Care Plans
                  </h2>
                </div>
                <CarePlansViewer caseId={caseId} />
              </TabsContent>

              <TabsContent value="communication" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-rcms-teal" />
                    Messages / Communication Center
                  </h2>
                </div>
                <ClientMessaging caseId={caseId} />
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <FileText className="w-6 h-6 text-rcms-teal" />
                    Documents & Files
                  </h2>
                </div>
                <ClientDocuments caseId={caseId} />
              </TabsContent>

              <TabsContent value="timeline" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-6 h-6 text-rcms-teal" />
                    Case Summary / Activity Timeline
                  </h2>
                </div>
                <CaseTimeline caseId={caseId} />
              </TabsContent>

              <TabsContent value="resources" className="mt-0">
                <ResourceLibrary />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </section>

      {/* SECTION 4 - SUPPORT FOOTER (pale gold background) */}
      <section className="bg-rcms-pale-gold py-8">
        <div className="max-w-7xl mx-auto px-6">
          <SupportFooter />
        </div>
      </section>

      {/* SECTION 5 - FOOTER (deep navy) */}
      <footer className="bg-rcms-navy py-6 border-t-4 border-rcms-gold">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white text-sm">
            © 2025 Reconcile C.A.R.E. | Confidential & HIPAA Protected
          </p>
        </div>
      </footer>
    </div>
  );
}
