/**
 * MVP Routing Configuration
 * 
 * MVP Entry Route: "/" → Index (Lovable landing page)
 * MVP Attorney Route: "/attorney-portal" → AttorneyLanding component
 * MVP RN Route: "/rn-console" → RNPortalLanding (full Lovable RN dashboard)
 * MVP Client Route: "/client-portal" → ClientPortal component (direct mount)
 * /demo Guard: VITE_ENABLE_DEMO env var (default: disabled)
 * 
 * Summary:
 * - "/" routes to MVP landing page (Index component)
 * - "/rn-console" routes to MVP RN portal (RNPortalLanding full dashboard)
 *   - Uses Lovable RN components directly (no ChatGPT demo shell)
 *   - Full dashboard with stats, to-do lists, case health, and all features
 * - "/attorney-portal" routes to MVP attorney portal (AttorneyLanding component)
 * - "/client-portal" routes to MVP client portal (ClientPortal component)
 *   - ClientPortal uses Supabase-backed APIs (no demo/mock data)
 *   - ClientCheckins writes directly to rc_client_checkins and case_alerts tables
 * - "/demo" is blocked unless VITE_ENABLE_DEMO === "true"
 * - Demo features are quarantined, not improved
 */

// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import DemoHub from "./pages/DemoHub.tsx";
import Index from "./pages/Index";
import ClientPortal from "./pages/ClientPortal";
import ClientIntakeForm from "./pages/ClientIntakeForm";
import IntakeWizard from "./pages/IntakeWizard";
import AttorneyLanding from "./pages/AttorneyLanding";
import AttorneyPendingIntakesPage from "./pages/AttorneyPendingIntakesPage";
import AttorneyLogin from "./pages/AttorneyLogin";
import RNLogin from "./pages/RNLogin";
import RNPortalLogin from "./pages/RNPortalLogin";
import ClientLogin from "./pages/ClientLogin";
import ClientConsent from "./pages/ClientConsent";
import IntakeIdentity from "./pages/IntakeIdentity";
import ClientPortalSimple from "./pages/ClientPortalSimple";
import Access from "./pages/Access";
import RNPortalLanding from "./pages/RNPortalLanding";
import RNDashboard from "./pages/RNDashboard";
import RNSupervisor from "./pages/RNSupervisor";
import TenVsBuilder from "./components/rn/TenVsBuilder";
import CarePlanWorkflow from "./components/rn/CarePlanWorkflow";
import CheckIntakeStatus from "./pages/CheckIntakeStatus";
import ResumeIntake from "./pages/ResumeIntake";
import CaseDetail from "@/pages/CaseDetail";
import AttorneyCommunications from "./pages/AttorneyCommunications";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./auth/supabaseAuth";
import { AppProvider } from "./context/AppContext";
import { RequireAuth } from "./components/RequireAuth";

import "./index.css";

// Guard component for /demo route
const DemoRouteGuard: React.FC = () => {
  const demoEnabled = import.meta.env.VITE_ENABLE_DEMO === "true";
  
  if (!demoEnabled) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div style={{
          textAlign: "center",
          padding: "2rem",
        }}>
          <h1 style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: "0.5rem",
          }}>
            Demo disabled (MVP build)
          </h1>
          <p style={{
            fontSize: "0.9rem",
            color: "#64748b",
          }}>
            Demo features are not available in this build.
          </p>
        </div>
      </div>
    );
  }
  
  return <DemoHub />;
};

function Root() {
  try {
    // Handle both normal routing and hash routing just in case
    const pathname = typeof window !== "undefined" ? window.location.pathname || "/" : "/";
    const hash = typeof window !== "undefined" ? window.location.hash || "" : "";

    // Check if this is a /demo route
    const isDemoRoute =
      pathname === "/demo" ||
      pathname.startsWith("/demo/") ||
      hash === "#/demo" ||
      hash.startsWith("#/demo/");

    // /demo routes go through guard (default: disabled)
    if (isDemoRoute) {
      return <DemoRouteGuard />;
    }

    // MVP: "/" routes to Lovable landing page (Index component)
    // This is the MVP entry point - the landing page with portal access
    if (pathname === "/" || (!pathname || pathname === "/")) {
      return <Index />;
    }

    // MVP Intake: "/intake" routes to IntakeWizard component (legacy route, redirects to /client-intake)
    // Explicit route for intake wizard
    if (pathname === "/intake" || pathname.startsWith("/intake")) {
      // Redirect legacy /intake to /client-intake
      if (typeof window !== "undefined") {
        window.location.replace("/client-intake");
        return null;
      }
      return <IntakeWizard />;
    }

    // MVP Client Intake: "/client-intake" routes to IntakeWizard component
    // This route is now handled by React Router as a public route (outside AuthProvider)
    // No longer handled here - moved to Routes structure above

    // MVP Client Portal: "/client-portal" routes to ClientPortalSimple component
    // This route is now handled by React Router as a public route (outside AuthProvider)
    // ClientPortalSimple uses public fetch functions and reads case_id from sessionStorage
    // No longer handled here - moved to Routes structure above

    // MVP Attorney Login: "/attorney-login" routes to AttorneyLogin component
    // Separate login flow for attorneys (NOT through /auth)
    if (pathname === "/attorney-login" || pathname.startsWith("/attorney-login")) {
      return <AttorneyLogin />;
    }

    // MVP RN Login: "/rn-login" routes to RNPortalLogin component
    // Separate private login flow for RN users (NOT through /auth)
    if (pathname === "/rn-login" || pathname.startsWith("/rn-login")) {
      return <RNPortalLogin />;
    }

    // MVP Client Login: "/client-login" routes to ClientLogin component
    // Separate login flow for clients using case_number + PIN
    if (pathname === "/client-login" || pathname.startsWith("/client-login")) {
      return <ClientLogin />;
    }

    // MVP Attorney Console: "/attorney-console" routes to AttorneyLanding component
    // Production attorney landing page (NOT demo)
    // REQUIRES AUTHENTICATION - gate at route level
    // Redirects to /attorney-login if not authenticated (NOT /auth)
    if (pathname === "/attorney-console" || pathname.startsWith("/attorney-console")) {
      return (
        <RequireAuth>
          <AttorneyLanding />
        </RequireAuth>
      );
    }

    // MVP Attorney Communications: "/attorney/communications" routes to AttorneyCommunications component
    // Check more specific routes first (before /attorney-portal)
    if (pathname === "/attorney/communications" || pathname.startsWith("/attorney/communications")) {
      return (
        <RequireAuth>
          <AttorneyCommunications />
        </RequireAuth>
      );
    }

    // MVP Attorney Pending Intakes: "/attorney/pending-intakes" routes to AttorneyPendingIntakesPage component
    // Check more specific route first (before /attorney-portal)
    if (pathname === "/attorney/pending-intakes" || pathname.startsWith("/attorney/pending-intakes")) {
      return (
        <RequireAuth>
          <AttorneyPendingIntakesPage />
        </RequireAuth>
      );
    }

    // MVP Attorney Portal: "/attorney-portal" routes to AttorneyLanding component
    // Check more specific route first
    if (pathname === "/attorney-portal" || pathname.startsWith("/attorney-portal")) {
      return (
        <RequireAuth>
          <AttorneyLanding />
        </RequireAuth>
      );
    }

    // MVP Attorney Portal: "/attorney" routes to AttorneyLanding component
    // Explicit route for attorney portal (must come after /attorney-portal to avoid matching it)
    if (pathname === "/attorney") {
      return (
        <RequireAuth>
          <AttorneyLanding />
        </RequireAuth>
      );
    }

    // MVP RN Portal: "/rn-console" routes to RNPortalLanding (full dashboard)
    // This is the MVP RN portal entry point - uses full Lovable RN dashboard
    if (pathname === "/rn-console" || pathname === "/rn-portal-landing") {
      return (
        <RequireAuth>
          <RNPortalLanding />
        </RequireAuth>
      );
    }

    // Sign-in/Access route: "/auth" routes to Access component (sign-in page)
    // Also support "/access" for backward compatibility
    if (pathname === "/auth" || pathname.startsWith("/auth")) {
      return <Access />;
    }

    // Legacy /access route (backward compatibility)
    if (pathname === "/access" || pathname.startsWith("/access")) {
      return <Access />;
    }

    // Handle /go route (from Access.tsx redirect)
    if (pathname === "/go") {
      // Redirect to landing page for MVP (role-based redirects can be added later)
      if (typeof window !== "undefined") {
        window.location.replace("/");
        return null;
      }
    }

    // All other routes go to landing page
    return <Index />;
  } catch (error) {
    // Catch any routing errors and log them
    console.error("[Root] Routing error:", error);
    // Fallback to landing page
    return <Index />;
  }
}

// Protected routes wrapper - wraps Root component in AuthProvider and AppProvider
function ProtectedRoutes() {
  return (
    <AuthProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </AuthProvider>
  );
}

// Wrap entire app with BrowserRouter, ErrorBoundary, AuthProvider, and AppProvider
// BrowserRouter provides Router context for useNavigate() and other React Router hooks
// ErrorBoundary catches render errors and prevents blank screens
// AuthProvider provides auth context for useAuth() hook (required by AppProvider)
// AppProvider provides app context for useApp() hook (used by ClientCheckins)
// 
// Public pages (ClientLogin, AttorneyLogin, Access) are rendered OUTSIDE AuthProvider
// using React Router Routes/Route structure to avoid hanging issues with Supabase client initialization
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* Public routes - no AuthProvider */}
          <Route path="/client-consent" element={<ClientConsent />} />
          <Route path="/intake-identity" element={<IntakeIdentity />} />
          <Route path="/client-intake" element={<IntakeWizard />} />
          <Route path="/resume-intake" element={<ResumeIntake />} />
          <Route path="/client-login" element={<ClientLogin />} />
          <Route path="/client-portal" element={<ClientPortalSimple />} />
          <Route path="/check-status" element={<CheckIntakeStatus />} />
          <Route path="/attorney-login" element={<AttorneyLogin />} />
          <Route path="/rn-login" element={<RNPortalLogin />} />
          <Route path="/auth" element={<Access />} />
          <Route path="/access" element={<Access />} />
          
          {/* Case detail route - needs to be explicit for useParams to work */}
          <Route path="/cases/:caseId" element={
            <AuthProvider>
              <AppProvider>
                <CaseDetail />
              </AppProvider>
            </AuthProvider>
          } />
          
          {/* RN Console - explicit protected route */}
          <Route path="/rn-console" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <RNPortalLanding />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          
          {/* RN Supervisor route */}
          <Route path="/rn-supervisor" element={
            <AuthProvider>
              <AppProvider>
                <RequireAuth>
                  <RNSupervisor />
                </RequireAuth>
              </AppProvider>
            </AuthProvider>
          } />
          
          {/* RN Dashboard and 10-Vs Builder routes */}
          <Route path="/rn-dashboard" element={
            <AuthProvider>
              <AppProvider>
                <RNDashboard />
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/rn/case/:caseId/ten-vs" element={
            <AuthProvider>
              <AppProvider>
                <TenVsBuilder />
              </AppProvider>
            </AuthProvider>
          } />
          <Route path="/rn/case/:caseId/workflow" element={
            <AuthProvider>
              <AppProvider>
                <CarePlanWorkflow />
              </AppProvider>
            </AuthProvider>
          } />
          
          {/* Protected routes - wrapped in AuthProvider */}
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
