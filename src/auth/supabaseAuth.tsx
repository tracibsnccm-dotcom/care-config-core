// src/auth/supabaseAuth.tsx

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createClient,
  type Session,
  type User,
} from "@supabase/supabase-js";

// 👇 Make sure these env vars are set in your Vite env (.env.local, etc.)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Map rc_users role values to app role names
function mapRcUserRoleToAppRole(rcRole: string): string {
  const roleMap: Record<string, string> = {
    'attorney': 'ATTORNEY',
    'rn_cm': 'RN_CM',
    'rn': 'RN_CM', // alias
    'provider': 'PROVIDER',
    'client': 'CLIENT',
    'supervisor': 'RN_CM_SUPERVISOR',
  };
  return roleMap[rcRole.toLowerCase()] || rcRole.toUpperCase();
}

// Fetch user roles from rc_users table
async function fetchUserRoles(authUserId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('rc_users')
      .select('role')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user roles from rc_users:', error);
      return [];
    }

    if (!data || !data.role) {
      console.warn(`No role found in rc_users for user ${authUserId}`);
      return [];
    }

    // Map the role to app role format
    const appRole = mapRcUserRoleToAppRole(data.role);
    return [appRole];
  } catch (error) {
    console.error('Exception fetching user roles:', error);
    return [];
  }
}

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean; // Backwards compatibility: authLoading || rolesLoading
  authLoading: boolean; // True while checking if user is logged in
  rolesLoading: boolean; // True while fetching roles
  roles: string[];
  primaryRole: string | null;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  // Fetch roles when user changes
  useEffect(() => {
    const fetchRoles = async () => {
      if (user?.id) {
        // Only set loading if this is a different user than the one we already loaded roles for
        if (user.id !== lastLoadedUserIdRef.current) {
          setRolesLoading(true);
        }
        const userRoles = await fetchUserRoles(user.id);
        setRoles(userRoles);
        lastLoadedUserIdRef.current = user.id;
        setRolesLoading(false);
      } else {
        setRoles([]);
        lastLoadedUserIdRef.current = null;
        setRolesLoading(false);
      }
    };

    void fetchRoles();
  }, [user?.id]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session ?? null);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session ?? null);
      const newUserId = session?.user?.id ?? null;
      const currentUserId = user?.id ?? null;
      
      // Only set rolesLoading if the user ID has actually changed
      if (newUserId !== currentUserId) {
        setUser(session?.user ?? null);
        // Fetch roles when auth state changes
        if (session?.user?.id) {
          // Only set loading if this is a different user than the one we already loaded roles for
          if (session.user.id !== lastLoadedUserIdRef.current) {
            setRolesLoading(true);
          }
          const userRoles = await fetchUserRoles(session.user.id);
          setRoles(userRoles);
          lastLoadedUserIdRef.current = session.user.id;
          setRolesLoading(false);
        } else {
          setRoles([]);
          lastLoadedUserIdRef.current = null;
          setRolesLoading(false);
        }
      } else {
        // Same user, just update session/user state without reloading roles
        setUser(session?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string) => {
    // You can adapt this to magic link, password, etc.
    await supabase.auth.signInWithOtp({ email });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const primaryRole = roles.length > 0 ? roles[0] : null;

  // Backwards compatibility: loading is true if EITHER auth is loading OR roles are loading
  // This prevents race conditions where components see empty roles before they're fetched
  const loading = authLoading || rolesLoading;

  const value: AuthContextValue = {
    user,
    session,
    loading, // Backwards compatibility
    authLoading,
    rolesLoading,
    roles,
    primaryRole,
    signInWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
