import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { assignRole } from "@/lib/roleOperations";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STAFF_ROLES: { value: AppRole; label: string }[] = [
  { value: "STAFF", label: "Attorney Firm Staff" },
  { value: "RCMS_STAFF", label: "RCMS Operations Staff" },
  { value: "SUPER_USER", label: "Super User" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

export function AddStaffDialog({ open, onOpenChange }: AddStaffDialogProps) {
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Set<AppRole>>(new Set());
  const [loading, setLoading] = useState(false);

  const handleToggleRole = (role: AppRole) => {
    const newRoles = new Set(selectedRoles);
    if (newRoles.has(role)) {
      newRoles.delete(role);
    } else {
      newRoles.add(role);
    }
    setSelectedRoles(newRoles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || selectedRoles.size === 0) {
      toast.error("Please enter an email and select at least one role");
      return;
    }

    try {
      setLoading(true);

      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        toast.error("User not found. They may need to sign up first.");
        return;
      }

      // Assign roles
      for (const role of Array.from(selectedRoles)) {
        await assignRole(profile.id, role);
      }

      toast.success("Staff member added successfully");
      setEmail("");
      setSelectedRoles(new Set());
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding staff member:", error);
      toast.error("Failed to add staff member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Invite a user and assign their initial roles
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="staff@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              User must already have an account
            </p>
          </div>

          <div className="space-y-2">
            <Label>Assign Roles</Label>
            <div className="space-y-2">
              {STAFF_ROLES.map((role) => (
                <div key={role.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`add-${role.value}`}
                    checked={selectedRoles.has(role.value)}
                    onCheckedChange={() => handleToggleRole(role.value)}
                  />
                  <Label htmlFor={`add-${role.value}`} className="cursor-pointer">
                    {role.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Staff Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
