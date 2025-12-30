import { useState, useEffect } from "react";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Download, Calendar } from "lucide-react";
import { format } from "date-fns";

interface DocumentShare {
  id: string;
  case_id: string;
  document_ids: any;
  notes: string | null;
  approved_at: string;
  case_label?: string;
  client_name?: string;
}

interface Document {
  id: string;
  file_name: string;
  document_type: string;
  created_at: string;
}

export function ProviderDocumentViewer() {
  const { user } = useAuth();
  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [documents, setDocuments] = useState<{ [key: string]: Document[] }>({});
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProviderAndShares();
    }
  }, [user]);

  async function fetchProviderAndShares() {
    try {
      setLoading(true);

      // Get provider ID
      const { data: provider, error: providerError } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (providerError) throw providerError;

      if (provider) {
        setProviderId(provider.id);

        // Fetch approved document shares
        const { data: sharesData, error: sharesError } = await supabase
          .from("appointment_document_shares")
          .select("*")
          .eq("provider_id", provider.id)
          .eq("status", "approved")
          .order("approved_at", { ascending: false });

        if (sharesError) throw sharesError;

        // Fetch case labels
        const sharesWithInfo = await Promise.all(
          (sharesData || []).map(async (share: any) => {
            const { data: caseData } = await supabase
              .from("cases")
              .select("client_label")
              .eq("id", share.case_id)
              .maybeSingle();

            const docIds = Array.isArray(share.document_ids) 
              ? share.document_ids 
              : [];

            return {
              id: share.id,
              case_id: share.case_id,
              document_ids: docIds,
              notes: share.notes,
              approved_at: share.approved_at || new Date().toISOString(),
              case_label: caseData?.client_label || "Unknown Case",
            };
          })
        );

        setShares(sharesWithInfo);

        // Fetch documents for each share
        for (const share of sharesWithInfo) {
          if (share.document_ids && share.document_ids.length > 0) {
            const docIds = share.document_ids.filter((id: any) => typeof id === 'string');
            
            if (docIds.length > 0) {
              const { data: docsData } = await supabase
                .from("documents")
                .select("id, file_name, document_type, created_at")
                .in("id", docIds);

              if (docsData && docsData.length > 0) {
                setDocuments((prev) => ({
                  ...prev,
                  [share.id]: docsData,
                }));
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load shared documents");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(docId: string, fileName: string) {
    try {
      // Get the document URL from storage
      const { data: docData } = await supabase
        .from("documents")
        .select("file_path")
        .eq("id", docId)
        .maybeSingle();

      if (docData?.file_path) {
        const { data } = supabase.storage
          .from("documents")
          .getPublicUrl(docData.file_path);

        if (data?.publicUrl) {
          const link = document.createElement("a");
          link.href = data.publicUrl;
          link.download = fileName;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
      
      toast.success("Opening document");
    } catch (error) {
      console.error("Error opening document:", error);
      toast.error("Failed to open document");
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Loading shared documents...</p>
      </Card>
    );
  }

  if (!providerId) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Please complete your provider profile first
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Shared Documents</h2>
        <Badge variant="secondary" className="ml-auto">
          {shares.length} Share{shares.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {shares.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No documents have been shared with you yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {shares.map((share) => (
            <Card key={share.id} className="p-4 border-l-4 border-l-success">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{share.case_label}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Approved: {format(new Date(share.approved_at), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </div>
                  <Badge variant="default">Approved</Badge>
                </div>

                {share.notes && (
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      <strong>Notes:</strong> {share.notes}
                    </p>
                  </div>
                )}

                {/* Documents */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Shared Documents:</h4>
                  <div className="space-y-2">
                    {documents[share.id] && documents[share.id].length > 0 ? (
                      documents[share.id].map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-background border rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="w-4 h-4 text-primary" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.document_type || "Document"} •{" "}
                                {format(new Date(doc.created_at), "MMM dd, yyyy")}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleDownload(doc.id, doc.file_name)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No documents available</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
