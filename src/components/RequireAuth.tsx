import { ReactNode } from 'react';
import { useAuth } from '@/auth/supabaseAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Minimal auth gate wrapper for route-level protection.
 * Blocks unauthenticated access and shows sign-in prompt.
 * Attorneys are redirected to /attorney-login, others to /auth.
 * Does NOT block on rolesLoading - if user exists, allow rendering and let pages handle authorization.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { user, authLoading, rolesLoading } = useAuth();
  console.log('=== RequireAuth: authLoading =', authLoading, 'rolesLoading =', rolesLoading, 'user =', !!user);
  const navigate = useNavigate();
  const location = useLocation();

  // Show nothing while checking auth (but NOT while loading roles if user exists)
  if (authLoading) {
    console.log('=== RequireAuth: Returning loading state (authLoading) ===');
    return (
      <div className="min-h-screen bg-rcms-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Block if not authenticated
  if (!user) {
    console.log('=== RequireAuth: User not authenticated ===');
    // Determine redirect based on pathname
    // Attorney routes go to /attorney-login, RN routes go to /rn-login, others go to /auth
    const isAttorneyRoute = location.pathname.includes('attorney');
    const isRNRoute = location.pathname.includes('rn-console') || location.pathname.includes('rn-portal') || location.pathname.includes('rn/dashboard') || location.pathname.includes('rn-supervisor');
    const loginUrl = isAttorneyRoute 
      ? '/attorney-login' 
      : isRNRoute
      ? '/rn-login'
      : '/auth?redirect=/client-portal';

    return (
      <div className="min-h-screen bg-rcms-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Authentication Required</h2>
            </div>
            <p className="text-muted-foreground">
              Please sign in to continue.
            </p>
            <Button
              onClick={() => window.location.assign(loginUrl)}
              className="w-full"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated - allow rendering even if roles are still loading
  // Pages can handle their own authorization checks
  if (rolesLoading) {
    console.log('=== RequireAuth: User authenticated but rolesLoading, showing warning but allowing render ===');
    // Optionally show a non-blocking warning, but still render children
    return (
      <>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <Alert>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Loading user roles...</AlertTitle>
            <AlertDescription className="text-yellow-700">
              User roles are being loaded. Some features may be unavailable until roles are loaded.
            </AlertDescription>
          </Alert>
        </div>
        {children}
      </>
    );
  }

  // User is authenticated and roles are loaded, render children
  console.log('=== RequireAuth: Rendering children ===');
  return <>{children}</>;
}
