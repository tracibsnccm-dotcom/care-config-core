import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Mail, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EditRolesDialog } from "./EditRolesDialog";
import { getUserRoles } from "@/lib/roleOperations";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRoles {
  id: string;
  email: string;
  full_name?: string;
  roles: AppRole[];
}

interface StaffUserListProps {
  searchQuery: string;
}

export function StaffUserList({ searchQuery }: StaffUserListProps) {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name");

      if (profilesError) throw profilesError;

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const roles = await getUserRoles(profile.id);
          return {
            id: profile.id,
            email: profile.email || "",
            full_name: profile.full_name || undefined,
            roles,
          };
        })
      );

      // Filter to show only staff-related users
      const staffUsers = usersWithRoles.filter(user => 
        user.roles.some(role => 
          role === "STAFF" || 
          role === "RCMS_STAFF" ||
          role === "SUPER_USER" ||
          role === "SUPER_ADMIN"
        )
      );

      setUsers(staffUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove all roles from this user?")) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("User roles removed successfully");
      loadUsers();
    } catch (error) {
      console.error("Error deleting user roles:", error);
      toast.error("Failed to remove user roles");
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading staff members...
      </div>
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No staff members found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.full_name || "Unnamed User"}</p>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {user.roles.map((role) => (
                    <Badge
                      key={role}
                      variant={
                        role === "SUPER_ADMIN" || role === "SUPER_USER"
                          ? "destructive"
                          : role === "RCMS_STAFF"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {role}
                    </Badge>
                  ))}
                  {user.roles.length === 0 && (
                    <Badge variant="outline" className="text-xs">
                      No Roles
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingUser(user)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit Roles
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteUser(user.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {editingUser && (
        <EditRolesDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onSuccess={() => {
            loadUsers();
            setEditingUser(null);
          }}
        />
      )}
    </>
  );
}
