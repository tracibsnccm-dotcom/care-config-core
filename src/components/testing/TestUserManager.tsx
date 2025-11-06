import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TestUserManager() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Test User Management</h3>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Current Test Users</h4>
            <Badge>3 Active</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Test users are managed through your authentication system. Use the existing user management tools to create test accounts.
          </p>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Recommended Test Roles</h4>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>RN Case Manager (for testing diary entries, reminders)</li>
            <li>Attorney (for testing case assignments, offers)</li>
            <li>Client (for testing appointments, check-ins)</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
