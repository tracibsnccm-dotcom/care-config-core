import React, { useState } from "react";
import { supabase, useAuth } from "../auth/supabaseAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Access() {
  const { session, user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Redirect authenticated users to attorney portal
  if (session && user) {
    // Redirect based on roles
    if (user.roles.includes("ATTORNEY") || user.roles.includes("STAFF") || 
        user.roles.includes("SUPER_USER") || user.roles.includes("SUPER_ADMIN")) {
      return <Navigate to="/attorney-portal" replace />;
    }
    if (user.roles.includes("CLIENT")) {
      return <Navigate to="/client-portal" replace />;
    }
    if (user.roles.includes("PROVIDER")) {
      return <Navigate to="/provider-portal" replace />;
    }
    if (user.roles.includes("RN_CCM")) {
      return <Navigate to="/rn-portal" replace />;
    }
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);
    
    try {
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password: pw,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        if (error) throw error;
        setMsg("Account created! You can now log in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: pw,
        });
        if (error) throw error;
        setMsg("Logged in successfully.");
      }
    } catch (ex: any) {
      setErr(ex.message || String(ex));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-extrabold text-primary">Access RCMS C.A.R.E.</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign in or create an account. Roles are applied automatically (CLIENT by default). Your
        firm can add attorney/staff access.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex gap-2">
          <Button
            variant={mode === "login" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("login")}
          >
            Log in
          </Button>
          <Button
            variant={mode === "signup" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("signup")}
          >
            Sign up
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {mode === "signup" ? "Create account" : "Log in"}
          </Button>
        </form>

        {msg && <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{msg}</p>}
        {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        By continuing, you agree to RCMS's Minimum Necessary Data policy and Terms.
      </p>
    </div>
  );
}
