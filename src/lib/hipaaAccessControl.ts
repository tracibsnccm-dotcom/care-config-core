// HIPAA Minimally Necessary access control utilities
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { canAccess, type Role, type Feature, type RcmsCase, type User } from "./access";

/**
 * Logs HIPAA access attempt to database
 */
async function logAccessAttempt(
  role: Role,
  caseId: string | undefined,
  feature: Feature,
  accessGranted: boolean,
  user?: User
) {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) return;

    await supabase.from("hipaa_access_attempts").insert({
      user_id: authUser.id,
      user_role: role,
      case_id: caseId || null,
      feature_attempted: feature,
      access_granted: accessGranted,
      metadata: {
        user_org_type: user?.orgType,
        user_org_id: user?.orgId,
        elevated_access: user?.elevatedAccess,
      },
    });
  } catch (error) {
    console.error("Failed to log HIPAA access attempt:", error);
  }
}

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
 * Logs all access attempts to the database
 */
export function checkHIPAAAccess(
  role: Role,
  theCase: RcmsCase,
  feature: Feature,
  user?: User
): boolean {
  const hasAccess = canAccess(role, theCase, feature, user);
  
  // Log the access attempt (both granted and denied)
  logAccessAttempt(role, theCase.id, feature, hasAccess, user);
  
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
