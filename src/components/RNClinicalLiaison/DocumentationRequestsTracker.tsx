import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DocumentationRequestsTrackerProps {
  caseId: string;
}

interface DocumentRequest {
  id: string;
  document_type: string;
  requested_from: string;
  status: string;
  requested_at: string;
  notes: string;
}

export default function DocumentationRequestsTracker({ caseId }: DocumentationRequestsTrackerProps) {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [documentType, setDocumentType] = useState("");
  const [requestedFrom, setRequestedFrom] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, [caseId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("case_tasks")
        .select("id, title, description, status, assigned_to, created_at, created_by, case_id")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRequests(
        data?.map((task) => ({
          id: task.id,
          document_type: task.title,
          requested_from: task.assigned_to || "Provider",
          status: task.status,
          requested_at: task.created_at,
          notes: task.description || "",
        })) || []
      );
    } catch (error) {
      console.error("Error fetching document requests:", error);
      toast({
        title: "Error",
        description: "Failed to load document requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!documentType || !requestedFrom) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: currentUser } = await supabase.auth.getUser();

      const { error } = await supabase.from("case_tasks").insert({
        case_id: caseId,
        title: documentType,
        description: notes,
        task_type: "document_request",
        status: "pending",
        created_by: currentUser.user?.id,
      });

      if (error) throw error;

      toast({
        title: "Request Created",
        description: "Document request has been sent",
      });

      setDialogOpen(false);
      setDocumentType("");
      setRequestedFrom("");
      setNotes("");
      fetchRequests();
    } catch (error) {
      console.error("Error creating request:", error);
      toast({
        title: "Error",
        description: "Failed to create document request",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      in_progress: "default",
      completed: "outline",
      overdue: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (loading) {
    return <div className="h-32 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Documentation Requests</h3>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Documentation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Medical Records">Medical Records</SelectItem>
                    <SelectItem value="Clinical Notes">Clinical Notes</SelectItem>
                    <SelectItem value="Treatment Plan">Treatment Plan</SelectItem>
                    <SelectItem value="Progress Report">Progress Report</SelectItem>
                    <SelectItem value="Discharge Summary">Discharge Summary</SelectItem>
                    <SelectItem value="Lab Results">Lab Results</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Requested From</Label>
                <Select value={requestedFrom} onValueChange={setRequestedFrom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primary Care Provider">Primary Care Provider</SelectItem>
                    <SelectItem value="Specialist">Specialist</SelectItem>
                    <SelectItem value="Physical Therapist">Physical Therapist</SelectItem>
                    <SelectItem value="Mental Health Provider">Mental Health Provider</SelectItem>
                    <SelectItem value="Hospital">Hospital</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional details about the request..."
                  rows={3}
                />
              </div>

              <Button onClick={handleCreateRequest} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {requests.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No documentation requests</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
            <TableHead>Document Type</TableHead>
            <TableHead>Requested From</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.document_type}</TableCell>
                <TableCell>{request.requested_from}</TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>{new Date(request.requested_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
