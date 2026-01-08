/**
 * RoleGuard Component
 * 
 * Protects routes by checking if the authenticated user has the required role.
 * Redirects to home with error message if role doesn't match.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/supabaseAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RoleGuardProps {
  requiredRole: string; // e.g., 'attorney', 'client', 'provider'
  children: React.ReactNode;
  redirectTo?: string; // Default: '/'
  showError?: boolean; // Show error message before redirect
}

export function RoleGuard({ 
  requiredRole, 
  children, 
  redirectTo = '/',
  showError = true 
}: RoleGuardProps) {
  const { user, loading, roles, primaryRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to load
    if (loading) return;

    // If not authenticated, redirect to access page
    if (!user) {
      navigate('/access', { replace: true });
      return;
    }

    // Check if user has the required role
    const hasRole = roles.some(role => 
      role.toUpperCase() === requiredRole.toUpperCase()
    ) || primaryRole?.toUpperCase() === requiredRole.toUpperCase();

    if (!hasRole) {
      // Show error briefly, then redirect
      if (showError) {
        // Store error message in sessionStorage for display on redirect page
        sessionStorage.setItem(
          'roleError',
          `Access denied: This page requires ${requiredRole} role. Your current role: ${primaryRole || 'unknown'}`
        );
      }
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, roles, primaryRole, requiredRole, navigate, redirectTo, showError]);

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading...</div>
    );
  }

  // Show error if not authenticated
  if (!user) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check role
  const hasRole = roles.some(role => 
    role.toUpperCase() === requiredRole.toUpperCase()
  ) || primaryRole?.toUpperCase() === requiredRole.toUpperCase();

  if (!hasRole) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied: This page requires {requiredRole} role. Your current role: {primaryRole || 'unknown'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // User has correct role, render children
  return <>{children}</>;
}
