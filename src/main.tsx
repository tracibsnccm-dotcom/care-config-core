/**
 * MVP Routing Configuration
 * 
 * MVP Entry Route: "/" → Index (Lovable landing page)
 * MVP Attorney Route: "/attorney-portal" → AppShell with "attorney" tab active
 * MVP RN Route: "/rn-console" → AppShell with "rn" tab active (RNConsole component)
 * MVP Client Route: "/client-portal" → ClientPortal component (direct mount)
 * /demo Guard: VITE_ENABLE_DEMO env var (default: disabled)
 * 
 * Summary:
 * - "/" routes to MVP landing page (Index component)
 * - "/rn-console" routes to MVP RN portal (AppShell with RNConsole component)
 *   - RNConsole uses Supabase-backed APIs (no demo/mock data)
 *   - RNConsole enforces released snapshot immutability
 *   - RNConsole supports post-release draft creation
 * - "/attorney-portal" routes to MVP attorney portal (AppShell with AttorneyConsole component)
 * - "/client-portal" routes to MVP client portal (ClientPortal component)
 *   - ClientPortal uses Supabase-backed APIs (no demo/mock data)
 *   - ClientCheckins writes directly to client_checkins and case_alerts tables
 * - "/demo" is blocked unless VITE_ENABLE_DEMO === "true"
 * - Demo features are quarantined, not improved
 */

// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppShell from "./AppShell";
import DemoHub from "./pages/DemoHub.tsx";
import Index from "./pages/Index";
import ClientPortal from "./pages/ClientPortal";
import ClientIntakeForm from "./pages/ClientIntakeForm";
import IntakeWizard from "./pages/IntakeWizard";
import AttorneyLanding from "./pages/AttorneyLanding";
import AttorneyLogin from "./pages/AttorneyLogin";
import ClientLogin from "./pages/ClientLogin";
import ClientPortalSimple from "./pages/ClientPortalSimple";
import Access from "./pages/Access";
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
    // This is the full wizard that inserts into rc_client_intakes with compliance workflow
    if (pathname === "/client-intake" || pathname.startsWith("/client-intake")) {
      return <IntakeWizard />;
    }

    // MVP Client Portal: "/client-portal" routes to ClientPortalSimple component
    // This route is now handled by React Router as a public route (outside AuthProvider)
    // ClientPortalSimple uses public fetch functions and reads case_id from sessionStorage
    // No longer handled here - moved to Routes structure above

    // MVP Attorney Login: "/attorney-login" routes to AttorneyLogin component
    // Separate login flow for attorneys (NOT through /auth)
    if (pathname === "/attorney-login" || pathname.startsWith("/attorney-login")) {
      return <AttorneyLogin />;
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

    // MVP Attorney Portal: "/attorney-portal" routes to AttorneyConsole component
    // AppShell defaults to "attorney" tab
    // Check more specific route first
    if (pathname === "/attorney-portal" || pathname.startsWith("/attorney-portal")) {
      return <AppShell defaultTab="attorney" />;
    }

    // MVP Attorney Portal: "/attorney" routes to AttorneyConsole component via AppShell
    // Explicit route for attorney portal (must come after /attorney-portal to avoid matching it)
    if (pathname === "/attorney") {
      return <AppShell defaultTab="attorney" />;
    }

    // MVP RN Portal: "/rn-console" routes directly to RNConsole component
    // This is the MVP RN portal entry point - uses Supabase-backed APIs only
    // No demo dependencies: RNConsole uses Supabase, enforces released snapshot immutability,
    // and supports post-release draft creation via RNPublishPanel
    if (pathname === "/rn-console" || pathname === "/rn-portal-landing") {
      return <AppShell defaultTab="rn" />;
    }

    // Handle RN case-specific routes (e.g., /rn/case/:caseId/4ps)
    // These routes are handled by RNCaseRouter within RNConsole
    if (pathname.startsWith("/rn/case/")) {
      return <AppShell defaultTab="rn" />;
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

    // All other routes go to AppShell (defaults to attorney tab)
    return <AppShell />;
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
          <Route path="/client-login" element={<ClientLogin />} />
          <Route path="/client-portal" element={<ClientPortalSimple />} />
          <Route path="/attorney-login" element={<AttorneyLogin />} />
          <Route path="/auth" element={<Access />} />
          <Route path="/access" element={<Access />} />
          
          {/* Protected routes - wrapped in AuthProvider */}
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
