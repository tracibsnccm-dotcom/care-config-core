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
import IntakeWizard from "./pages/IntakeWizard";
import ProviderRouter from "./pages/ProviderRouter";
import ClientCheckins from "./pages/ClientCheckins";
import ClientJournal from "./pages/ClientJournal";
import ClientJournalDashboard from "./pages/ClientJournalDashboard";
import AdminPanel from "./pages/AdminPanel";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import { ClientPortalRoute } from "./modules/rcms-client-portal-tab";

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
            <Route path="/attorney" element={<AttorneyLanding />} />
            <Route path="/intake" element={<IntakeWizard />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/:caseId" element={<CaseDetail />} />
            <Route path="/management" element={<CaseManagement />} />
            <Route path="/providers" element={<Providers />} />
            <Route path="/router" element={<ProviderRouter />} />
            <Route path="/client-portal" element={<ClientPortalRoute />} />
            <Route path="/checkins" element={<ClientCheckins />} />
            <Route path="/journal" element={<ClientJournal />} />
            <Route path="/journal-analytics" element={<ClientJournalDashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/reports" element={<Reports />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
