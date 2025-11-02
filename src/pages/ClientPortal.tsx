import ClientCheckins from "./ClientCheckins";
import { CarePlansViewer } from "@/components/CarePlansViewer";
import { ClientMessaging } from "@/components/ClientMessaging";
import { ReportConcernDialog } from "@/components/ReportConcernDialog";
import { FileComplaintForm } from "@/components/FileComplaintForm";
import { VoiceConcernsForm } from "@/components/VoiceConcernsForm";
import { WellnessSnapshot } from "@/components/WellnessSnapshot";
import { HealthSummaryChips } from "@/components/HealthSummaryChips";
import { ClientGoalTracker } from "@/components/ClientGoalTracker";
import { ClientMedicationTracker } from "@/components/ClientMedicationTracker";
import { ClientActionItems } from "@/components/ClientActionItems";
import { CareTeamContactBar } from "@/components/CareTeamContactBar";
import { CrisisResourcesBanner } from "@/components/CrisisResourcesBanner";
import { ClientAppointmentCalendar } from "@/components/ClientAppointmentCalendar";
import { ClientQuickMessage } from "@/components/ClientQuickMessage";
import { ProgressHighlights } from "@/components/ProgressHighlights";
import { ClientDocuments } from "@/components/ClientDocuments";
import { CaseTimeline } from "@/components/CaseTimeline";
import { ResourceLibrary } from "@/components/ResourceLibrary";
import { ClientJournal } from "@/components/ClientJournal";
import { MotivationWidget } from "@/components/MotivationWidget";
import { SupportFooter } from "@/components/SupportFooter";

import { AttorneyNudgeBanner } from "@/components/AttorneyNudgeBanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Megaphone, MessageSquare, AlertTriangle, ClipboardCheck, FileText, Clock, BookOpen, Stethoscope, Briefcase, Users, BookText, UserRound } from "lucide-react";
import { useState, useEffect } from "react";
import { useCases } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";

export default function ClientPortal() {
  const { cases: userCases, loading: casesLoading } = useCases();
  const caseId = userCases?.[0]?.id as string | undefined;
  const [concernDialogOpen, setConcernDialogOpen] = useState(false);
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);
  const [voiceConcernsOpen, setVoiceConcernsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("checkins");
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);

  // Check for crisis indicators
  useEffect(() => {
    if (!caseId) return;
    
    async function checkCrisisIndicators() {
      try {
        const user = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from("client_checkins")
          .select("pain_scale, depression_scale, anxiety_scale")
          .eq("client_id", user.data.user?.id)
          .eq("case_id", caseId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const latest = data[0];
          const hasCrisis = latest.pain_scale >= 8 || 
                           (latest.depression_scale && latest.depression_scale >= 8) || 
                           (latest.anxiety_scale && latest.anxiety_scale >= 8);
          setShowCrisisAlert(hasCrisis);
        }
      } catch (err) {
        console.error("Error checking crisis indicators:", err);
      }
    }

    checkCrisisIndicators();
  }, [caseId]);
  
  return (
    <div className="min-h-screen bg-rcms-white">
      {/* SECTION 1 - HEADER BAR */}
      <header className="bg-rcms-navy border-b-4 border-rcms-gold shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
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
            <div className="flex flex-col gap-3 md:self-end md:mb-1">
              {/* Primary Contact Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("communication")}
                  className="bg-rcms-gold text-black hover:bg-black hover:text-rcms-gold transition-all duration-300 border-rcms-gold"
                >
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Contact RN
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("communication")}
                  className="bg-rcms-gold text-black hover:bg-black hover:text-rcms-gold transition-all duration-300 border-rcms-gold"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Message Atty
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-rcms-gold text-black hover:bg-black hover:text-rcms-gold transition-all duration-300 border-rcms-gold"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Provider Portal
                </Button>
              </div>
              
              {/* Report Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Dialog open={concernDialogOpen} onOpenChange={setConcernDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="bg-rcms-mint text-black hover:bg-black hover:text-rcms-mint transition-all duration-300"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Report Concern
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <ReportConcernDialog 
                      caseId={caseId || ""} 
                      onSuccess={() => setConcernDialogOpen(false)} 
                    />
                  </DialogContent>
                </Dialog>

                <Dialog open={complaintDialogOpen} onOpenChange={setComplaintDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="bg-rcms-coral text-white hover:bg-black hover:text-rcms-coral transition-all duration-300"
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
            </div>
          </div>
        </div>
      </header>

      {/* Care Team Contact Bar */}
      <CareTeamContactBar caseId={caseId || ""} />

      {/* Voice Concerns Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center">
                <UserRound className="w-6 h-6 text-primary" />
                <Megaphone className="w-4 h-4 text-primary absolute left-4 top-3" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Have concerns about your provider care?</p>
                <p className="text-sm text-muted-foreground">
                  Your RN Care Manager is here to help. Share any issues confidentially.
                </p>
              </div>
            </div>
            <Dialog open={voiceConcernsOpen} onOpenChange={setVoiceConcernsOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="whitespace-nowrap">
                  <div className="relative flex items-center mr-2">
                    <UserRound className="w-5 h-5 text-primary-foreground" />
                    <Megaphone className="w-3 h-3 text-primary-foreground absolute left-3 top-2.5" />
                  </div>
                  Voice Your Concerns
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                {caseId ? (
                  <VoiceConcernsForm caseId={caseId} />
                ) : (
                  <Alert>
                    <AlertDescription>
                      No active case found. Please complete intake first.
                    </AlertDescription>
                  </Alert>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* SECTION 2 - SNAPSHOT + TABS (navy→teal gradient) */}
      <section className="bg-gradient-navy-teal py-12">
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          {/* Wellness Snapshot */}
          <WellnessSnapshot 
            caseId={caseId || ""} 
            onViewProgress={() => setActiveTab("checkins")} 
          />
          
          {/* Health Summary Chips */}
          <HealthSummaryChips caseId={caseId || ""} />

          {/* Comprehensive Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="overflow-x-auto -mx-6 px-6 scrollbar-hide">
              <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-5 lg:grid-cols-10 bg-white border-2 border-rcms-gold shadow-lg">
                <TabsTrigger 
                  value="checkins"
                  className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Wellness</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="journal"
                  className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
                >
                  <BookText className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Journal</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="careplans"
                  className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Care Plans</span>
                </TabsTrigger>
              <TabsTrigger 
                value="documents"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
              <TabsTrigger 
                value="timeline"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <Clock className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Timeline</span>
              </TabsTrigger>
              <TabsTrigger 
                value="resources"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Resources</span>
              </TabsTrigger>
              <TabsTrigger 
                value="goals"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">My Goals</span>
              </TabsTrigger>
              <TabsTrigger 
                value="actions"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Action Items</span>
              </TabsTrigger>
              <TabsTrigger 
                value="appointments"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <Clock className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Appointments</span>
              </TabsTrigger>
              <TabsTrigger 
                value="medications"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <Stethoscope className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Medications</span>
              </TabsTrigger>
              <TabsTrigger 
                value="messages"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Quick Message</span>
              </TabsTrigger>
            </TabsList>
            </div>

            {/* Tab Content with white cards */}
            <div className="bg-white rounded-xl border-2 border-rcms-gold shadow-xl p-6">
              <TabsContent value="checkins" className="mt-0">
                <div className="space-y-4">
                  <div className="border-b-2 border-rcms-gold pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                      <ClipboardCheck className="w-6 h-6 text-rcms-teal" />
                      The Wellness Center
                    </h2>
                  </div>
                  <ClientCheckins />
                  <div className="mt-6 pt-6 border-t-2 border-rcms-gold">
                    <ClientJournal caseId={caseId || ""} />
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
                <CarePlansViewer caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="communication" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-rcms-teal" />
                    Messages / Communication Center
                  </h2>
                </div>
                <ClientMessaging caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <FileText className="w-6 h-6 text-rcms-teal" />
                    Documents & Files
                  </h2>
                </div>
                <ClientDocuments caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="timeline" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-6 h-6 text-rcms-teal" />
                    Case Summary / Activity Timeline
                  </h2>
                </div>
                <CaseTimeline caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="resources" className="mt-0">
                <ResourceLibrary />
              </TabsContent>

              <TabsContent value="goals" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <ClipboardCheck className="w-6 h-6 text-rcms-teal" />
                    My Recovery Goals
                  </h2>
                </div>
                <ClientGoalTracker caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="actions" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-rcms-teal" />
                    My Action Items
                  </h2>
                </div>
                <ClientActionItems caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="appointments" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-6 h-6 text-rcms-teal" />
                    My Upcoming Appointments
                  </h2>
                </div>
                <ClientAppointmentCalendar caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="medications" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Stethoscope className="w-6 h-6 text-rcms-teal" />
                    My Medications
                  </h2>
                </div>
                <ClientMedicationTracker caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="messages" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-rcms-teal" />
                    Quick Message
                  </h2>
                </div>
                <ClientQuickMessage caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="journal" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <BookText className="w-6 h-6 text-rcms-teal" />
                    Personal Journal
                  </h2>
                </div>
                <ClientJournal caseId={caseId || ""} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </section>

      {/* SECTION 3 - SUPPORT FOOTER (pale gold background) */}
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
