/**
 * Attorney Print Report Button
 * 
 * Allows attorneys to print/export released RN reports only.
 * Safety guards ensure only released/closed cases can be printed.
 */

import React from "react";
import { CaseSummary } from "../constants/reconcileFramework";
import { CaseWithRevision } from "../lib/resolveLatestReleasedCase";
import { buildAttorneyPrintHtml } from "./print/buildAttorneyPrintHtml";
import { buildAttorneyPrintText } from "./print/buildAttorneyPrintText";
import { logExportAudit, getExportFileName } from "../lib/exportAudit";

interface AttorneyPrintReportButtonProps {
  resolvedCase: CaseWithRevision | null;
  summary: CaseSummary | null;
  clientLabel?: string;
}

export const AttorneyPrintReportButton: React.FC<AttorneyPrintReportButtonProps> = ({
  resolvedCase,
  summary,
  clientLabel,
}) => {

  const handlePrint = async () => {
    if (!resolvedCase) {
      alert("Exports are available only for released snapshots.");
      return;
    }

    // Runtime guard: Only allow printing if case is released or closed
    const status = (resolvedCase.case_status || "").toLowerCase();
    if (status !== "released" && status !== "closed") {
      alert("Exports are available only for released snapshots.");
      return;
    }

    // Pass whatever ID we have (even if it's a display ID like "CASE-001")
    // The logExportAudit function will resolve it to a UUID
    const releasedCaseId = resolvedCase.id;
    const revisionChainRootCaseId = resolvedCase.id; // Pass same value, resolver will handle it

    // TEMP: Diagnostic logging - IDs being passed to audit
    console.info('[EXPORT AUDIT] ids', {
      releasedCaseId: releasedCaseId,
      revisionChainRootCaseId: revisionChainRootCaseId,
    });

    // Log export audit BEFORE triggering print (best-effort, don't block export)
    logExportAudit({
      attorneyId: null, // Will be resolved by database if needed
      clientId: null, // Will be resolved by database if needed
      revisionChainRootCaseId: revisionChainRootCaseId,
      releasedCaseId: releasedCaseId,
      exportAction: "PRINT_PDF",
      exportFormat: "PDF",
      exportLabel: "Export Released RN Case Snapshot",
      fileName: getExportFileName(
        {
          case_id: releasedCaseId,
          released_at: resolvedCase.released_at || resolvedCase.updated_at || resolvedCase.created_at || undefined,
        },
        "PDF"
      ),
    }).catch((error) => {
      // Logging failed but don't interrupt export
      console.warn("[AttorneyPrintReportButton] Audit logging failed, continuing with export:", error);
    });

    // Build the print HTML
    const html = buildAttorneyPrintHtml(resolvedCase, summary, clientLabel);

    // Open a new window and write the HTML
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print this report.");
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load, then trigger print
    // Use both onload and setTimeout as fallbacks
    const triggerPrint = () => {
      setTimeout(() => {
        printWindow.print();
        // Optionally close after printing (user can cancel)
        // printWindow.close();
      }, 250);
    };

    if (printWindow.document.readyState === "complete") {
      triggerPrint();
    } else {
      printWindow.onload = triggerPrint;
      // Fallback timeout in case onload doesn't fire
      setTimeout(triggerPrint, 500);
    }
  };

  const handleDownloadText = async () => {
    if (!resolvedCase) {
      alert("Exports are available only for released snapshots.");
      return;
    }

    // Runtime guard: Only allow export if case is released or closed
    const status = (resolvedCase.case_status || "").toLowerCase();
    if (status !== "released" && status !== "closed") {
      alert("Exports are available only for released snapshots.");
      return;
    }

    // Pass whatever ID we have (even if it's a display ID like "CASE-001")
    // The logExportAudit function will resolve it to a UUID
    const releasedCaseId = resolvedCase.id;
    const revisionChainRootCaseId = resolvedCase.id; // Pass same value, resolver will handle it

    // Generate filename
    const releasedAt = resolvedCase.released_at || resolvedCase.updated_at || resolvedCase.created_at;
    const releasedDateStr = releasedAt
      ? new Date(releasedAt).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    const sanitizedCaseId = releasedCaseId.replace(/[^a-zA-Z0-9-_]/g, "_");
    const filename = `reconcile-care-rn-report_${sanitizedCaseId}_${releasedDateStr}.txt`;

    // TEMP: Diagnostic logging - IDs being passed to audit
    console.info('[EXPORT AUDIT] ids', {
      releasedCaseId: releasedCaseId,
      revisionChainRootCaseId: revisionChainRootCaseId,
    });

    // Log export audit BEFORE file download (best-effort, don't block export)
    logExportAudit({
      attorneyId: null, // Will be resolved by database if needed
      clientId: null, // Will be resolved by database if needed
      revisionChainRootCaseId: revisionChainRootCaseId,
      releasedCaseId: releasedCaseId,
      exportAction: "DOWNLOAD_TEXT",
      exportFormat: "TEXT",
      exportLabel: "Export Released RN Case Snapshot",
      fileName: filename,
    }).catch((error) => {
      // Logging failed but don't interrupt export
      console.warn("[AttorneyPrintReportButton] Audit logging failed, continuing with export:", error);
    });

    // Build the plaintext content
    const text = buildAttorneyPrintText(resolvedCase, summary, clientLabel);

    // Create blob and download
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const status = resolvedCase ? (resolvedCase.case_status || "").toLowerCase() : "";
  const isReleased = status === "released" || status === "closed";

  return (
    <div style={{ marginTop: "0.5rem" }}>
      {/* Title */}
      <div
        style={{
          fontSize: "0.92rem",
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: "0.25rem",
        }}
      >
        Export Released RN Case Snapshot
      </div>

      {/* Helper text */}
      <div
        style={{
          fontSize: "0.8rem",
          color: "#64748b",
          marginBottom: "0.5rem",
          lineHeight: 1.4,
        }}
      >
        Exports the authoritative RN care narrative from the latest released/closed case revision.
        This is not tied to individual preview cards below.
      </div>

      {/* Buttons or disabled message */}
      {!resolvedCase || !isReleased ? (
        <div style={{ fontSize: "0.85rem", color: "#64748b", fontStyle: "italic" }}>
          Only released reports can be exported.
        </div>
      ) : (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: "999px",
              border: "1px solid #0f2a6a",
              background: "#0f2a6a",
              color: "#ffffff",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
            title="Print or save as PDF"
          >
            <span>🖨️</span>
            <span>Print / Save PDF</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadText}
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: "999px",
              border: "1px solid #0f2a6a",
              background: "#ffffff",
              color: "#0f2a6a",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
            title="Download as plaintext file"
          >
            <span>📄</span>
            <span>Download Text</span>
          </button>
        </div>
      )}
    </div>
  );
};
