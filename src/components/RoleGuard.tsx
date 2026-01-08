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
  console.log(`RoleGuard[${requiredRole}]: Roles array:`, roles);
  console.log(`RoleGuard[${requiredRole}]: PrimaryRole:`, primaryRole);
  console.log(`RoleGuard[${requiredRole}]: Required role (lowercase):`, requiredRole.toLowerCase());
  console.log(`RoleGuard[${requiredRole}]: Required role (uppercase):`, requiredRole.toUpperCase());
  
  // Show detailed comparison
  if (roles && roles.length > 0) {
    console.log(`RoleGuard[${requiredRole}]: Comparing roles array:`, roles.map(r => ({
      original: r,
      uppercase: r.toUpperCase(),
      matches: r.toUpperCase() === requiredRole.toUpperCase()
    })));
  }
  if (primaryRole) {
    console.log(`RoleGuard[${requiredRole}]: Comparing primaryRole:`, {
      original: primaryRole,
      uppercase: primaryRole.toUpperCase(),
      requiredUppercase: requiredRole.toUpperCase(),
      matches: primaryRole.toUpperCase() === requiredRole.toUpperCase()
    });
  }

  useEffect(() => {
    console.log(`RoleGuard[${requiredRole}]: useEffect triggered - loading:`, loading, 'user:', !!user, 'roles:', roles, 'primaryRole:', primaryRole);
    
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

    // Wait for roles to be loaded (roles array might be empty initially)
    // If roles is empty and primaryRole is null, wait a bit more
    if (roles.length === 0 && !primaryRole) {
      console.log(`RoleGuard[${requiredRole}]: Roles not loaded yet (empty array, no primaryRole), waiting...`);
      // Don't redirect yet - roles might still be loading
      return;
    }

    // Check if user has the required role
    // Note: roles come from supabaseAuth as uppercase (e.g., 'ATTORNEY'), 
    // but requiredRole is lowercase (e.g., 'attorney')
    // We compare case-insensitively
    const requiredUpper = requiredRole.toUpperCase();
    console.log(`RoleGuard[${requiredRole}]: Comparing against required role (uppercase):`, requiredUpper);
    
    const rolesMatch = roles.some(role => {
      const roleUpper = role.toUpperCase();
      const matches = roleUpper === requiredUpper;
      console.log(`RoleGuard[${requiredRole}]: Checking role "${role}" (${roleUpper}) === "${requiredRole}" (${requiredUpper}):`, matches);
      return matches;
    });
    
    const primaryRoleMatch = primaryRole ? (() => {
      const primaryUpper = primaryRole.toUpperCase();
      const matches = primaryUpper === requiredUpper;
      console.log(`RoleGuard[${requiredRole}]: Checking primaryRole "${primaryRole}" (${primaryUpper}) === "${requiredRole}" (${requiredUpper}):`, matches);
      return matches;
    })() : false;
    
    const hasRole = rolesMatch || primaryRoleMatch;

    console.log(`RoleGuard[${requiredRole}]: Final role check result:`, {
      rolesMatch,
      primaryRoleMatch,
      hasRole,
      rolesArray: roles,
      primaryRole,
      requiredRole,
      requiredUpper
    });

    if (!hasRole) {
      console.log(`RoleGuard[${requiredRole}]: Access denied - redirecting to`, redirectTo);
      console.log(`RoleGuard[${requiredRole}]: DEBUG - roles array:`, JSON.stringify(roles));
      console.log(`RoleGuard[${requiredRole}]: DEBUG - primaryRole:`, primaryRole);
      console.log(`RoleGuard[${requiredRole}]: DEBUG - requiredRole:`, requiredRole);
      // Show error briefly, then redirect
      if (showError) {
        // Store error message in sessionStorage for display on redirect page
        sessionStorage.setItem(
          'roleError',
          `Access denied: This page requires ${requiredRole} role. Your current role: ${primaryRole || 'unknown'}. Roles array: ${JSON.stringify(roles)}`
        );
      }
      navigate(redirectTo, { replace: true });
    } else {
      console.log(`RoleGuard[${requiredRole}]: Access granted - user has required role`);
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

  // Check role (same logic as in useEffect)
  const rolesMatch = roles.some(role => {
    const roleUpper = role.toUpperCase();
    const requiredUpper = requiredRole.toUpperCase();
    const matches = roleUpper === requiredUpper;
    console.log(`RoleGuard[${requiredRole}]: Render - Checking role "${role}" (${roleUpper}) === "${requiredRole}" (${requiredUpper}):`, matches);
    return matches;
  });
  
  const primaryRoleMatch = primaryRole ? (() => {
    const primaryUpper = primaryRole.toUpperCase();
    const requiredUpper = requiredRole.toUpperCase();
    const matches = primaryUpper === requiredUpper;
    console.log(`RoleGuard[${requiredRole}]: Render - Checking primaryRole "${primaryRole}" (${primaryUpper}) === "${requiredRole}" (${requiredUpper}):`, matches);
    return matches;
  })() : false;
  
  const hasRole = rolesMatch || primaryRoleMatch;

  console.log(`RoleGuard[${requiredRole}]: Render check - hasRole:`, hasRole, {
    rolesMatch,
    primaryRoleMatch,
    rolesArray: roles,
    primaryRole
  });

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
