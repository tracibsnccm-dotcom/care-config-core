import { useEffect } from "react";
import { supabase } from "../auth/supabaseAuth";
import { Navigate } from "react-router-dom";

export default function Logout() {
  useEffect(() => {
    supabase.auth.signOut();
  }, []);
  return <Navigate to="/access" replace />;
}
