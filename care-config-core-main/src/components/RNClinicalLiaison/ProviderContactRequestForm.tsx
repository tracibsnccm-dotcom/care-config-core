import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { StatusBadgeRCMS } from "@/components/StatusBadgeRCMS";
import { format } from "date-fns";

interface ProviderContactRequestFormProps {
  caseId: string;
}

interface Provider {
  id: string;
  name: string;
  specialty: string;
}

interface ContactRequest {
  id: string;
  provider_id: string;
  reason: string;
  urgency: string;
  status: string;
  created_at: string;
  updated_at: string;
  providers?: {
    name: string;
  };
}

export function ProviderContactRequestForm({
  caseId,
}: ProviderContactRequestFormProps) {
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    provider_id: "",
    reason: "",
    urgency: "routine",
  });
  const [loading, setLoading] = useState(false);

  // Fetch providers
  useEffect(() => {
    const fetchProviders = async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("id, name, specialty")
        .eq("accepting_patients", true)
        .order("name");

      if (!error && data) {
        setProviders(data);
      }
    };

    fetchProviders();
  }, []);

  // Fetch requests
  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("provider_contact_requests")
      .select(
        `
        *,
        providers (
          name
        )
      `
      )
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`provider_requests:${caseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "provider_contact_requests",
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !formData.provider_id || !formData.reason.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("provider_contact_requests").insert({
        case_id: caseId,
        provider_id: formData.provider_id,
        requested_by: user.id,
        reason: formData.reason.trim(),
        urgency: formData.urgency,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Provider contact request submitted");
      setFormData({ provider_id: "", reason: "", urgency: "routine" });
      setShowForm(false);
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, urgency: string) => {
    if (urgency === "urgent") return "urgent";
    if (status === "pending") return "pending";
    if (status === "approved") return "approved";
    if (status === "completed") return "completed";
    if (status === "declined") return "declined";
    return "pending";
  };

  return (
    <div className="space-y-6">
      {/* Request Form */}
      <Card className="p-6 rounded-2xl border-2 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3
              className="text-lg font-semibold mb-1"
              style={{ color: "#0f2a6a", borderBottom: "2px solid #b09837" }}
            >
              Request Provider Contact
            </h3>
            <p className="text-sm text-muted-foreground">
              Submit a request for RN CM to coordinate provider communication
            </p>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              style={{ backgroundColor: "#b09837", color: "#000000" }}
              className="hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4 p-4 bg-muted/30 rounded-xl">
            <div>
              <label className="text-sm font-medium mb-2 block">Provider</label>
              <Select
                value={formData.provider_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, provider_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} - {p.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Reason for Contact
              </label>
              <Textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Describe the reason for contacting this provider..."
                className="min-h-[100px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Urgency</label>
              <Select
                value={formData.urgency}
                onValueChange={(value) =>
                  setFormData({ ...formData, urgency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.provider_id || !formData.reason.trim()}
                style={{ backgroundColor: "#b09837", color: "#000000" }}
                className="hover:opacity-90"
              >
                Submit Request
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Requests Table */}
      <Card className="rounded-2xl border-2 shadow-lg overflow-hidden">
        <div className="p-6">
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: "#0f2a6a", borderBottom: "2px solid #b09837" }}
          >
            Request History
          </h3>
          {requests.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No provider contact requests yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">
                      {req.providers?.name || "Unknown"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                    <TableCell>
                      {req.urgency === "urgent" ? (
                        <span className="text-xs font-semibold" style={{ color: "#ff7b7b" }}>
                          URGENT
                        </span>
                      ) : (
                        <span className="text-xs capitalize">{req.urgency}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadgeRCMS
                        status={getStatusBadge(req.status, req.urgency) as any}
                        lastUpdate={format(
                          new Date(req.updated_at),
                          "MMM d, h:mm a"
                        )}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(req.created_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
