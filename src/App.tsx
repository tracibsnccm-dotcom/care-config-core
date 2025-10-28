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
import AccessGateway from "./pages/AccessGateway";
import IntakeWizard from "./pages/IntakeWizard";
import ProviderRouter from "./pages/ProviderRouter";
import ClientCheckins from "./pages/ClientCheckins";
import ClientPortal from "./pages/ClientPortal";
import ProviderPortal from "./pages/ProviderPortal";
import RNPortalLanding from "./pages/RNPortalLanding";
import ClientJournal from "./pages/ClientJournal";
import ClientJournalDashboard from "./pages/ClientJournalDashboard";
import AdminPanel from "./pages/AdminPanel";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import { ClientPortalRoute } from "./modules/rcms-client-portal-tab";
import RNCMCompliance from "./pages/rncm/RNCMCompliance";
import RNQualityDashboard from "./pages/rncm/RNQualityDashboard";
import RNDashboard from "./pages/rncm/RNDashboard";
import PortalShareDemoPage, { ProviderShareView } from "./pages/provider/PortalShareDemo";
import { ProtectedRoute } from "./auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Access Gateway for magic links */}
            <Route path="/access" element={<AccessGateway />} />
            
            {/* Public intake */}
            <Route path="/intake" element={<IntakeWizard />} />
            
            {/* Role-protected portals */}
            <Route
              path="/attorney-portal"
              element={
                <ProtectedRoute roles={["ATTORNEY"]}>
                  <AttorneyLanding />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/client-portal"
              element={
                <ProtectedRoute roles={["CLIENT"]}>
                  <ClientPortal />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/provider-portal"
              element={
                <ProtectedRoute roles={["PROVIDER"]}>
                  <ProviderPortal />
                </ProtectedRoute>
              }
            />
            
            {/* RN unified landing + subpages */}
            <Route
              path="/rn-portal"
              element={
                <ProtectedRoute roles={["RN_CCM", "SUPER_USER", "SUPER_ADMIN"]}>
                  <RNPortalLanding />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/rn-dashboard"
              element={
                <ProtectedRoute roles={["RN_CCM", "SUPER_USER", "SUPER_ADMIN"]}>
                  <RNDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/rn-cm/compliance"
              element={
                <ProtectedRoute roles={["RN_CCM", "SUPER_USER", "SUPER_ADMIN"]}>
                  <RNCMCompliance />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/rn-cm/quality"
              element={
                <ProtectedRoute roles={["RN_CCM", "SUPER_USER", "SUPER_ADMIN"]}>
                  <RNQualityDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Legacy routes (kept for backward compatibility) */}
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/:caseId" element={<CaseDetail />} />
            <Route path="/management" element={<CaseManagement />} />
            <Route path="/providers" element={<Providers />} />
            <Route path="/router" element={<ProviderRouter />} />
            <Route path="/checkins" element={<ClientCheckins />} />
            <Route path="/journal" element={<ClientJournal />} />
            <Route path="/journal-analytics" element={<ClientJournalDashboard />} />
            <Route path="/admin-dashboard" element={<AdminPanel />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/provider/share-demo" element={<PortalShareDemoPage />} />
            <Route path="/provider/preview" element={<ProviderShareView />} />
            
            {/* Legacy client portal route */}
            <Route path="/client-portal-legacy" element={<ClientPortalRoute />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
