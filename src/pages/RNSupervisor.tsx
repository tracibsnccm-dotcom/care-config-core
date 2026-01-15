import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [supervisorEmail, setSupervisorEmail] = useState<string>("");
  const [supervisorName, setSupervisorName] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState<CheckinItem[]>([]);
  const [notes, setNotes] = useState<RNNoteItem[]>([]);
  const [checkinsLoading, setCheckinsLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);

  // Check role and load supervisor profile
  useEffect(() => {
    const checkRoleAndLoadProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Check role and get profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role, full_name, email")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setLoading(false);
          return;
        }

        if (profileData) {
          setUserRole(profileData.role?.toLowerCase() || null);
          setSupervisorName(profileData.full_name || "");
          setSupervisorEmail(profileData.email || user.email || "");
        } else {
          // Fallback to user email if no profile
          setSupervisorEmail(user.email || "");
        }
      } catch (error) {
        console.error("Error checking role:", error);
      } finally {
        setLoading(false);
      }
    };

    checkRoleAndLoadProfile();
  }, [user?.id, user?.email]);

  // Load recent check-ins
  const loadCheckins = async () => {
    if (userRole !== "rn_supervisor") return;

    setCheckinsLoading(true);
    try {
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
          }
        } else {
          console.error("Error loading check-ins:", checkinsError);
        }
      } else if (checkinsData) {
        setCheckins(checkinsData);
      }
    } catch (error) {
      console.error("Error loading check-ins:", error);
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
            } else {
              setNotes(altNotesData);
            }
          }
        } else {
          console.error("Error loading RN notes:", notesError);
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
          } catch (authorError) {
            // If author lookup fails, just use notes without author names
            setNotes(notesData);
          }
        } else {
          setNotes(notesData);
        }
      }
    } catch (error) {
      console.error("Error loading RN notes:", error);
      // Don't crash - just show empty state
    } finally {
      setNotesLoading(false);
    }
  };

  // Load data when role is confirmed
  useEffect(() => {
    if (userRole === "rn_supervisor") {
      loadCheckins();
      loadNotes();
    }
  }, [userRole]);

  // Refresh handler
  const handleRefresh = () => {
    loadCheckins();
    loadNotes();
  };

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
              <AlertDescription>
                <strong>Not authorized.</strong> This dashboard is for RN Supervisors only.
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
