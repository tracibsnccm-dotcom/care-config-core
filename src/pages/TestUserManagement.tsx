import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { UserPlus, Copy, Trash2 } from "lucide-react";

interface TestUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  user_id?: string;
  notes?: string;
  created_at: string;
}

const ROLES = [
  "ATTORNEY",
  "RN_CCM",
  "RN_CCM_DIRECTOR",
  "STAFF",
  "PROVIDER",
  "CLIENT",
  "SUPER_ADMIN"
];

export default function TestUserManagement() {
  const [testUsers, setTestUsers] = useState<TestUser[]>([]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTestUsers();
  }, []);

  const fetchTestUsers = async () => {
    const { data, error } = await supabase
      .from('test_user_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching test users:", error);
      return;
    }

    setTestUsers(data || []);
  };

  const createTestUser = async () => {
    if (!email || !fullName || !role || !password) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (authError) {
        toast.error(`Failed to create auth user: ${authError.message}`);
        setLoading(false);
        return;
      }

      // Then, create the test account record
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      const { error: insertError } = await supabase
        .from('test_user_accounts')
        .insert({
          email,
          full_name: fullName,
          role,
          password, // Store temporarily for testing purposes
          user_id: authData.user?.id,
          created_by: currentUser?.id,
          notes
        });

      if (insertError) {
        toast.error("Failed to save test account");
        setLoading(false);
        return;
      }

      // Add role to user_roles table if needed
      if (authData.user?.id) {
        await supabase.from('user_roles').upsert({
          user_id: authData.user.id,
          role: role as any
        });
      }

      toast.success(`Test user "${fullName}" created successfully`);
      
      // Reset form
      setEmail("");
      setFullName("");
      setRole("");
      setPassword("");
      setNotes("");
      
      fetchTestUsers();
    } catch (error) {
      console.error("Error creating test user:", error);
      toast.error("Failed to create test user");
    } finally {
      setLoading(false);
    }
  };

  const deleteTestUser = async (userId: string, email: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete test user ${email}?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from('test_user_accounts')
      .delete()
      .eq('id', userId);

    if (error) {
      toast.error("Failed to delete test user");
      return;
    }

    toast.success("Test user deleted");
    fetchTestUsers();
  };

  const copyCredentials = (email: string, password: string) => {
    const credentials = `Email: ${email}\nPassword: ${password}`;
    navigator.clipboard.writeText(credentials);
    toast.success("Credentials copied to clipboard");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Test User Management</h1>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create New Test User
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              placeholder="attorney.test@firm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Label>Full Name *</Label>
            <Input
              placeholder="John Morrison"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <Label>Role *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Password *</Label>
            <Input
              type="password"
              placeholder="test123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Testing attorney workflow, high capacity..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Button onClick={createTestUser} disabled={loading} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              {loading ? "Creating..." : "Create Test User"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Test User Accounts</h2>
        
        {testUsers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No test users created yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                      {user.role.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">••••••</code>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{user.notes}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyCredentials(user.email, "••••••")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteTestUser(user.id, user.email)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-6 bg-muted">
        <h3 className="font-semibold mb-2">Testing Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Create test user accounts for different roles (Attorney, Nurse, Staff, etc.)</li>
          <li>Share the login credentials with your testers</li>
          <li>Load a test scenario from the Test Scenario Manager</li>
          <li>Have testers log in with their assigned roles</li>
          <li>Use the Time Control Panel to jump time forward and trigger events</li>
          <li>Observe system behavior in the Event Log</li>
          <li>All actions are automatically logged with user names and IDs</li>
        </ol>
      </Card>
    </div>
  );
}
