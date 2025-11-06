import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { assignRole, removeRole } from "@/lib/roleOperations";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRoles {
  id: string;
  email: string;
  full_name?: string;
  roles: AppRole[];
}

interface EditRolesDialogProps {
  user: UserWithRoles;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const STAFF_ROLES: { value: AppRole | "RCMS_STAFF"; label: string; description: string }[] = [
  {
    value: "STAFF",
    label: "Attorney Firm Staff",
    description: "Access to law firm operations and case management",
  },
  {
    value: "RCMS_STAFF" as AppRole,
    label: "RCMS Operations Staff",
    description: "Access to RCMS clinical operations and coordination",
  },
  {
    value: "SUPER_USER",
    label: "Super User",
    description: "Administrative access across all systems",
  },
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
    description: "Full administrative access with system configuration",
  },
];

export function EditRolesDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: EditRolesDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<Set<AppRole>>(
    new Set(user.roles)
  );
  const [saving, setSaving] = useState(false);

  const handleToggleRole = (role: AppRole) => {
    const newRoles = new Set(selectedRoles);
    if (newRoles.has(role)) {
      newRoles.delete(role);
    } else {
      newRoles.add(role);
    }
    setSelectedRoles(newRoles);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const currentRoles = new Set(user.roles);
      const rolesToAdd = Array.from(selectedRoles).filter(
        (role) => !currentRoles.has(role)
      );
      const rolesToRemove = Array.from(currentRoles).filter(
        (role) => !selectedRoles.has(role)
      );

      // Add new roles
      for (const role of rolesToAdd) {
        await assignRole(user.id, role);
      }

      // Remove old roles
      for (const role of rolesToRemove) {
        await removeRole(user.id, role);
      }

      toast.success("Roles updated successfully");
      onSuccess();
    } catch (error) {
      console.error("Error updating roles:", error);
      toast.error("Failed to update roles");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Staff Roles</DialogTitle>
          <DialogDescription>
            Manage roles for {user.full_name || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {STAFF_ROLES.map((role) => (
            <div key={role.value} className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id={role.value}
                checked={selectedRoles.has(role.value)}
                onCheckedChange={() => handleToggleRole(role.value)}
              />
              <div className="flex-1">
                <Label htmlFor={role.value} className="font-medium cursor-pointer">
                  {role.label}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {role.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
