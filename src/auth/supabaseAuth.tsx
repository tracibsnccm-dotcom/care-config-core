// ============================================================
// RCMS C.A.R.E. — Supabase Auth + Role Guard
// ============================================================

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";

// Export supabase for use in components
export { supabase };

type RCMSUser = {
  id: string;
  email?: string | null;
  roles: string[];
};

type AuthCtx = {
  session: Session | null;
  user: RCMSUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // Helper properties for easier access
  roles: string[];
  hasRole: (role: string) => boolean;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<RCMSUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);

      if (data.session?.user) {
        const u = data.session.user;
        const roles = await fetchRoles(u.id);
        setUser({ id: u.id, email: u.email, roles });
      } else {
        setUser(null);
      }
      setLoading(false);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setTimeout(async () => {
          const roles = await fetchRoles(newSession.user.id);
          setUser({ id: newSession.user.id, email: newSession.user.email, roles });
        }, 0);
      } else {
        setUser(null);
      }
    });

    init();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const roles = user?.roles || [];
  const hasRole = (role: string) => roles.includes(role);

  const value = useMemo(
    () => ({ session, user, loading, signOut, roles, hasRole }),
    [session, user, loading, roles]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

async function fetchRoles(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    console.warn("role fetch error", error);
    return [];
  }
  return (data || []).map((r) => r.role);
}

export function ProtectedRoute({
  roles,
  children,
}: {
  roles?: string[];
  children: React.ReactNode;
}) {
  const { session, user, loading } = useAuth();

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!session || !user) return <Navigate to="/access" replace />;

  if (roles && roles.length > 0) {
    const ok = user.roles.some((r) => roles.includes(r));
    if (!ok) {
      // In development/preview, allow navigation for testing different roles
      // without modifying backend role assignments.
      if (import.meta.env.DEV) {
        console.warn("ProtectedRoute: bypassing role check in DEV for testing");
      } else {
        return <Navigate to="/access" replace />;
      }
    }
  }

  return <>{children}</>;
}
