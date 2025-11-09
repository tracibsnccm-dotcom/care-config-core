import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/auth/supabaseAuth";

interface LogoutButtonProps {
  className?: string;
  variant?: any;
  size?: any;
  iconOnly?: boolean; // render just the icon (for compact header/sidebar)
  showText?: boolean; // when false, don't render text
}

/**
 * Reusable Logout button — navigates to /logout which runs the actual signOut.
 * Renders nothing when no user is present.
 */
export default function LogoutButton({
  className,
  variant = "ghost",
  size = "icon",
  iconOnly = false,
  showText = true,
}: LogoutButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={iconOnly ? "icon" : size}
            onClick={() => navigate("/logout")}
            className={className}
            aria-label="Sign Out"
          >
            <LogOut className={iconOnly ? "w-5 h-5" : "w-4 h-4 mr-2"} />
            {!iconOnly && showText && "Sign Out"}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={iconOnly ? "bottom" : "right"}>Sign Out</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
