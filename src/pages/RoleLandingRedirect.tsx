import { useAuth } from "../auth/supabaseAuth";
import { Navigate } from "react-router-dom";

export default function RoleLandingRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/access" replace />;

  const r = new Set((user.roles || []).map(x => x.toUpperCase()));

  // Check for Clinical Management roles (Supervisor/Manager/Director) - redirect to management portal
  if (r.has("RN_CM_SUPERVISOR") || r.has("RN_CM_MANAGER") || r.has("RN_CM_DIRECTOR")) return <Navigate to="/clinical-management-portal" replace />;
  
  // CRITICAL: CLIENT gets top priority to enable testing dual-role users as clients
  if (r.has("CLIENT")) return <Navigate to="/client-portal" replace />;
  
  // Check for RN and Clinical Management roles
  if (r.has("RN_CM") || r.has("RCMS_CLINICAL_MGMT") || r.has("COMPLIANCE")) return <Navigate to="/rn-portal-landing" replace />;
  
  // Check for Staff roles - redirect to staff portal
  if (r.has("STAFF") || r.has("RCMS_STAFF")) return <Navigate to="/staff-portal" replace />;
  
  // Attorney (without client role)
  if (r.has("ATTORNEY")) return <Navigate to="/attorney-portal" replace />;
  
  // External clinical staff get same portal as RN CM
  if (r.has("CLINICAL_STAFF_EXTERNAL")) return <Navigate to="/rn-portal-landing" replace />;
  if (r.has("PROVIDER")) return <Navigate to="/provider-portal" replace />;
  
  // Fallback to attorney portal for any remaining authenticated users
  return <Navigate to="/attorney-portal" replace />;
}
