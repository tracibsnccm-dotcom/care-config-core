import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { rnThemes, defaultTheme, type ThemeId } from "@/config/rnThemes";
import { Mail, Lock, Eye, EyeOff, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RNPortalLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Use default theme (boldModern)
  const theme = rnThemes[defaultTheme];

  // Fade-in animation on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    try {
      // Sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (authError) {
        throw authError;
      }

      if (!authData || !authData.user) {
        throw new Error("Login failed: No user returned");
      }

      // Check the user's role in rc_users table
      const { data: userData, error: roleError } = await supabase
        .from("rc_users")
        .select("role")
        .eq("auth_user_id", authData.user.id)
        .maybeSingle();

      if (roleError) {
        throw new Error(`Failed to verify user role: ${roleError.message}`);
      }

      if (!userData || !userData.role) {
        // Sign out the user since they don't have a role
        await supabase.auth.signOut();
        throw new Error("User account not found. Please contact your administrator.");
      }

      // Check if role is 'rn' or 'rn_cm' (case-insensitive)
      const userRole = userData.role.toLowerCase();
      const isRN = userRole === "rn_cm" || userRole === "rn";

      if (!isRN) {
        // Sign out the user since they're not an RN
        await supabase.auth.signOut();
        throw new Error("This portal is for RN staff only. Please contact support if you need access.");
      }

      // Success! Show success animation briefly before redirect
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/rn-console';
      }, 1000);
    } catch (err: any) {
      console.error("RNPortalLogin: Error:", err);
      setError(err.message || "Login failed. Please check your credentials and try again.");
      setLoading(false);
    }
  }

  // Extract gradient colors for CSS (including the new pink accent)
  const gradientColors = theme.background.match(/#[0-9a-fA-F]{6}/g) || [];
  const primaryColor = gradientColors[0] || theme.primary;
  const secondaryColor = gradientColors[1] || theme.secondary;
  const accentColor = gradientColors[2] || theme.accent;
  const pinkAccent = gradientColors[3] || '#f5d0fe'; // Soft Pink

  // Convert hex to rgba for border colors (Soft Purple #8b5cf6 = rgb(139, 92, 246))
  const primaryRgba = 'rgba(139, 92, 246, 0.2)'; // 20% opacity

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden"
      style={{
        background: theme.background,
        transition: 'background 0.3s ease',
      }}
    >
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute rounded-full opacity-15 blur-3xl animate-pulse"
          style={{
            width: '400px',
            height: '400px',
            background: primaryColor,
            top: '-100px',
            left: '-100px',
            animation: 'float 6s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute rounded-full opacity-15 blur-3xl animate-pulse"
          style={{
            width: '300px',
            height: '300px',
            background: secondaryColor,
            bottom: '-50px',
            right: '-50px',
            animation: 'float 8s ease-in-out infinite',
            animationDelay: '1s',
          }}
        />
        <div 
          className="absolute rounded-full opacity-12 blur-3xl"
          style={{
            width: '250px',
            height: '250px',
            background: accentColor,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'float 10s ease-in-out infinite',
            animationDelay: '2s',
          }}
        />
        <div 
          className="absolute rounded-full opacity-10 blur-3xl"
          style={{
            width: '200px',
            height: '200px',
            background: pinkAccent,
            top: '20%',
            right: '20%',
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '3s',
          }}
        />
      </div>

      {/* Header Section */}
      <div 
        className={`text-center mb-8 z-10 transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
          Reconcile <span style={{ color: theme.accent }}>C.A.R.E.</span>
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
          Welcome Back! 👋
        </h2>
        <p className="text-lg text-white/90 mb-1">
          RN Case Management Portal
        </p>
        <p className="text-sm text-white/70 italic">
          Empowering nurses. Transforming care.
        </p>
      </div>

      {/* Login Card */}
      <div 
        className={`w-full max-w-md z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div 
          className="bg-white rounded-[20px] p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Gradient top border */}
          <div 
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: theme.cardBorder,
            }}
          />
          {/* Sparkle effect on success */}
          {success && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-20 rounded-[20px]">
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: theme.primary }} />
                <p className="text-lg font-semibold" style={{ color: theme.primary }}>
                  Signing you in...
                </p>
              </div>
            </div>
          )}

          <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: theme.primary }}>
            Sign In
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all focus-visible:ring-2 focus-visible:ring-opacity-20"
                  style={{
                    borderColor: primaryRgba,
                  }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  disabled={loading || success}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border-2 transition-all focus-visible:ring-2 focus-visible:ring-opacity-20"
                  style={{
                    borderColor: primaryRgba,
                  }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading || success}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="p-4 rounded-xl border-2 text-sm"
                style={{
                  backgroundColor: '#fef2f2',
                  borderColor: '#fecaca',
                  color: '#991b1b',
                }}
              >
                {error}
              </div>
            )}

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={loading || success}
              className="w-full py-6 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              style={{
                backgroundColor: theme.primary,
                color: 'white',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Signing you in...
                </span>
              ) : success ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Success!
                </span>
              ) : (
                'Sign In'
              )}
              {/* Button glow effect */}
              {!loading && !success && (
                <span 
                  className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 blur-xl"
                  style={{
                    background: theme.primary,
                  }}
                />
              )}
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                className="text-sm hover:underline transition-colors"
                style={{ color: theme.primary }}
                disabled={loading || success}
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer Section */}
      <div 
        className={`mt-8 text-center z-10 transition-opacity duration-1000 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      >
        <p className="text-sm text-white/80 mb-2">
          Need help? Contact{" "}
          <a 
            href="mailto:support@reconcilecare.com" 
            className="underline hover:text-white transition-colors"
          >
            support@reconcilecare.com
          </a>
        </p>
        <p className="text-xs text-white/60 mb-1">
          © 2026 Reconcile C.A.R.E. All rights reserved.
        </p>
        <p className="text-xs text-white/60">
          Authorized access only
        </p>
      </div>

      {/* CSS Animations and Styles */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(20px, -20px) scale(1.1);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        /* Custom focus ring color for inputs */
        input:focus-visible {
          --tw-ring-color: rgba(139, 92, 246, 0.25);
        }
      `}</style>
    </div>
  );
}
