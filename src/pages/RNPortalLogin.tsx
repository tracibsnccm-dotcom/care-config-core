import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RNPortalLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Purple/Lilac/Pink Color Palette
  const colors = {
    deepPurple: '#6d28d9',
    mediumPurple: '#8b5cf6',
    lilac: '#a78bfa',
    lightLavender: '#c4b5fd',
    softPink: '#e879f9',
    lightPink: '#f0abfc',
    paleLavender: '#ede9fe',
  };

  // Fade-in animation on mount
  useEffect(() => {
    setMounted(true);
    isMountedRef.current = true;
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('RNPortalLogin: ========== Login attempt started ==========');
    setLoading(true);
    setError(null);
    setSuccess(false);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      console.log('RNPortalLogin: Validation failed - missing email or password');
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Set up timeout to prevent infinite spinning
    timeoutRef.current = setTimeout(() => {
      console.error('RNPortalLogin: Login timeout after 10 seconds');
      if (isMountedRef.current) {
        setError("Login timed out. Please try again.");
        setLoading(false);
        setSuccess(false);
      }
      timeoutRef.current = null;
    }, 10000);

    // Clear any existing timeout on component unmount
    const cleanup = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    try {
      // Sign in with email and password
      console.log('RNPortalLogin: Calling signInWithPassword with email:', trimmedEmail);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      console.log('RNPortalLogin: signInWithPassword result:', {
        hasData: !!authData,
        hasUser: !!authData?.user,
        hasSession: !!authData?.session,
        userId: authData?.user?.id,
        error: authError
      });

      if (authError) {
        console.error('RNPortalLogin: signInWithPassword error:', authError);
        cleanup();
        setError(authError.message || "Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      if (!authData || !authData.user) {
        console.error('RNPortalLogin: No user returned from signInWithPassword');
        cleanup();
        setError("Login failed: No user returned. Please try again.");
        setLoading(false);
        return;
      }

      // Check the user's role in rc_users table
      console.log('RNPortalLogin: Checking rc_users for role, auth_user_id:', authData.user.id);
      const { data: userData, error: roleError } = await supabase
        .from("rc_users")
        .select("role")
        .eq("auth_user_id", authData.user.id)
        .maybeSingle();

      console.log('RNPortalLogin: rc_users query result:', {
        hasData: !!userData,
        role: userData?.role,
        error: roleError
      });

      if (roleError) {
        console.error('RNPortalLogin: rc_users query error:', roleError);
        cleanup();
        setError(`Failed to verify user role: ${roleError.message}`);
        setLoading(false);
        return;
      }

      if (!userData || !userData.role) {
        console.error('RNPortalLogin: No role found for user');
        // Sign out the user since they don't have a role
        await supabase.auth.signOut();
        cleanup();
        setError("User account not found. Please contact your administrator.");
        setLoading(false);
        return;
      }

      // Check if role is 'rn' or 'rn_cm' (case-insensitive)
      const userRole = userData.role.toLowerCase();
      const isRN = userRole === "rn_cm" || userRole === "rn";
      console.log('RNPortalLogin: Role check:', { userRole, isRN });

      if (!isRN) {
        console.error('RNPortalLogin: User is not an RN, role:', userRole);
        // Sign out the user since they're not an RN
        await supabase.auth.signOut();
        cleanup();
        setError("This portal is for RN staff only. Please contact support if you need access.");
        setLoading(false);
        return;
      }

      // Verify session is present
      if (!authData.session) {
        console.error('RNPortalLogin: No session in authData');
        cleanup();
        setError("Login failed: No session created. Please try again.");
        setLoading(false);
        return;
      }

      console.log('RNPortalLogin: Login successful, session created:', !!authData.session);
      console.log('RNPortalLogin: User ID:', authData.user.id);

      // Give Supabase a moment to persist the session to storage
      console.log('RNPortalLogin: Waiting 500ms for session persistence...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify session is stored and accessible
      console.log('RNPortalLogin: Checking session storage...');
      const { data: sessionCheck, error: sessionError } = await supabase.auth.getSession();
      console.log('RNPortalLogin: Session check after delay:', {
        hasSession: !!sessionCheck?.session,
        userId: sessionCheck?.session?.user?.id,
        error: sessionError
      });

      if (sessionError) {
        console.error('RNPortalLogin: Session check error:', sessionError);
        cleanup();
        setError("Failed to verify session. Please try again.");
        setLoading(false);
        return;
      }

      if (!sessionCheck?.session) {
        console.error('RNPortalLogin: Session not found after login');
        cleanup();
        setError("Session not persisted. Please try again.");
        setLoading(false);
        return;
      }

      // Clear timeout since we're about to redirect
      cleanup();

      // Success! Show success animation briefly before redirect
      console.log('RNPortalLogin: ========== Login successful, preparing redirect ==========');
      setSuccess(true);
      setLoading(false); // Clear loading since we're showing success state
      
      // Wait a bit more to ensure session is fully persisted, then redirect
      setTimeout(() => {
        console.log('RNPortalLogin: Redirecting to /rn-console');
        navigate('/rn-console', { replace: true });
      }, 800);
    } catch (err: any) {
      console.error("RNPortalLogin: Unexpected error caught:", err);
      console.error("RNPortalLogin: Error stack:", err?.stack);
      cleanup();
      setError(err?.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
      setSuccess(false);
    }
  }

  // Beautiful flowing gradient background
  const backgroundGradient = 'linear-gradient(160deg, #6d28d9 0%, #8b5cf6 30%, #c4b5fd 60%, #f0abfc 100%)';
  
  // Button gradient - more pink-forward
  const buttonGradient = 'linear-gradient(90deg, #a78bfa, #e879f9, #f0abfc)';
  const buttonGradientHover = 'linear-gradient(90deg, #8b5cf6, #d946ef, #e879f9)';
  
  // Card border gradient
  const cardBorderGradient = 'linear-gradient(90deg, #6d28d9, #8b5cf6, #c4b5fd, #e879f9)';

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden"
      style={{
        background: backgroundGradient,
        transition: 'background 0.3s ease',
      }}
    >
      {/* Animated background shapes - fluid purple/pink blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large deep purple blob */}
        <div 
          className="absolute rounded-full opacity-12 blur-[120px]"
          style={{
            width: '500px',
            height: '500px',
            background: colors.deepPurple,
            top: '-150px',
            left: '-150px',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        {/* Medium purple blob */}
        <div 
          className="absolute rounded-full opacity-15 blur-[100px]"
          style={{
            width: '450px',
            height: '450px',
            background: colors.mediumPurple,
            bottom: '-100px',
            right: '-100px',
            animation: 'float 10s ease-in-out infinite',
            animationDelay: '1.5s',
          }}
        />
        {/* Lilac blob */}
        <div 
          className="absolute rounded-full opacity-12 blur-[90px]"
          style={{
            width: '400px',
            height: '400px',
            background: colors.lilac,
            top: '30%',
            left: '10%',
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '2s',
          }}
        />
        {/* Soft pink blob */}
        <div 
          className="absolute rounded-full opacity-10 blur-[80px]"
          style={{
            width: '350px',
            height: '350px',
            background: colors.softPink,
            top: '60%',
            right: '15%',
            animation: 'float 9s ease-in-out infinite',
            animationDelay: '3s',
          }}
        />
        {/* Light lavender blob */}
        <div 
          className="absolute rounded-full opacity-8 blur-[70px]"
          style={{
            width: '300px',
            height: '300px',
            background: colors.lightLavender,
            bottom: '20%',
            left: '20%',
            animation: 'float 11s ease-in-out infinite',
            animationDelay: '4s',
          }}
        />
        {/* Light pink accent */}
        <div 
          className="absolute rounded-full opacity-8 blur-[60px]"
          style={{
            width: '250px',
            height: '250px',
            background: colors.lightPink,
            top: '10%',
            right: '30%',
            animation: 'float 7s ease-in-out infinite',
            animationDelay: '5s',
          }}
        />
      </div>

      {/* Header Section */}
      <div 
        className={`text-center mb-8 z-10 transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">
          Reconcile <span style={{ color: colors.softPink }}>C.A.R.E.</span>
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2 drop-shadow-md">
          Welcome Back! 👋
        </h2>
        <p className="text-lg text-white/95 mb-1 drop-shadow-sm">
          RN Case Management Portal
        </p>
        <p className="text-sm text-white/80 italic">
          Empowering nurses. Transforming care.
        </p>
      </div>

      {/* Login Card */}
      <div 
        className={`w-full max-w-md z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div 
          className="rounded-[20px] p-8 relative overflow-hidden backdrop-blur-sm"
          style={{
            backgroundColor: '#faf5ff',
            boxShadow: '0 20px 60px rgba(109, 40, 217, 0.15), 0 0 0 1px rgba(139, 92, 246, 0.1)',
          }}
        >
          {/* Gradient top border */}
          <div 
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{
              background: cardBorderGradient,
            }}
          />
          {/* Sparkle effect on success */}
          {success && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#faf5ff]/95 z-20 rounded-[20px] backdrop-blur-sm">
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: colors.softPink }} />
                <p className="text-lg font-semibold" style={{ color: colors.softPink }}>
                  Signing you in...
                </p>
              </div>
            </div>
          )}

          <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: colors.softPink }}>
            Sign In
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors" style={{ color: 'rgba(232, 121, 249, 0.6)' }} />
                <Input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all focus-visible:ring-2 focus-visible:ring-opacity-30"
                  style={{
                    borderColor: 'rgba(139, 92, 246, 0.2)',
                    backgroundColor: 'white',
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
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors" style={{ color: 'rgba(232, 121, 249, 0.6)' }} />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border-2 transition-all focus-visible:ring-2 focus-visible:ring-opacity-30"
                  style={{
                    borderColor: 'rgba(139, 92, 246, 0.2)',
                    backgroundColor: 'white',
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
              className="w-full py-6 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden text-white border-0"
              style={{
                background: loading || success ? colors.softPink : buttonGradient,
                boxShadow: '0 4px 15px rgba(232, 121, 249, 0.4)',
              }}
              onMouseEnter={(e) => {
                if (!loading && !success) {
                  e.currentTarget.style.background = buttonGradientHover;
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(232, 121, 249, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && !success) {
                  e.currentTarget.style.background = buttonGradient;
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(232, 121, 249, 0.4)';
                }
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
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                className="text-sm hover:underline transition-colors font-medium"
                style={{ color: colors.softPink }}
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
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          33% {
            transform: translate(30px, -30px) scale(1.05) rotate(2deg);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.95) rotate(-2deg);
          }
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        /* Custom focus ring color for inputs - purple glow */
        input:focus-visible {
          --tw-ring-color: rgba(139, 92, 246, 0.3);
          border-color: rgba(139, 92, 246, 0.5) !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2), 0 0 20px rgba(139, 92, 246, 0.15);
        }
      `}</style>
    </div>
  );
}
