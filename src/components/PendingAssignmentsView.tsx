import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertCircle } from "lucide-react";
import { DeclineAssignmentModal } from "./DeclineAssignmentModal";
import { AcceptAssignmentModal } from "./AcceptAssignmentModal";
import { toast } from "@/hooks/use-toast";

interface PendingAssignment {
  id: string;
  case_id: string;
  offered_at: string;
  expires_at: string;
  created_by: string;
  reviewer_name?: string;
}

export function PendingAssignmentsView() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<PendingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<PendingAssignment | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    loadAssignments();
    loadWalletBalance();

    const channel = supabase
      .channel("pending_assignments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_offers",
          filter: `attorney_id=eq.${user.id}`,
        },
        () => {
          loadAssignments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function loadAssignments() {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("assignment_offers")
      .select(
        `
        id,
        case_id,
        offered_at,
        expires_at,
        created_by,
        profiles!assignment_offers_created_by_fkey(display_name)
      `
      )
      .eq("attorney_id", user.id)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("offered_at", { ascending: true });

    if (error) {
      console.error("Error loading assignments:", error);
      toast({
        title: "Error",
        description: "Failed to load pending assignments.",
        variant: "destructive",
      });
    } else {
      const mapped = (data || []).map((item: any) => ({
        ...item,
        reviewer_name: item.profiles?.display_name,
      }));
      setAssignments(mapped);
    }

    setLoading(false);
  }

  function getTimeLeft(expiresAt: string): string {
    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    const diff = expires - now;

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }

  async function handleAccept() {
    if (!selectedOffer) return;

    try {
      const { data, error } = await supabase.rpc("accept_assignment_offer", {
        p_offer_id: selectedOffer.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; case_id?: string };

      if (!result.success) {
        toast({
          title: "Unable to Accept",
          description: result.error || "This offer is no longer available.",
          variant: "destructive",
        });
        loadAssignments();
        return;
      }

      toast({
        title: "Client Accepted",
        description: "You have successfully accepted this client assignment.",
      });

      setShowAcceptModal(false);
      setSelectedOffer(null);
      loadAssignments();

      if (result.case_id) {
        window.location.href = `/case-detail/${result.case_id}`;
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
      toast({
        title: "Error",
        description: "Failed to accept assignment.",
        variant: "destructive",
      });
    }
  }

  async function handleDecline(reason: string, note?: string) {
    if (!selectedOffer) return;

    try {
      const { data, error } = await supabase.rpc("decline_assignment_offer", {
        p_offer_id: selectedOffer.id,
        p_reason: reason,
        p_note: note,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (!result.success) {
        toast({
          title: "Unable to Decline",
          description: result.error || "Failed to process your decline.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Assignment Declined",
        description: "The client has been returned to the queue.",
      });

      setShowDeclineModal(false);
      setSelectedOffer(null);
      loadAssignments();
    } catch (error) {
      console.error("Error declining offer:", error);
      toast({
        title: "Error",
        description: "Failed to decline assignment.",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No pending assignments</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Pending Assignments
            <Badge variant="secondary">{assignments.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>RN CM Reviewer</TableHead>
                <TableHead>Time Left</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => {
                const caseId = `RC-${assignment.case_id.slice(-8).toUpperCase()}`;
                const timeLeft = getTimeLeft(assignment.expires_at);

                return (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{caseId}</TableCell>
                    <TableCell className="text-muted-foreground">
                      Client ID {caseId}
                    </TableCell>
                    <TableCell>
                      {new Date(assignment.offered_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{assignment.reviewer_name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          timeLeft.includes("h") ? "secondary" : "destructive"
                        }
                        className="gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        {timeLeft}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedOffer(assignment);
                          setShowAcceptModal(true);
                        }}
                        className="bg-[#b09837] text-black hover:bg-[#b09837]/90"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOffer(assignment);
                          setShowDeclineModal(true);
                        }}
                      >
                        Decline
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedOffer && (
        <>
          <DeclineAssignmentModal
            open={showDeclineModal}
            onClose={() => {
              setShowDeclineModal(false);
              setSelectedOffer(null);
            }}
            onDecline={handleDecline}
          />

          <AcceptAssignmentModal
            open={showAcceptModal}
            onClose={() => {
              setShowAcceptModal(false);
              setSelectedOffer(null);
            }}
            onAccept={handleAccept}
            caseId={`RC-${selectedOffer.case_id.slice(-8).toUpperCase()}`}
          />
        </>
      )}
    </>
  );
}
