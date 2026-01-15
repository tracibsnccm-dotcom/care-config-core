import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RCMS, btn } from "../constants/brand";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function RNLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Trim email to remove any whitespace (common issue)
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    console.log("RNLogin: Starting login attempt");
    console.log("RNLogin: Email (original):", JSON.stringify(email));
    console.log("RNLogin: Email (trimmed):", JSON.stringify(trimmedEmail));
    console.log("RNLogin: Password length:", trimmedPassword.length);
    console.log("RNLogin: Email length:", trimmedEmail.length);

    try {
      // Sign in with email and password (using trimmed values)
      console.log("RNLogin: Calling supabase.auth.signInWithPassword");
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      console.log("RNLogin: Auth response received");
      console.log("RNLogin: Auth data:", authData ? { user: authData.user?.id, session: !!authData.session } : null);
      console.log("RNLogin: Auth error:", authError);

      if (authError) {
        console.error("RNLogin: Authentication error details:", {
          message: authError.message,
          status: authError.status,
          name: authError.name,
        });
        throw authError;
      }

      if (!authData || !authData.user) {
        console.error("RNLogin: No user returned from auth");
        throw new Error("Login failed: No user returned");
      }

      console.log("RNLogin: User authenticated, checking role for user ID:", authData.user.id);

      // Check the user's role in rc_users table with timeout
      const roleCheckPromise = supabase
        .from("rc_users")
        .select("role")
        .eq("auth_user_id", authData.user.id)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Role check timeout')), 3000)
      );

      try {
        const { data: userData, error: roleError } = await Promise.race([roleCheckPromise, timeoutPromise]) as any;

        console.log('RNLogin: Role query result:', userData, roleError);

        if (roleError) {
          console.error("RNLogin: Error checking user role:", roleError);
          throw new Error(`Failed to verify user role: ${roleError.message}`);
        }

        if (!userData || !userData.role) {
          console.error("RNLogin: No role found for user");
          // Sign out the user since they don't have a role
          await supabase.auth.signOut();
          throw new Error("User account not found. Please contact your administrator.");
        }

        console.log("RNLogin: User role found:", userData.role);

        // Check if role is 'rn' or 'rn_supervisor' (case-insensitive)
        // Note: Provider role is separate and NOT used for nurses
        const userRole = userData.role.toLowerCase();
        const isRN = userRole === "rn" || userRole === "rn_supervisor" || userRole === "rn_cm_supervisor";
        console.log('RNLogin: Is RN?', isRN);
        if (!isRN) {
          console.error("RNLogin: User role is not RN:", userRole);
          // Sign out the user since they're not an RN
          await supabase.auth.signOut();
          throw new Error("This login is for RN users only");
        }

        console.log("RNLogin: Role verified as RN, redirecting to /rn-console");
        console.log('RNLogin: About to redirect to /rn-console');
        // Success! Redirect to RN console with full page reload to ensure proper component mounting
        window.location.href = '/rn-console';
      } catch (err: any) {
        // If timeout or other error, assume RN and proceed (RNConsole will handle any issues)
        if (err.message === 'Role check timeout') {
          console.log('RNLogin: Role check failed or timed out, proceeding anyway');
          window.location.href = '/rn-console';
          return;
        }
        // Re-throw other errors to be handled by outer catch
        throw err;
      }
    } catch (err: any) {
      console.error("RNLogin: Error caught in catch block:", err);
      console.error("RNLogin: Error details:", {
        message: err.message,
        status: err.status,
        name: err.name,
        stack: err.stack,
      });
      setError(err.message || "Login failed. Please check your credentials and try again.");
    } finally {
      console.log("RNLogin: Setting loading to false");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 bg-gradient-to-br from-secondary via-secondary-light to-primary">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold" style={{ color: RCMS.brandNavy }}>
            RN Portal Login
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access the RN Console
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {/* Login Instructions */}
          <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-foreground font-medium mb-1">
              Login requires Email + Password.
            </p>
            <p className="text-xs text-muted-foreground">
              Nurse number is not a login credential (used for identification only).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <input
                type="email"
                required
                className="w-full rounded-xl border border-input bg-background px-3 py-2 outline-none focus:border-ring"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full rounded-xl border border-input bg-background px-3 py-2 outline-none focus:border-ring"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`${btn.base} ${btn.lg} text-white w-full`}
              style={{
                backgroundColor: loading ? "#9ca3af" : RCMS.attorneyOrange || "#ff8c42",
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              ← Back to Home
            </a>
          </div>
        </div>

        <p className="mt-6 text-xs text-center text-muted-foreground">
          By continuing, you agree to RCMS's Minimum Necessary Data Policy and Terms.
        </p>
      </div>
    </div>
  );
}
