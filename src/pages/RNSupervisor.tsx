import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { AlertCircle, FileText, CheckCircle, Clock, ExternalLink } from "lucide-react";

interface ReviewQueueItem {
  id: string;
  client_label: string | null;
  case_status: string | null;
  created_at: string | null;
  needs_review_reason?: string;
}

interface RecentlyReleasedItem {
  id: string;
  client_label: string | null;
  case_status: string | null;
  released_at?: string | null;
  updated_at: string | null;
}

export default function RNSupervisor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [supervisorName, setSupervisorName] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [recentlyReleased, setRecentlyReleased] = useState<RecentlyReleasedItem[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [releasedLoading, setReleasedLoading] = useState(false);

  // Check role and load supervisor name
  useEffect(() => {
    const checkRoleAndLoadProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Check role
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role, full_name")
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
        }
      } catch (error) {
        console.error("Error checking role:", error);
      } finally {
        setLoading(false);
      }
    };

    checkRoleAndLoadProfile();
  }, [user?.id]);

  // Load review queue
  useEffect(() => {
    const loadReviewQueue = async () => {
      if (userRole !== "rn_supervisor") return;

      setQueueLoading(true);
      try {
        // Query cases that might need review
        // For now, we'll look for cases with status that indicates review needed
        // or cases with flags/issues. This can be expanded based on business logic.
        const { data: casesData, error: casesError } = await supabase
          .from("rc_cases")
          .select("id, case_status, created_at")
          .in("case_status", ["intake_pending", "review_needed", "pending_review"])
          .order("created_at", { ascending: false })
          .limit(20);

        if (casesError) {
          console.error("Error loading review queue:", casesError);
          // If rc_cases doesn't exist or has different structure, try cases table
          const { data: altCasesData, error: altError } = await supabase
            .from("cases")
            .select("id, status, created_at, client_label")
            .in("status", ["NEW", "AWAITING_CONSENT", "ROUTED"])
            .order("created_at", { ascending: false })
            .limit(20);

          if (!altError && altCasesData) {
            const formatted = altCasesData.map((c: any) => ({
              id: c.id,
              client_label: c.client_label,
              case_status: c.status,
              created_at: c.created_at,
            }));
            setReviewQueue(formatted);
          }
        } else if (casesData) {
          // Try to get client_label from related tables if available
          const formatted = casesData.map((c: any) => ({
            id: c.id,
            client_label: null,
            case_status: c.case_status,
            created_at: c.created_at,
          }));
          setReviewQueue(formatted);
        }
      } catch (error) {
        console.error("Error loading review queue:", error);
      } finally {
        setQueueLoading(false);
      }
    };

    loadReviewQueue();
  }, [userRole]);

  // Load recently released cases
  useEffect(() => {
    const loadRecentlyReleased = async () => {
      if (userRole !== "rn_supervisor") return;

      setReleasedLoading(true);
      try {
        // Query cases with status 'released' or 'closed', ordered by release date
        const { data: casesData, error: casesError } = await supabase
          .from("rc_cases")
          .select("id, case_status, released_at, updated_at, created_at")
          .in("case_status", ["released", "closed"])
          .order("released_at", { ascending: false })
          .limit(10);

        if (casesError) {
          console.error("Error loading recently released:", casesError);
          // Try cases table as fallback
          const { data: altCasesData, error: altError } = await supabase
            .from("cases")
            .select("id, status, updated_at, created_at, client_label")
            .in("status", ["released", "closed"])
            .order("updated_at", { ascending: false })
            .limit(10);

          if (!altError && altCasesData) {
            const formatted = altCasesData.map((c: any) => ({
              id: c.id,
              client_label: c.client_label,
              case_status: c.status,
              released_at: null,
              updated_at: c.updated_at || c.created_at,
            }));
            setRecentlyReleased(formatted);
          }
        } else if (casesData) {
          const formatted = casesData.map((c: any) => ({
            id: c.id,
            client_label: null,
            case_status: c.case_status,
            released_at: c.released_at,
            updated_at: c.updated_at || c.released_at || c.created_at,
          }));
          setRecentlyReleased(formatted);
        }
      } catch (error) {
        console.error("Error loading recently released:", error);
      } finally {
        setReleasedLoading(false);
      }
    };

    loadRecentlyReleased();
  }, [userRole]);

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
              <Button onClick={() => navigate("/rn-console")} variant="outline">
                Go to RN Portal
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
            <p className="text-sm text-muted-foreground">
              Monitor case reviews and recently released cases.
            </p>
          </div>
        </Card>

        {/* Review Queue Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Review Queue
            </CardTitle>
            <CardDescription>
              Cases requiring supervisor review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queueLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading review queue...</div>
            ) : reviewQueue.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm">No cases pending review at this time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviewQueue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium">
                          {item.id.slice(0, 8)}...
                        </span>
                        {item.client_label && (
                          <span className="text-sm text-muted-foreground">
                            {item.client_label}
                          </span>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {item.case_status || "Unknown"}
                        </Badge>
                      </div>
                      {item.created_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Created: {format(new Date(item.created_at), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="ml-4">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Released Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recently Released
            </CardTitle>
            <CardDescription>
              Cases released in the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {releasedLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading recently released cases...</div>
            ) : recentlyReleased.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">No recent releases</p>
                <p className="text-sm">No cases have been released recently.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentlyReleased.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium">
                          {item.id.slice(0, 8)}...
                        </span>
                        {item.client_label && (
                          <span className="text-sm text-muted-foreground">
                            {item.client_label}
                          </span>
                        )}
                        <Badge
                          variant={item.case_status === "closed" ? "destructive" : "default"}
                          className="text-xs"
                        >
                          {item.case_status || "Unknown"}
                        </Badge>
                      </div>
                      {item.updated_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {item.released_at
                            ? `Released: ${format(new Date(item.released_at), "MMM d, yyyy")}`
                            : `Updated: ${format(new Date(item.updated_at), "MMM d, yyyy")}`}
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="ml-4">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
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
