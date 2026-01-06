import { ReactNode } from 'react';
import { useAuth } from '@/auth/supabaseAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Minimal auth gate wrapper for route-level protection.
 * Blocks unauthenticated access and shows sign-in prompt.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Show nothing while checking auth
  if (loading) {
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
              onClick={() => window.location.assign('/auth?redirect=/client-portal')}
              className="w-full"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}