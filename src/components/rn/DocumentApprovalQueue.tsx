import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileCheck, FileX, Calendar, User, FileText, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface DocumentShare {
  id: string;
  case_id: string;
  document_id: string;
  provider_id: string;
  status: string;
  created_at: string;
  provider_name?: string;
  case_label?: string;
  document_name?: string;
}

export function DocumentApprovalQueue() {
  const [pendingShares, setPendingShares] = useState<DocumentShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchPendingShares();
  }, []);

  async function fetchPendingShares() {
    try {
      setLoading(true);
      const { data: sharesData, error } = await supabase
        .from("appointment_document_shares")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted: DocumentShare[] = (sharesData || []).map((share) => {
        const docIds = share.document_ids as string[] | null;
        return {
          id: share.id,
          case_id: share.case_id || "",
          document_id: Array.isArray(docIds) ? docIds[0] || "" : "",
          provider_id: share.provider_id || "",
          status: share.status || "pending",
          created_at: share.created_at || new Date().toISOString(),
          provider_name: "Provider",
          case_label: "Case",
          document_name: "Document",
        };
      });

      setPendingShares(formatted);
    } catch (error) {
      console.error("Error fetching pending shares:", error);
      toast.error("Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  }

  async function handleApproval(shareId: string, approved: boolean) {
    try {
      setProcessingId(shareId);

      const { error } = await supabase
        .from("appointment_document_shares")
        .update({
          status: approved ? "approved" : "denied",
          approved_at: approved ? new Date().toISOString() : null,
          notes: reviewNotes[shareId] || null,
        })
        .eq("id", shareId);

      if (error) throw error;

      toast.success(`Document share ${approved ? "approved" : "denied"}`);
      fetchPendingShares();
      setReviewNotes((prev) => {
        const updated = { ...prev };
        delete updated[shareId];
        return updated;
      });
    } catch (error) {
      console.error("Error processing approval:", error);
      toast.error("Failed to process approval");
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Loading pending approvals...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileCheck className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Document Approval Queue</h2>
        <Badge variant="secondary" className="ml-auto">
          {pendingShares.length} Pending
        </Badge>
      </div>

      {pendingShares.length === 0 ? (
        <div className="text-center py-12">
          <FileCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No pending document approvals</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingShares.map((share) => (
            <Card key={share.id} className="p-4 border-l-4 border-l-warning">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-foreground">
                        {share.document_name || "Document"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {share.case_label || "Unknown Case"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(share.created_at), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">Pending Review</Badge>
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground">
                    <strong>Share with:</strong> {share.provider_name || "Unknown Provider"}
                  </p>
                </div>

                <div>
                  <Label htmlFor={`notes-${share.id}`} className="text-xs">
                    Review Notes (Optional)
                  </Label>
                  <Textarea
                    id={`notes-${share.id}`}
                    value={reviewNotes[share.id] || ""}
                    onChange={(e) =>
                      setReviewNotes((prev) => ({ ...prev, [share.id]: e.target.value }))
                    }
                    placeholder="Add notes about this approval decision..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApproval(share.id, true)}
                    disabled={processingId === share.id}
                    className="bg-success hover:bg-success/90"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproval(share.id, false)}
                    disabled={processingId === share.id}
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Deny
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
