// HIPAA Minimally Necessary access control utilities
import { toast } from "@/hooks/use-toast";
import { canAccess, type Role, type Feature, type RcmsCase, type User } from "./access";

/**
 * Shows a HIPAA Minimally Necessary access denied message
 */
export function showHIPAAAccessDenied() {
  toast({
    title: "Access Restricted",
    description: "Your role does not allow you access to this information: HIPAA Minimally Necessary rule in effect",
    variant: "destructive",
    duration: 5000,
  });
}

/**
 * Checks access and shows HIPAA message if denied
 * Returns true if access is granted, false if denied (and shows message)
 */
export function checkHIPAAAccess(
  role: Role,
  theCase: RcmsCase,
  feature: Feature,
  user?: User
): boolean {
  const hasAccess = canAccess(role, theCase, feature, user);
  
  if (!hasAccess) {
    showHIPAAAccessDenied();
  }
  
  return hasAccess;
}

/**
 * Higher-order function to wrap click handlers with HIPAA access check
 */
export function withHIPAACheck<T extends (...args: any[]) => any>(
  role: Role,
  theCase: RcmsCase,
  feature: Feature,
  callback: T,
  user?: User
): T {
  return ((...args: any[]) => {
    if (checkHIPAAAccess(role, theCase, feature, user)) {
      return callback(...args);
    }
    return undefined;
  }) as T;
}
