import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, UserCog, Plus } from "lucide-react";
import { StaffUserList } from "@/components/admin/StaffUserList";
import { AddStaffDialog } from "@/components/admin/AddStaffDialog";

export default function StaffPermissionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Staff Permissions Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Assign and manage roles for staff members across your organization
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Role Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">STAFF</Badge>
                  <span className="text-xs text-muted-foreground">Attorney Firm Staff</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">RCMS_STAFF</Badge>
                  <span className="text-xs text-muted-foreground">RCMS Operations Staff</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Permission Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>• Document Management</p>
                <p>• Case Coordination</p>
                <p>• Administrative Tools</p>
                <p>• Role-specific features</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  View Activity Logs
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Export User List
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Members</CardTitle>
            <CardDescription>
              Manage staff roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <StaffUserList searchQuery={searchQuery} />
          </CardContent>
        </Card>

        <AddStaffDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      </div>
    </AppLayout>
  );
}
