import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RCMS, btn } from "../constants/brand";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function AttorneyLogin() {
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

    console.log("AttorneyLogin: Starting login attempt");
    console.log("AttorneyLogin: Email (original):", JSON.stringify(email));
    console.log("AttorneyLogin: Email (trimmed):", JSON.stringify(trimmedEmail));
    console.log("AttorneyLogin: Password length:", trimmedPassword.length);
    console.log("AttorneyLogin: Email length:", trimmedEmail.length);

    try {
      // Sign in with email and password (using trimmed values)
      console.log("AttorneyLogin: Calling supabase.auth.signInWithPassword");
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      console.log("AttorneyLogin: Auth response received");
      console.log("AttorneyLogin: Auth data:", authData ? { user: authData.user?.id, session: !!authData.session } : null);
      console.log("AttorneyLogin: Auth error:", authError);

      if (authError) {
        console.error("AttorneyLogin: Authentication error details:", {
          message: authError.message,
          status: authError.status,
          name: authError.name,
        });
        throw authError;
      }

      if (!authData || !authData.user) {
        console.error("AttorneyLogin: No user returned from auth");
        throw new Error("Login failed: No user returned");
      }

      console.log("AttorneyLogin: User authenticated, checking role for user ID:", authData.user.id);

      // Check the user's profile and role in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("AttorneyLogin: Error checking user profile:", profileError);
        await supabase.auth.signOut();
        throw new Error(`Failed to verify user profile: ${profileError.message}`);
      }

      if (!profileData || !profileData.role) {
        console.error("AttorneyLogin: No profile or role found for user");
        await supabase.auth.signOut();
        throw new Error("User account not found. Please contact your administrator.");
      }

      console.log("AttorneyLogin: User role found:", profileData.role);

      // Check if role is 'attorney' (case-insensitive)
      const userRole = profileData.role.toLowerCase();
      const isAttorney = userRole === "attorney";
      console.log('AttorneyLogin: Is attorney?', isAttorney);
      
      if (!isAttorney) {
        console.error("AttorneyLogin: User role is not attorney:", userRole);
        await supabase.auth.signOut();
        throw new Error(`This login is for attorneys only. Your account has role: ${profileData.role}`);
      }

      // Optional: Check for attorney directory record (rc_attorneys or attorney_metadata)
      // This is informational only - don't block login if missing, but log it
      try {
        // Try rc_attorneys first (if it exists)
        const { data: rcAttorneyData, error: rcAttorneyError } = await supabase
          .from("rc_attorneys")
          .select("id, attorney_code")
          .eq("auth_user_id", authData.user.id)
          .maybeSingle();

        if (rcAttorneyError && rcAttorneyError.code !== 'PGRST116') {
          // Table doesn't exist or other error - try attorney_metadata
          const { data: attorneyMetadataData, error: attorneyMetadataError } = await supabase
            .from("attorney_metadata")
            .select("user_id")
            .eq("user_id", authData.user.id)
            .maybeSingle();

          if (attorneyMetadataError && attorneyMetadataError.code !== 'PGRST116') {
            console.warn("AttorneyLogin: Attorney directory record not found, but proceeding with login");
            // Don't block login - this is optional metadata
          } else if (!attorneyMetadataData) {
            console.warn("AttorneyLogin: Attorney directory record not found in attorney_metadata");
            // Don't block login - this is optional metadata
          }
        } else if (!rcAttorneyData) {
          console.warn("AttorneyLogin: Attorney directory record not found in rc_attorneys");
          // Don't block login - this is optional metadata
        }
      } catch (dirError: any) {
        // If checking directory record fails, don't block login
        console.warn("AttorneyLogin: Error checking attorney directory record:", dirError);
        // Continue with login - directory record is optional
      }

      console.log("AttorneyLogin: Role verified as attorney, fetching attorney name");
      
      // Fetch attorney name and store in sessionStorage
      try {
        const { data: rcUser, error: rcUserError } = await supabase
          .from("rc_users")
          .select("full_name")
          .eq("auth_user_id", authData.user.id)
          .maybeSingle();

        if (!rcUserError && rcUser?.full_name) {
          console.log("AttorneyLogin: Storing attorney name in sessionStorage:", rcUser.full_name);
          sessionStorage.setItem('attorneyName', rcUser.full_name);
        } else {
          // Fallback to profiles table if rc_users doesn't have it
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("display_name, full_name")
            .eq("id", authData.user.id)
            .maybeSingle();

          if (!profileError && profile) {
            const name = profile.full_name || profile.display_name || "";
            if (name) {
              console.log("AttorneyLogin: Storing attorney name from profiles in sessionStorage:", name);
              sessionStorage.setItem('attorneyName', name);
            }
          }
        }
      } catch (nameError) {
        console.warn("AttorneyLogin: Error fetching attorney name, continuing with login:", nameError);
        // Don't block login if name fetch fails
      }

      console.log("AttorneyLogin: Role verified as attorney, redirecting to /attorney-console");
      console.log('AttorneyLogin: About to redirect to /attorney-console');
      // Success! Redirect to attorney console with full page reload to ensure proper component mounting
      window.location.href = '/attorney-console';
    } catch (err: any) {
      console.error("AttorneyLogin: Error caught in catch block:", err);
      console.error("AttorneyLogin: Error details:", {
        message: err.message,
        status: err.status,
        name: err.name,
        stack: err.stack,
      });
      
      // Check if this is an attorney directory record error (should not happen, but handle gracefully)
      if (err.message && err.message.includes("Attorney record not found")) {
        setError("Attorney directory record not found. Please contact your administrator.");
      } else {
        setError(err.message || "Login failed. Please check your credentials and try again.");
      }
    } finally {
      console.log("AttorneyLogin: Setting loading to false");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 bg-gradient-to-br from-secondary via-secondary-light to-primary">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold" style={{ color: RCMS.brandNavy }}>
            Attorney Portal Login
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access the Attorney Console
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {/* Login Instructions */}
          <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-foreground font-medium mb-1">
              Login requires Email + Password.
            </p>
            <p className="text-xs text-muted-foreground">
              Attorney number is not a login credential (used for identification only).
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
