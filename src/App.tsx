import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import CaseManagement from "./pages/CaseManagement";
import Providers from "./pages/Providers";
import AttorneyLanding from "./pages/AttorneyLanding";
import AttorneyDashboard from "./pages/AttorneyDashboard";
import AttorneySettings from "./pages/AttorneySettings";
import RNSettings from "./pages/RNSettings";
import DocumentHub from "./pages/DocumentHub";
import Access from "./pages/Access";
import Logout from "./pages/Logout";
import RoleLandingRedirect from "./pages/RoleLandingRedirect";
import IntakeWizard from "./pages/IntakeWizard";
import ProviderRouter from "./pages/ProviderRouter";
import ClientPortal from "./pages/ClientPortal";
import ProviderPortal from "./pages/ProviderPortal";
import ProviderProfileSetup from "./pages/provider/ProviderProfileSetup";
import ProviderDetail from "./pages/ProviderDetail";
import RNPortal from "./pages/rn/RNPortal";
import RNPortalLanding from "./pages/RNPortalLanding";
import RNWorkQueue from "./pages/RNWorkQueue";
import RNCaseload from "./pages/rncm/RNCaseload";
import RNInsuranceAuth from "./pages/rncm/RNInsuranceAuth";
import RNTimeTracking from "./pages/rncm/RNTimeTracking";
import ClientJournalDashboard from "./pages/ClientJournalDashboard";
import AdminPanel from "./pages/AdminPanel";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import { ClientPortalRoute } from "./modules/rcms-client-portal-tab";
import RNCMCompliance from "./pages/rncm/RNCMCompliance";
import RNQualityDashboard from "./pages/rncm/RNQualityDashboard";

import RNSupervisorDashboard from "./pages/rncm/RNSupervisorDashboard";
import RNSupervisorPerformance from "./pages/rncm/RNSupervisorPerformance";
import RNDiary from "./pages/rncm/RNDiary";
import PortalShareDemoPage, { ProviderShareView } from "./pages/provider/PortalShareDemo";
import ConcernsComplaintsCenter from "./pages/ConcernsComplaintsCenter";
import Settings from "./pages/Settings";
import RNClinicalLiaison from "./pages/RNClinicalLiaison";
import Insights from "./pages/Insights";
import ESignCenter from "./pages/ESignCenter";
import Referrals from "./pages/Referrals";
import AttorneyPolicy from "./pages/AttorneyPolicy";
import RNEducationLibrary from "./pages/rncm/RNEducationLibrary";
import RNCarePlanReminders from "./pages/rncm/RNCarePlanReminders";
import RNCaseHandoffs from "./pages/rncm/RNCaseHandoffs";
import RNClinicalGuidelines from "./pages/rncm/RNClinicalGuidelines";
import RNCareWorkflows from "./pages/rncm/RNCareWorkflows";
import RNVoiceDocumentation from "./pages/rncm/RNVoiceDocumentation";
import AttorneyBilling from "./pages/AttorneyBilling";
import ClinicalManagementPortal from "./pages/ClinicalManagementPortal";
import { ProtectedRoute } from "./auth/supabaseAuth";
import { MobileQuickBar } from "./components/MobileQuickBar";
import { AssignmentAlertBanner } from "./components/AssignmentAlertBanner";
import AttorneyPortalPage from "./pages/attorney/AttorneyPortalPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AssignmentAlertBanner />
          <MobileQuickBar />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/access" element={<Access />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/intake" element={<IntakeWizard />} />
            
            {/* Role landing redirect */}
            <Route path="/go" element={<ProtectedRoute><RoleLandingRedirect /></ProtectedRoute>} />

            {/* Attorney/Staff routes */}
            <Route
              path="/attorney-portal"
              element={<ProtectedRoute roles={["ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><AttorneyPortalPage /></ProtectedRoute>}
            />
            <Route
              path="/attorney-landing"
              element={<ProtectedRoute roles={["ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><AttorneyLanding /></ProtectedRoute>}
            />
            <Route
              path="/attorney-dashboard"
              element={<ProtectedRoute roles={["ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><AttorneyDashboard /></ProtectedRoute>}
            />
            <Route
              path="/dashboard"
              element={<ProtectedRoute roles={["ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><Dashboard /></ProtectedRoute>}
            />
            <Route
              path="/documents"
              element={<ProtectedRoute roles={["ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><DocumentHub /></ProtectedRoute>}
            />
            <Route
              path="/cases"
              element={<ProtectedRoute roles={["ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><Cases /></ProtectedRoute>}
            />
            <Route
              path="/cases/:caseId"
              element={<ProtectedRoute roles={["ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><CaseDetail /></ProtectedRoute>}
            />
            <Route
              path="/management"
              element={<ProtectedRoute roles={["ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><CaseManagement /></ProtectedRoute>}
            />
            <Route
              path="/providers"
              element={<ProtectedRoute roles={["ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><Providers /></ProtectedRoute>}
            />
            <Route
              path="/router"
              element={<ProtectedRoute roles={["ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><ProviderRouter /></ProtectedRoute>}
            />
            <Route
              path="/admin-dashboard"
              element={<ProtectedRoute roles={["SUPER_USER","SUPER_ADMIN"]}><AdminPanel /></ProtectedRoute>}
            />
            <Route
              path="/reports"
              element={<ProtectedRoute roles={["ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><Reports /></ProtectedRoute>}
            />
            <Route
              path="/rn-clinical-liaison"
              element={<ProtectedRoute roles={["ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><RNClinicalLiaison /></ProtectedRoute>}
            />
            <Route
              path="/insights"
              element={<ProtectedRoute roles={["ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><Insights /></ProtectedRoute>}
            />
            <Route
              path="/e-sign-center"
              element={<ProtectedRoute roles={["ATTORNEY","RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><ESignCenter /></ProtectedRoute>}
            />

            {/* Client routes */}
            <Route
              path="/client-portal"
              element={<ProtectedRoute roles={["CLIENT","ATTORNEY","RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><ClientPortal /></ProtectedRoute>}
            />
            <Route
              path="/client-portal-legacy"
              element={<ProtectedRoute roles={["CLIENT","ATTORNEY","RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><ClientPortalRoute /></ProtectedRoute>}
            />
            <Route
              path="/journal-analytics"
              element={<ProtectedRoute roles={["ATTORNEY","RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><ClientJournalDashboard /></ProtectedRoute>}
            />

            {/* Provider routes */}
            <Route
              path="/provider-portal"
              element={<ProtectedRoute roles={["PROVIDER","ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><ProviderPortal /></ProtectedRoute>}
            />
            <Route
              path="/provider-profile-setup"
              element={<ProtectedRoute roles={["PROVIDER","ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><ProviderProfileSetup /></ProtectedRoute>}
            />
            <Route
              path="/provider/:providerId"
              element={<ProtectedRoute roles={["CLIENT","ATTORNEY","RN_CM","STAFF","SUPER_USER","SUPER_ADMIN"]}><ProviderDetail /></ProtectedRoute>}
            />
            <Route
              path="/provider/share-demo"
              element={<ProtectedRoute roles={["PROVIDER","ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><PortalShareDemoPage /></ProtectedRoute>}
            />
            <Route
              path="/provider/preview"
              element={<ProtectedRoute roles={["PROVIDER","ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><ProviderShareView /></ProtectedRoute>}
            />

            {/* RN routes */}
            <Route
              path="/rn-portal"
              element={<ProtectedRoute roles={["RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><RNPortal /></ProtectedRoute>}
            />
            <Route
              path="/rn-portal-landing"
              element={<ProtectedRoute roles={["RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><RNPortalLanding /></ProtectedRoute>}
            />
            <Route
              path="/rn-work-queue"
              element={<ProtectedRoute roles={["RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><RNWorkQueue /></ProtectedRoute>}
            />
            <Route
              path="/rn-supervisor-dashboard"
              element={<ProtectedRoute roles={["SUPER_USER","SUPER_ADMIN"]}><RNSupervisorDashboard /></ProtectedRoute>}
            />
            <Route
              path="/rn-supervisor-performance"
              element={<ProtectedRoute roles={["RN_SUPERVISOR","SUPER_USER","SUPER_ADMIN"]}><RNSupervisorPerformance /></ProtectedRoute>}
            />
            <Route
              path="/rn-diary"
              element={<ProtectedRoute roles={["RN_CM","RCMS_CLINICAL_MGMT","SUPER_USER","SUPER_ADMIN"]}><RNDiary /></ProtectedRoute>}
            />
            <Route
              path="/rn-cm/compliance"
              element={<ProtectedRoute roles={["RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><RNCMCompliance /></ProtectedRoute>}
            />
            <Route
              path="/rn-cm/quality"
              element={<ProtectedRoute roles={["RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><RNQualityDashboard /></ProtectedRoute>}
            />
            <Route
              path="/rn/caseload"
              element={<ProtectedRoute roles={["RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><RNCaseload /></ProtectedRoute>}
            />
            <Route
              path="/rn/insurance-auth"
              element={<ProtectedRoute roles={["RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><RNInsuranceAuth /></ProtectedRoute>}
            />
            <Route
              path="/rn/time-tracking"
              element={<ProtectedRoute roles={["RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><RNTimeTracking /></ProtectedRoute>}
            />
            <Route
              path="/rn/education-library"
              element={<ProtectedRoute roles={["RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><RNEducationLibrary /></ProtectedRoute>}
            />
            <Route
              path="/rn/care-plan-reminders"
              element={<ProtectedRoute roles={["RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><RNCarePlanReminders /></ProtectedRoute>}
            />
            <Route
              path="/rn/case-handoffs"
              element={<ProtectedRoute roles={["RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><RNCaseHandoffs /></ProtectedRoute>}
            />
            <Route
              path="/rn/clinical-guidelines"
              element={<ProtectedRoute roles={["RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><RNClinicalGuidelines /></ProtectedRoute>}
            />
            <Route
              path="/rn/care-workflows"
              element={<ProtectedRoute roles={["RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><RNCareWorkflows /></ProtectedRoute>}
            />
            <Route
              path="/rn/voice-documentation"
              element={<ProtectedRoute roles={["RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><RNVoiceDocumentation /></ProtectedRoute>}
            />
            <Route
              path="/clinical-management-portal"
              element={<ProtectedRoute roles={["RN_CM_SUPERVISOR","RN_CM_MANAGER","RN_CM_DIRECTOR","SUPER_USER","SUPER_ADMIN"]}><ClinicalManagementPortal /></ProtectedRoute>}
            />
            <Route
              path="/concerns-complaints"
              element={<ProtectedRoute roles={["RN_CM_DIRECTOR","COMPLIANCE","SUPER_USER","SUPER_ADMIN"]}><ConcernsComplaintsCenter /></ProtectedRoute>}
            />
            <Route
              path="/attorney/policy"
              element={<ProtectedRoute roles={["ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><AttorneyPolicy /></ProtectedRoute>}
            />
            <Route
              path="/attorney/billing"
              element={<ProtectedRoute roles={["ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><AttorneyBilling /></ProtectedRoute>}
            />
            <Route
              path="/attorney/settings"
              element={<ProtectedRoute roles={["ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><AttorneySettings /></ProtectedRoute>}
            />
            <Route
              path="/rn/settings"
              element={<ProtectedRoute roles={["RN_CM","RCMS_CLINICAL_MGMT","STAFF","SUPER_USER","SUPER_ADMIN"]}><RNSettings /></ProtectedRoute>}
            />
            <Route
              path="/referrals"
              element={<ProtectedRoute roles={["ATTORNEY","STAFF","SUPER_USER","SUPER_ADMIN"]}><Referrals /></ProtectedRoute>}
            />

            {/* Settings - Available to all authenticated users */}
            <Route
              path="/settings"
              element={<ProtectedRoute><Settings /></ProtectedRoute>}
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
