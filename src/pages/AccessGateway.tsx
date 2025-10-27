import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, Mail, Lock, UserPlus } from "lucide-react";

type RoleTab = 'ATTORNEY' | 'CLIENT' | 'PROVIDER';

export default function AccessGateway() {
  const navigate = useNavigate();
  const { user, signIn, signUp, signOut, roles } = useAuth();
  
  const [activeRole, setActiveRole] = useState<RoleTab>('ATTORNEY');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [caseId, setCaseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Parse URL hash params (PHI-safe approach)
  useEffect(() => {
    const hash = window.location.hash || "";
    if (hash.includes("token=")) {
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const role = params.get("role");
      const caseToken = params.get("case");
      
      if (role && ['ATTORNEY', 'CLIENT', 'PROVIDER'].includes(role.toUpperCase())) {
        setActiveRole(role.toUpperCase() as RoleTab);
      }
      if (caseToken) {
        setCaseId(caseToken);
      }
    }
  }, []);

  // Redirect if already signed in
  useEffect(() => {
    if (user && roles.length > 0) {
      // Route by role
      if (roles.includes('ATTORNEY')) {
        navigate('/attorney-portal');
      } else if (roles.includes('CLIENT')) {
        navigate('/client-portal');
      } else if (roles.includes('PROVIDER')) {
        navigate('/provider-portal');
      } else {
        navigate('/');
      }
    }
  }, [user, roles, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await signIn(email, password);
    
    if (error) {
      setMessage(error.message);
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Account created! Please check your email to verify.");
    }
    
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setMessage("You have been signed out.");
  };

  return (
    <main className="min-h-screen py-10 px-6 bg-gradient-to-b from-primary/5 via-primary/3 to-background">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span>Secure Access</span>
            <span className="opacity-70">• PHI-Safe URLs</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary">
            Reconcile C.A.R.E.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Secure authentication using URL hash params to protect sensitive information.
            <br />
            <span className="text-sm">Example: <code className="text-xs">#token=...&role=CLIENT&case=RC-1234</code></span>
          </p>
        </header>

        {/* Role Tabs */}
        <div className="flex gap-2 justify-center flex-wrap">
          {(['ATTORNEY', 'CLIENT', 'PROVIDER'] as const).map((role) => (
            <Button
              key={role}
              onClick={() => setActiveRole(role)}
              variant={activeRole === role ? 'default' : 'outline'}
              className="min-w-[120px]"
            >
              {role === 'ATTORNEY' ? 'Attorney' : role === 'CLIENT' ? 'Client' : 'Provider'}
            </Button>
          ))}
        </div>

        {/* Auth Forms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {activeRole === 'ATTORNEY' && 'Attorney Portal Access'}
              {activeRole === 'CLIENT' && 'Client Portal Access'}
              {activeRole === 'PROVIDER' && 'Provider Portal Access'}
            </CardTitle>
            <CardDescription className="text-center">
              Sign in or create a new account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">
                      <Mail className="inline h-4 w-4 mr-2" />
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">
                      <Lock className="inline h-4 w-4 mr-2" />
                      Password
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  {(activeRole === 'CLIENT' || activeRole === 'PROVIDER') && (
                    <div className="space-y-2">
                      <Label htmlFor="case-id">Case ID (optional)</Label>
                      <Input
                        id="case-id"
                        type="text"
                        placeholder="RC-XXXX-XXXX (tokenized)"
                        value={caseId}
                        onChange={(e) => setCaseId(e.target.value)}
                        autoComplete="off"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use the tokenized case ID (no names, no PHI)
                      </p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">
                      <UserPlus className="inline h-4 w-4 mr-2" />
                      Full Name
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">
                      <Mail className="inline h-4 w-4 mr-2" />
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">
                      <Lock className="inline h-4 w-4 mr-2" />
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 6 characters
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {message && (
              <Alert className="mt-4">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {user && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Implementation Notes */}
        <details className="text-sm">
          <summary className="cursor-pointer text-primary font-semibold mb-2">
            Implementation Notes
          </summary>
          <Card>
            <CardContent className="pt-6 space-y-2 text-muted-foreground">
              <p>
                • Authentication uses Supabase with secure server-side session management
              </p>
              <p>
                • User roles stored in separate table (prevents privilege escalation)
              </p>
              <p>
                • Invite links use hash params: <code className="text-xs">#token=...&role=...&case=...</code>
              </p>
              <p>
                • Case IDs are tokenized (no PHI in URLs or logs)
              </p>
              <p>
                • After sign-in, users are routed to their role-specific portal
              </p>
            </CardContent>
          </Card>
        </details>
      </div>
    </main>
  );
}
