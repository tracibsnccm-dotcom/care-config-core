// src/components/cases/CaseDocumentsPanel.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadCaseDocument } from "../../lib/rcmsDocuments";

type RcDocument = {
  id: string;
  case_id: string;
  uploaded_by: string;
  storage_object_path: string;
  file_name: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  created_at: string;
};

type Props = {
  caseId: string;
  currentUserId: string;
};

export const CaseDocumentsPanel: React.FC<Props> = ({
  caseId,
  currentUserId,
}) => {
  const [documents, setDocuments] = useState<RcDocument[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const loadDocuments = async () => {
    if (!caseId) return;

    setLoadingList(true);
    const { data, error } = await supabase
      .from("rc_documents")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading documents", error);
    } else {
      setDocuments((data ?? []) as RcDocument[]);
    }
    setLoadingList(false);
  };

  useEffect(() => {
    loadDocuments();
  }, [caseId]);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      await uploadCaseDocument(caseId, currentUserId, file);
      setFile(null);
      await loadDocuments();
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. Check console for details.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: RcDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("rcms-documents")
        .createSignedUrl(doc.storage_object_path, 60 * 15); // 15 minutes

      if (error || !data?.signedUrl) {
        console.error("signed URL error", { error, data });
        alert("Could not get download URL.");
        return;
      }

      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Download failed", error);
      alert("Download failed. Check console for details.");
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: 8 }}>
      <h3>Case Documents</h3>

      {/* Upload section */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="file"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
          }}
        />
        <button onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? "Uploading..." : "Upload Document"}
        </button>
      </div>

      {/* Documents list */}
      {loadingList ? (
        <div>Loading documents...</div>
      ) : documents.length === 0 ? (
        <div>No documents uploaded for this case yet.</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {documents.map((doc) => (
            <li
              key={doc.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.5rem 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <div>
                <div>{doc.file_name}</div>
                <small>
                  {doc.mime_type || "Unknown type"} ·{" "}
                  {new Date(doc.created_at).toLocaleString()}
                </small>
              </div>
              <button onClick={() => handleDownload(doc)}>Download</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
