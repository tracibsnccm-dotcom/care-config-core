import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppRole = 'CLIENT' | 'ATTORNEY' | 'PROVIDER' | 'RN_CCM' | 'SUPER_USER' | 'SUPER_ADMIN';

interface ProtectedRouteProps {
  roles: AppRole[];
  children: React.ReactNode;
}

export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { user, roles: userRoles, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/access" replace />;
  }

  const hasRequiredRole = roles.some(role => userRoles.includes(role));

  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-lg w-full text-center space-y-6">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              <strong>Access Restricted:</strong> You don't have permission to view this page.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Authorization Required</h1>
            <p className="text-muted-foreground">
              This area is limited to authorized users with specific roles.
              {userRoles.length > 0 && (
                <>
                  <br />
                  Your current role(s): {userRoles.join(", ")}
                </>
              )}
            </p>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button asChild>
              <a href="/">Home</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
