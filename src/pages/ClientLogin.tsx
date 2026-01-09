import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseGet, supabaseUpdate } from "@/lib/supabaseRest";
import { RCMS, btn } from "../constants/brand";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export default function ClientLogin() {
  const [caseNumber, setCaseNumber] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLockedUntil(null);

    const trimmedCaseNumber = caseNumber.trim().toUpperCase();
    const trimmedPin = pin.trim();

    if (!trimmedCaseNumber || !trimmedPin) {
      setError("Please enter both case number and PIN");
      setLoading(false);
      return;
    }

    try {
      // Look up case by case_number (URL encode the case number for the query)
      const encodedCaseNumber = encodeURIComponent(trimmedCaseNumber);
      const { data: cases, error: casesError } = await supabaseGet(
        'rc_cases',
        `select=id,client_id,client_pin,pin_failed_attempts,pin_locked_until&case_number=eq.${encodedCaseNumber}&limit=1`
      );

      if (casesError) {
        throw new Error(`Failed to look up case: ${casesError.message}`);
      }

      const caseData = Array.isArray(cases) ? cases[0] : cases;

      if (!caseData) {
        setError("Invalid case number. Please check and try again.");
        setLoading(false);
        return;
      }

      // Check if account is locked
      if (caseData.pin_locked_until) {
        const lockedUntilDate = new Date(caseData.pin_locked_until);
        if (lockedUntilDate > new Date()) {
          setLockedUntil(lockedUntilDate);
          setError(`Account is locked due to too many failed attempts. Please try again after ${lockedUntilDate.toLocaleString()}`);
          setLoading(false);
          return;
        } else {
          // Lock expired, reset it
          await supabaseUpdate('rc_cases', `id=eq.${caseData.id}`, {
            pin_failed_attempts: 0,
            pin_locked_until: null,
          });
        }
      }

      // Verify PIN (currently stored as plaintext - TODO: hash comparison)
      const storedPin = caseData.client_pin;
      if (!storedPin) {
        setError("PIN not set for this case. Please contact your attorney.");
        setLoading(false);
        return;
      }

      if (trimmedPin !== storedPin) {
        // Increment failed attempts
        const currentAttempts = caseData.pin_failed_attempts || 0;
        const newAttempts = currentAttempts + 1;
        const remainingAttempts = 3 - newAttempts;

        if (newAttempts >= 3) {
          // Lock account for 24 hours
          const lockUntil = new Date();
          lockUntil.setHours(lockUntil.getHours() + 24);
          
          await supabaseUpdate('rc_cases', `id=eq.${caseData.id}`, {
            pin_failed_attempts: newAttempts,
            pin_locked_until: lockUntil.toISOString(),
          });

          setLockedUntil(lockUntil);
          setError(`Incorrect PIN. Account locked due to too many failed attempts. Please try again after ${lockUntil.toLocaleString()}`);
          
          // TODO: Notify attorney about lockout
        } else {
          await supabaseUpdate('rc_cases', `id=eq.${caseData.id}`, {
            pin_failed_attempts: newAttempts,
          });

          setError(`Incorrect PIN. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining before account is locked.`);
        }
        
        setLoading(false);
        return;
      }

      // PIN is correct - reset failed attempts
      await supabaseUpdate('rc_cases', `id=eq.${caseData.id}`, {
        pin_failed_attempts: 0,
        pin_locked_until: null,
      });

      // Store case_id in sessionStorage for client identification
      // TODO: Implement proper Supabase auth session for client
      sessionStorage.setItem('client_case_id', caseData.id);
      sessionStorage.setItem('client_case_number', trimmedCaseNumber);

      // Redirect to client portal
      navigate('/client-portal', { replace: true });
    } catch (err: any) {
      console.error('Client login error:', err);
      setError(err.message || 'An error occurred during login. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold" style={{color: RCMS.brandNavy}}>
          Client Portal Login
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your case number and PIN to access your portal.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Case Number
              </label>
              <input
                type="text"
                required
                placeholder="01-260108-01F"
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 outline-none focus:border-ring font-mono uppercase"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value.toUpperCase())}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Format: XX-YYMMDD-XXL (e.g., 01-260108-01F)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                PIN
              </label>
              <input
                type="password"
                required
                placeholder="1234"
                maxLength={4}
                pattern="[0-9]{4}"
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 outline-none focus:border-ring font-mono text-center text-lg tracking-widest"
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(value);
                }}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                4-digit PIN provided by your attorney
              </p>
            </div>

            {error && (
              <Alert variant={lockedUntil ? "destructive" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {lockedUntil && (
              <Alert variant="destructive">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Account locked until {lockedUntil.toLocaleString()}. 
                  Please contact your attorney if you need immediate access.
                </AlertDescription>
              </Alert>
            )}

            <button
              type="submit"
              disabled={loading || !!lockedUntil}
              className={`${btn.base} ${btn.lg} text-white w-full`}
              style={{ 
                backgroundColor: loading || lockedUntil ? "#9ca3af" : RCMS.brandNavy,
                cursor: loading || lockedUntil ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Verifying..." : "Access My Portal"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              Are you an attorney?{" "}
              <Link 
                to="/attorney-login" 
                className="text-primary hover:underline font-semibold"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground text-center">
          By accessing your portal, you agree to RCMS's Minimum Necessary Data Policy and Terms.
        </p>
      </div>
    </div>
  );
}
