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
  type Session,
  type User,
} from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

// Timeout wrapper for async operations
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Role fetch timed out')), timeoutMs)
    )
  ]);
}

// Fetch user roles from profiles table (preferred) or rc_users table (fallback)
async function fetchUserRoles(authUserId: string): Promise<string[]> {
  console.log('=== Auth: fetchUserRoles START for user', authUserId);
  try {
    // Try profiles table first (preferred) - with timeout
    const profilePromise = supabase
      .from('profiles')
      .select('role')
      .eq('id', authUserId)
      .maybeSingle();

    const { data: profileData, error: profileError } = await withTimeout(profilePromise, 12000);

    if (!profileError && profileData?.role) {
      console.log('=== Auth: Role found in profiles:', profileData.role);
      const appRole = mapRcUserRoleToAppRole(profileData.role);
      return [appRole];
    }

    // Fallback to rc_users table - with timeout
    console.log('=== Auth: Trying rc_users table as fallback');
    const rcUsersPromise = supabase
      .from('rc_users')
      .select('role')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    const { data, error } = await withTimeout(rcUsersPromise, 12000);

    if (error) {
      console.error('=== Auth: Error fetching user roles from rc_users:', error);
      return [];
    }

    if (!data || !data.role) {
      console.warn(`=== Auth: No role found in rc_users for user ${authUserId}`);
      return [];
    }

    // Map the role to app role format
    const appRole = mapRcUserRoleToAppRole(data.role);
    console.log('=== Auth: Role found in rc_users:', data.role, 'mapped to:', appRole);
    return [appRole];
  } catch (error) {
    console.error('=== Auth: Exception fetching user roles:', error);
    // On timeout or any error, return empty array - don't block rendering
    return [];
  } finally {
    console.log('=== Auth: fetchUserRoles END');
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
  console.log('=== Auth: AuthProvider render, authLoading =', authLoading);
  const [rolesLoading, setRolesLoading] = useState(true);
  const lastLoadedUserIdRef = useRef<string | null>(null);
  const rolesLoadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch roles when user changes
  useEffect(() => {
    const fetchRoles = async () => {
      console.log('=== Auth: fetchRoles START, user?.id =', user?.id);
      
      // ALWAYS set loading to true at start, and ALWAYS set to false in finally
      setRolesLoading(true);
      
      try {
        if (user?.id) {
          // Only fetch if this is a different user than the one we already loaded roles for
          if (user.id !== lastLoadedUserIdRef.current) {
            console.log('=== Auth: New user detected, fetching roles');
            const userRoles = await fetchUserRoles(user.id);
            console.log('=== Auth: Roles fetched:', userRoles);
            setRoles(userRoles);
            lastLoadedUserIdRef.current = user.id;
          } else {
            console.log('=== Auth: Same user, skipping role fetch');
          }
        } else {
          console.log('=== Auth: No user, clearing roles');
          setRoles([]);
          lastLoadedUserIdRef.current = null;
        }
      } catch (error) {
        console.error('=== Auth: Error in fetchRoles:', error);
        // On error, set empty roles but don't block
        setRoles([]);
        lastLoadedUserIdRef.current = null;
      } finally {
        // ALWAYS clear loading state - this ensures rolesLoading never hangs
        console.log('=== Auth: fetchRoles END, setting rolesLoading = false');
        setRolesLoading(false);
      }
    };

    void fetchRoles();
  }, [user?.id]);

  // Safety timeout for rolesLoading - ensure it always resolves (increased to 12s to match fetch timeout)
  useEffect(() => {
    if (rolesLoading) {
      // Clear any existing timeout
      if (rolesLoadingTimeoutRef.current) {
        clearTimeout(rolesLoadingTimeoutRef.current);
      }
      
      // Set a timeout to force rolesLoading to false after 12 seconds (matches fetch timeout)
      rolesLoadingTimeoutRef.current = setTimeout(() => {
        console.warn('=== Auth: Safety timeout triggered for rolesLoading - forcing to false ===');
        setRolesLoading(false);
        setRoles([]); // Set empty roles on timeout
      }, 12000);
    } else {
      // Clear timeout if rolesLoading becomes false
      if (rolesLoadingTimeoutRef.current) {
        clearTimeout(rolesLoadingTimeoutRef.current);
        rolesLoadingTimeoutRef.current = null;
      }
    }

    return () => {
      if (rolesLoadingTimeoutRef.current) {
        clearTimeout(rolesLoadingTimeoutRef.current);
      }
    };
  }, [rolesLoading]);

  useEffect(() => {
    const init = async () => {
      console.log('=== Auth: init() function called ===');
      try {
        console.log('=== Auth: About to call getSession() ===');
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        
        console.log('=== Auth: getSession() returned:', {
          hasSession: !!session,
          userId: session?.user?.id,
          error: sessionError
        });
        
        if (sessionError) {
          console.error('=== Auth: getSession() ERROR:', sessionError);
        }
        
        setSession(session ?? null);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('=== Auth: getSession() ERROR:', error);
      } finally {
        console.log('=== Auth: Setting authLoading to false ===');
        setAuthLoading(false);
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('=== Auth: onAuthStateChange event:', event, 'hasSession:', !!session, 'userId:', session?.user?.id);
      
      setSession(session ?? null);
      const newUserId = session?.user?.id ?? null;
      const currentUserId = user?.id ?? null;
      
      // Only set rolesLoading if the user ID has actually changed
      if (newUserId !== currentUserId) {
        console.log('=== Auth: User ID changed, updating user and roles');
        setUser(session?.user ?? null);
        // Fetch roles when auth state changes
        if (session?.user?.id) {
          // ALWAYS set loading to true at start, and ALWAYS set to false in finally
          setRolesLoading(true);
          try {
            // Only fetch if this is a different user than the one we already loaded roles for
            if (session.user.id !== lastLoadedUserIdRef.current) {
              console.log('=== Auth: New user in onAuthStateChange, fetching roles');
              const userRoles = await fetchUserRoles(session.user.id);
              console.log('=== Auth: Roles fetched in onAuthStateChange:', userRoles);
              setRoles(userRoles);
              lastLoadedUserIdRef.current = session.user.id;
            } else {
              console.log('=== Auth: Same user in onAuthStateChange, skipping role fetch');
            }
          } catch (error) {
            console.error('=== Auth: Error fetching roles in onAuthStateChange:', error);
            setRoles([]);
            lastLoadedUserIdRef.current = null;
          } finally {
            // ALWAYS clear loading state - this ensures rolesLoading never hangs
            console.log('=== Auth: onAuthStateChange roles fetch END, setting rolesLoading = false');
            setRolesLoading(false);
          }
        } else {
          console.log('=== Auth: No user in onAuthStateChange, clearing roles');
          setRoles([]);
          lastLoadedUserIdRef.current = null;
          setRolesLoading(false);
        }
      } else {
        // Same user, just update session/user state without reloading roles
        console.log('=== Auth: Same user, updating session only');
        setUser(session?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Safety timeout - ensure authLoading becomes false
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('=== Auth: Safety timeout triggered - forcing authLoading to false ===');
      setAuthLoading(false);
    }, 3000);
    
    return () => clearTimeout(timeout);
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
  console.log('=== Auth: Computing context value, authLoading =', authLoading, 'rolesLoading =', rolesLoading, 'loading =', loading);

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
