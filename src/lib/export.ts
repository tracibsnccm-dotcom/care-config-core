import { Case } from "@/config/rcms";
import { fmtDate } from "./store";

export function exportCSV(theCase: Case): void {
  const rows = [
    ["RCMS ID", theCase.client.rcmsId],
    ["Attorney Ref", theCase.client.attyRef],
    ["DOB Masked", theCase.client.dobMasked],
    ["Incident", theCase.intake.incidentType],
    ["Incident Date", theCase.intake.incidentDate],
    ["Initial Tx", theCase.intake.initialTreatment],
    ["Injuries", theCase.intake.injuries.join("; ")],
    ["Severity", String(theCase.intake.severitySelfScore)],
    ["Consent", theCase.consent.signed ? "Signed" : "Not signed"],
    ["Restricted", theCase.consent.restrictedAccess ? "Yes" : "No"],
    ["Status", theCase.status],
  ];
  
  const csv = rows
    .map((r) =>
      r.map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rcms_case_${theCase.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDFStub(theCase: Case): void {
  const w = window.open("", "_blank");
  if (!w) return;
  
  w.document.write(`<html><head><title>RCMS PDF Stub</title><style>
    body { font-family: system-ui, sans-serif; padding: 24px; }
    h1 { font-size: 20px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    td { border-bottom: 1px solid #ddd; padding: 8px; vertical-align: top; }
    @media print { @page { margin: 12mm; } }
  </style></head><body>
    <h1>RCMS Case Export (Stub)</h1>
    <table>
      <tr><td><b>RCMS ID</b></td><td>${theCase.client.rcmsId}</td></tr>
      <tr><td><b>Attorney Ref</b></td><td>${theCase.client.attyRef}</td></tr>
      <tr><td><b>DOB Masked</b></td><td>${theCase.client.dobMasked}</td></tr>
      <tr><td><b>Incident</b></td><td>${theCase.intake.incidentType} on ${fmtDate(theCase.intake.incidentDate)}</td></tr>
      <tr><td><b>Initial Tx</b></td><td>${theCase.intake.initialTreatment}</td></tr>
      <tr><td><b>Injuries</b></td><td>${theCase.intake.injuries.join(", ")}</td></tr>
      <tr><td><b>Severity</b></td><td>${theCase.intake.severitySelfScore}</td></tr>
      <tr><td><b>Consent</b></td><td>${theCase.consent.signed ? "Signed" : "Not signed"}${theCase.consent.restrictedAccess ? " (Restricted)" : ""}</td></tr>
      <tr><td><b>Status</b></td><td>${theCase.status}</td></tr>
    </table>
    <p style="margin-top:12px;color:#666">PDF is a demo stub. In production, generate on server with access checks & watermark.</p>
    <script>window.print()</script>
  </body></html>`);
}
