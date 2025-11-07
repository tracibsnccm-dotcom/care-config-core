import { useAuth } from "../auth/supabaseAuth";
import { Navigate } from "react-router-dom";

export default function RoleLandingRedirect() {
  const { user, loading } = useAuth();
  
  // Wait for auth to fully load before making routing decisions
  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/access" replace />;

  const r = new Set((user.roles || []).map(x => x.toUpperCase()));

  // Check for Clinical Management roles (Supervisor/Manager/Director) - redirect to management portal
  if (r.has("RN_CM_SUPERVISOR") || r.has("RN_CM_MANAGER") || r.has("RN_CM_DIRECTOR")) return <Navigate to="/clinical-management-portal" replace />;
  
  // Check for RN and Clinical Management roles
  if (r.has("RN_CM") || r.has("RCMS_CLINICAL_MGMT") || r.has("COMPLIANCE")) return <Navigate to="/rn-portal-landing" replace />;
  if (r.has("ATTORNEY") || r.has("STAFF")) return <Navigate to="/attorney-portal" replace />;
  // External clinical staff get same portal as RN CM
  if (r.has("CLINICAL_STAFF_EXTERNAL")) return <Navigate to="/rn-portal-landing" replace />;
  if (r.has("PROVIDER")) return <Navigate to="/provider-portal" replace />;
  // default to client
  return <Navigate to="/client-portal" replace />;
}
