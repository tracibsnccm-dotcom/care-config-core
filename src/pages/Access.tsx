import { useState } from "react";
import { supabase, useAuth } from "../auth/supabaseAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { RCMS, btn } from "../constants/brand";
import { z } from "zod";
import { toast } from "sonner";

// Authentication validation schema
const authSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email address is too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long")
});

export default function Access() {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // If already signed in, send to role redirect helper
  if (session && user) return <Navigate to="/client-portal" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);
    
    try {
      // Validate input with zod schema
      const validationResult = authSchema.safeParse({ email, password: pw });
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        setErr(firstError.message);
        toast.error(firstError.message);
        setLoading(false);
        return;
      }

      const validatedData = validationResult.data;

      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        if (error) throw error;
        setMsg("Account created! You can now log in.");
        toast.success("Account created successfully!");
        navigate("/client-portal", { replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });
        if (error) throw error;
        setMsg("Logged in successfully.");
        toast.success("Logged in successfully!");
        navigate("/client-portal", { replace: true });
      }
    } catch (ex: any) {
      const errorMessage = ex.message || String(ex);
      setErr(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold" style={{color: RCMS.brandNavy}}>
          Access Reconcile C.A.R.E.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in or create an account. New users receive the <span className="font-semibold">CLIENT</span> role by default; firms can add additional roles.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex gap-2">
            <button
              className={`${btn.base} ${btn.sm} ${mode==="login" ? "text-white" : "text-muted-foreground"} ${mode==="login" ? "" : "bg-muted"} `}
              style={{ backgroundColor: mode==="login" ? RCMS.brandNavy : undefined }}
              type="button"
              onClick={()=>setMode("login")}
            >
              Log in
            </button>
            <button
              className={`${btn.base} ${btn.sm} ${mode==="signup" ? "text-white" : "text-muted-foreground"} ${mode==="signup" ? "" : "bg-muted"} `}
              style={{ backgroundColor: mode==="signup" ? RCMS.brandTeal : undefined }}
              type="button"
              onClick={()=>setMode("signup")}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                required
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 outline-none focus:border-ring"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                required
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 outline-none focus:border-ring"
                value={pw}
                onChange={(e)=>setPw(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`${btn.base} ${btn.lg} text-white w-full`}
              style={{ backgroundColor: loading ? "#9ca3af" : RCMS.attorneyOrange }}
            >
              {mode==="signup" ? "Create account" : "Log in"}
            </button>
          </form>

          {msg && <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{msg}</p>}
          {err && <p className="mt-3 text-sm text-destructive">{err}</p>}

          <div className="mt-6">
            <a href="/logout" className="text-xs underline text-muted-foreground">Sign out</a>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          By continuing, you agree to RCMS's Minimum Necessary Data Policy and Terms.
        </p>
      </div>
    </div>
  );
}
