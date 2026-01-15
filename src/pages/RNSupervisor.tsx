import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { AlertCircle, FileText, RefreshCw, ArrowRight, Clock, User } from "lucide-react";

interface CheckinItem {
  id: string;
  case_id: string | null;
  client_id: string | null;
  created_at: string;
  note?: string | null;
}

interface RNNoteItem {
  id: string;
  case_id: string | null;
  created_at: string;
  note_text?: string | null;
  author_id?: string | null;
  author_name?: string | null;
}

export default function RNSupervisor() {
  console.log("RNSupervisor: start");
  
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [supervisorEmail, setSupervisorEmail] = useState<string>("");
  const [supervisorName, setSupervisorName] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkins, setCheckins] = useState<CheckinItem[]>([]);
  const [notes, setNotes] = useState<RNNoteItem[]>([]);
  const [checkinsLoading, setCheckinsLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  // Safety timeout: if initialization takes > 8000ms, stop loading
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (loading && !initializedRef.current) {
        console.error("RNSupervisor: Loading timed out after 8 seconds");
        setError("Loading timed out. Please refresh the page.");
        setLoading(false);
      }
    }, 8000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loading]);

  // Check role and load supervisor profile
  useEffect(() => {
    const checkRoleAndLoadProfile = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        console.log("RNSupervisor: waiting for auth to load...");
        return;
      }

      console.log("RNSupervisor: session/user loaded", { userId: user?.id, email: user?.email });

      // Check if user is null (not logged in)
      if (!user?.id) {
        console.error("RNSupervisor: No user found - not logged in");
        setError("Not logged in. Please sign in to access the supervisor dashboard.");
        setLoading(false);
        initializedRef.current = true;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        return;
      }

      try {
        console.log("RNSupervisor: fetching profile for user", user.id);
        
        // Check role and get profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role, full_name, email")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("RNSupervisor: Error fetching profile:", profileError);
          setError(`Failed to load profile: ${profileError.message}`);
          setLoading(false);
          initializedRef.current = true;
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          return;
        }

        if (profileData) {
          const role = profileData.role?.toLowerCase() || null;
          console.log("RNSupervisor: profile loaded", { role, fullName: profileData.full_name });
          
          setUserRole(role);
          setSupervisorName(profileData.full_name || "");
          setSupervisorEmail(profileData.email || user.email || "");

          // Role guard: if not rn_supervisor, stop loading immediately
          if (role !== "rn_supervisor") {
            console.log("RNSupervisor: role is not rn_supervisor, stopping");
            setLoading(false);
            initializedRef.current = true;
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            return;
          }
        } else {
          // No profile found
          console.warn("RNSupervisor: No profile found for user");
          setError("Profile not found. Please contact your administrator.");
          setLoading(false);
          initializedRef.current = true;
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          return;
        }
      } catch (error: any) {
        console.error("RNSupervisor: Error checking role:", error);
        setError(`Error loading profile: ${error?.message || "Unknown error"}`);
        setLoading(false);
        initializedRef.current = true;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    };

    checkRoleAndLoadProfile();
  }, [user?.id, user?.email, authLoading]);

  // Load recent check-ins
  const loadCheckins = async () => {
    if (userRole !== "rn_supervisor") return;

    setCheckinsLoading(true);
    try {
      console.log("RNSupervisor: loading checkins...");
      
      // Try rc_client_checkins first
      const { data: checkinsData, error: checkinsError } = await supabase
        .from("rc_client_checkins")
        .select("id, case_id, client_id, created_at, note")
        .order("created_at", { ascending: false })
        .limit(10);

      if (checkinsError) {
        // If rc_client_checkins doesn't exist, try client_checkins
        if (checkinsError.code === "PGRST116" || checkinsError.message.includes("does not exist")) {
          const { data: altCheckinsData, error: altError } = await supabase
            .from("client_checkins")
            .select("id, case_id, client_id, created_at, note")
            .order("created_at", { ascending: false })
            .limit(10);

          if (!altError && altCheckinsData) {
            setCheckins(altCheckinsData);
            console.log("RNSupervisor: checkins loaded", altCheckinsData.length);
          } else {
            console.log("RNSupervisor: checkins loaded", 0, "(table not accessible)");
          }
        } else {
          console.error("RNSupervisor: Error loading check-ins:", checkinsError);
          // Don't set error - just show empty state
        }
      } else if (checkinsData) {
        setCheckins(checkinsData);
        console.log("RNSupervisor: checkins loaded", checkinsData.length);
      } else {
        console.log("RNSupervisor: checkins loaded", 0);
      }
    } catch (error: any) {
      console.error("RNSupervisor: Error loading check-ins:", error);
      // Don't crash - just show empty state
    } finally {
      setCheckinsLoading(false);
    }
  };

  // Load recent RN notes
  const loadNotes = async () => {
    if (userRole !== "rn_supervisor") return;

    setNotesLoading(true);
    try {
      console.log("RNSupervisor: loading notes...");
      
      // Try rc_rn_notes first
      const { data: notesData, error: notesError } = await supabase
        .from("rc_rn_notes")
        .select("id, case_id, created_at, note_text, author_id")
        .order("created_at", { ascending: false })
        .limit(10);

      if (notesError) {
        // If rc_rn_notes doesn't exist, try alternative table names
        if (notesError.code === "PGRST116" || notesError.message.includes("does not exist")) {
          // Try rn_notes as fallback
          const { data: altNotesData, error: altError } = await supabase
            .from("rn_notes")
            .select("id, case_id, created_at, note_text, author_id")
            .order("created_at", { ascending: false })
            .limit(10);

          if (!altError && altNotesData) {
            // Try to get author names
            const authorIds = altNotesData
              .map((n: any) => n.author_id)
              .filter((id: string | null) => id) as string[];
            
            if (authorIds.length > 0) {
              try {
                const { data: authorData } = await supabase
                  .from("profiles")
                  .select("id, full_name")
                  .in("id", authorIds);

                const authorMap = new Map(
                  (authorData || []).map((a: any) => [a.id, a.full_name || "RN"])
                );

                const notesWithAuthors = altNotesData.map((n: any) => ({
                  ...n,
                  author_name: authorMap.get(n.author_id) || "RN",
                }));
                setNotes(notesWithAuthors);
                console.log("RNSupervisor: notes loaded", notesWithAuthors.length);
              } catch (authorError) {
                setNotes(altNotesData);
                console.log("RNSupervisor: notes loaded", altNotesData.length, "(without author names)");
              }
            } else {
              setNotes(altNotesData);
              console.log("RNSupervisor: notes loaded", altNotesData.length);
            }
          } else {
            console.log("RNSupervisor: notes loaded", 0, "(table not accessible)");
          }
        } else {
          console.error("RNSupervisor: Error loading RN notes:", notesError);
          // Don't set error - just show empty state
        }
      } else if (notesData) {
        // Try to get author names if author_id is present
        const authorIds = notesData
          .map((n: any) => n.author_id)
          .filter((id: string | null) => id) as string[];
        
        if (authorIds.length > 0) {
          try {
            const { data: authorData } = await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", authorIds);

            const authorMap = new Map(
              (authorData || []).map((a: any) => [a.id, a.full_name || "RN"])
            );

            const notesWithAuthors = notesData.map((n: any) => ({
              ...n,
              author_name: authorMap.get(n.author_id) || "RN",
            }));
            setNotes(notesWithAuthors);
            console.log("RNSupervisor: notes loaded", notesWithAuthors.length);
          } catch (authorError) {
            // If author lookup fails, just use notes without author names
            setNotes(notesData);
            console.log("RNSupervisor: notes loaded", notesData.length, "(without author names)");
          }
        } else {
          setNotes(notesData);
          console.log("RNSupervisor: notes loaded", notesData.length);
        }
      } else {
        console.log("RNSupervisor: notes loaded", 0);
      }
    } catch (error: any) {
      console.error("RNSupervisor: Error loading RN notes:", error);
      // Don't crash - just show empty state
    } finally {
      setNotesLoading(false);
    }
  };

  // Load data when role is confirmed
  useEffect(() => {
    if (userRole === "rn_supervisor" && !loading) {
      loadCheckins();
      loadNotes();
      console.log("RNSupervisor: done");
    }
  }, [userRole, loading]);

  // Mark as initialized when loading completes
  useEffect(() => {
    if (!loading && userRole !== null) {
      initializedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [loading, userRole]);

  // Refresh handler
  const handleRefresh = () => {
    loadCheckins();
    loadNotes();
  };

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 md:p-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-3">
              {error.includes("Not logged in") || error.includes("Profile not found") ? (
                <Button onClick={() => navigate("/rn-login")} variant="outline">
                  Go to RN Login
                </Button>
              ) : (
                <Button onClick={() => window.location.reload()} variant="outline">
                  Refresh Page
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Route guard: if not rn_supervisor, show not authorized
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 md:p-8">
            <div className="text-center text-muted-foreground">Loading...</div>
          </Card>
        </div>
      </div>
    );
  }

  if (userRole !== "rn_supervisor") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 md:p-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not authorized</AlertTitle>
              <AlertDescription>
                This dashboard is for RN Supervisors only.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button onClick={() => navigate("/rn-login")} variant="outline">
                Go to RN Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6 md:p-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">RN Supervisor Dashboard</h1>
            {supervisorName && (
              <p className="text-sm text-muted-foreground">
                Welcome, {supervisorName}
              </p>
            )}
            {supervisorEmail && (
              <p className="text-xs text-muted-foreground">
                {supervisorEmail}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Audit and oversight tools for RN supervisors.
            </p>
          </div>
        </Card>

        {/* Supervisor Tools Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Supervisor Tools
            </CardTitle>
            <CardDescription>
              Quick access to RN portal and dashboard controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate("/rn-console")}
                className="flex items-center gap-2"
              >
                Go to RN Console
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="flex items-center gap-2"
                disabled={checkinsLoading || notesLoading}
              >
                <RefreshCw className={`h-4 w-4 ${(checkinsLoading || notesLoading) ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent RN Check-ins Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent RN Check-ins
            </CardTitle>
            <CardDescription>
              Last 10 client check-ins submitted by RNs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkinsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading check-ins...</div>
            ) : checkins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">No check-ins found</p>
                <p className="text-sm">No recent check-ins are available at this time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {checkins.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.case_id && (
                          <span className="font-mono text-sm font-medium">
                            Case: {item.case_id.slice(0, 8)}...
                          </span>
                        )}
                        {item.client_id && (
                          <span className="text-sm text-muted-foreground">
                            Client: {item.client_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      {item.note && (
                        <p className="text-sm text-foreground mt-1 line-clamp-2">
                          {item.note}
                        </p>
                      )}
                      {item.created_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Clock className="h-3 w-3" />
                          {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent RN Notes Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent RN Notes
            </CardTitle>
            <CardDescription>
              Last 10 clinical notes submitted by RNs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading notes...</div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">No notes found</p>
                <p className="text-sm">No recent RN notes are available at this time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.case_id && (
                          <span className="font-mono text-sm font-medium">
                            Case: {item.case_id.slice(0, 8)}...
                          </span>
                        )}
                        {item.author_name && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            {item.author_name}
                          </div>
                        )}
                      </div>
                      {item.note_text && (
                        <p className="text-sm text-foreground mt-1 line-clamp-3">
                          {item.note_text}
                        </p>
                      )}
                      {item.created_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Clock className="h-3 w-3" />
                          {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
