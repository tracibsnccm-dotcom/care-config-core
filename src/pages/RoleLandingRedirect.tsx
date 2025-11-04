import { useAuth } from "../auth/supabaseAuth";
import { Navigate } from "react-router-dom";

export default function RoleLandingRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/access" replace />;

  const r = new Set((user.roles || []).map(x => x.toUpperCase()));

  // Check for RN_CCM first to allow RN users to access their portal
  // even if they have other roles
  if (r.has("RN_CCM")) return <Navigate to="/rn-portal-landing" replace />;
  if (r.has("ATTORNEY") || r.has("STAFF")) return <Navigate to="/attorney-portal" replace />;
  if (r.has("PROVIDER")) return <Navigate to="/provider-portal" replace />;
  // default to client
  return <Navigate to="/client-portal" replace />;
}
