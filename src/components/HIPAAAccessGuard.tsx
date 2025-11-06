import { ReactNode } from "react";
import { Shield } from "lucide-react";
import { showHIPAAAccessDenied } from "@/lib/hipaaAccessControl";
import { canAccess, type Role, type Feature, type RcmsCase, type User } from "@/lib/access";
import { cn } from "@/lib/utils";

interface HIPAAAccessGuardProps {
  role: Role;
  theCase: RcmsCase;
  feature: Feature;
  user?: User;
  children: ReactNode;
  fallback?: ReactNode;
  showRestricted?: boolean; // Show a restricted overlay instead of hiding
  className?: string;
}

/**
 * Wraps content that requires HIPAA access control
 * Shows children if access is granted, shows fallback or blocked UI if not
 */
export function HIPAAAccessGuard({
  role,
  theCase,
  feature,
  user,
  children,
  fallback,
  showRestricted = false,
  className,
}: HIPAAAccessGuardProps) {
  const hasAccess = canAccess(role, theCase, feature, user);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showRestricted) {
    return (
      <div
        className={cn(
          "relative cursor-not-allowed opacity-50",
          className
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          showHIPAAAccessDenied();
        }}
      >
        <div className="pointer-events-none blur-sm select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-medium">Restricted Access</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Wraps clickable elements to show HIPAA message on unauthorized clicks
 */
interface HIPAAClickGuardProps {
  role: Role;
  theCase: RcmsCase;
  feature: Feature;
  user?: User;
  children: (props: { onClick: (e: React.MouseEvent) => void; disabled?: boolean }) => ReactNode;
  onAuthorizedClick?: (e: React.MouseEvent) => void;
}

export function HIPAAClickGuard({
  role,
  theCase,
  feature,
  user,
  children,
  onAuthorizedClick,
}: HIPAAClickGuardProps) {
  const hasAccess = canAccess(role, theCase, feature, user);

  const handleClick = (e: React.MouseEvent) => {
    if (!hasAccess) {
      e.preventDefault();
      e.stopPropagation();
      showHIPAAAccessDenied();
      return;
    }
    
    if (onAuthorizedClick) {
      onAuthorizedClick(e);
    }
  };

  return <>{children({ onClick: handleClick, disabled: !hasAccess })}</>;
}
