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

  console.log(`RoleGuard[${requiredRole}]: Starting role check`);
  console.log(`RoleGuard[${requiredRole}]: Loading:`, loading);
  console.log(`RoleGuard[${requiredRole}]: User:`, user);
  console.log(`RoleGuard[${requiredRole}]: Roles:`, roles);
  console.log(`RoleGuard[${requiredRole}]: PrimaryRole:`, primaryRole);

  useEffect(() => {
    console.log(`RoleGuard[${requiredRole}]: useEffect triggered - loading:`, loading, 'user:', !!user);
    
    // Wait for auth to load
    if (loading) {
      console.log(`RoleGuard[${requiredRole}]: Still loading auth, waiting...`);
      return;
    }

    // If not authenticated, redirect to access page
    if (!user) {
      console.log(`RoleGuard[${requiredRole}]: No user, redirecting to /access`);
      navigate('/access', { replace: true });
      return;
    }

    // Check if user has the required role
    const hasRole = roles.some(role => 
      role.toUpperCase() === requiredRole.toUpperCase()
    ) || primaryRole?.toUpperCase() === requiredRole.toUpperCase();

    console.log(`RoleGuard[${requiredRole}]: Has role check - roles:`, roles, 'primaryRole:', primaryRole, 'hasRole:', hasRole);

    if (!hasRole) {
      console.log(`RoleGuard[${requiredRole}]: Access denied - redirecting to`, redirectTo);
      // Show error briefly, then redirect
      if (showError) {
        // Store error message in sessionStorage for display on redirect page
        sessionStorage.setItem(
          'roleError',
          `Access denied: This page requires ${requiredRole} role. Your current role: ${primaryRole || 'unknown'}`
        );
      }
      navigate(redirectTo, { replace: true });
    } else {
      console.log(`RoleGuard[${requiredRole}]: Access granted`);
    }
  }, [user, loading, roles, primaryRole, requiredRole, navigate, redirectTo, showError]);

  // Show loading state
  if (loading) {
    console.log(`RoleGuard[${requiredRole}]: Rendering loading state`);
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading...</div>
    );
  }

  // Show error if not authenticated
  if (!user) {
    console.log(`RoleGuard[${requiredRole}]: Rendering no user error`);
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

  console.log(`RoleGuard[${requiredRole}]: Render check - hasRole:`, hasRole);

  if (!hasRole) {
    console.log(`RoleGuard[${requiredRole}]: Rendering access denied`);
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
  console.log(`RoleGuard[${requiredRole}]: Rendering children`);
  return <>{children}</>;
}
