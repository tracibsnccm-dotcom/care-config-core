// src/auth/supabaseAuth.tsx

import {
  createContext,
  useContext,
  useEffect,
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

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session ?? null);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
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

  const value: AuthContextValue = {
    user,
    session,
    loading,
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
