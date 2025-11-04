import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, AlertTriangle, Shield } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DiaryEntry {
  id: string;
  title: string;
  description?: string;
  entry_type: string;
  scheduled_date: string;
  scheduled_time?: string;
  location?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  completion_status: string;
  outcome_notes?: string;
  priority?: string;
  metadata?: any;
}

interface DiaryPDFExportProps {
  entries: DiaryEntry[];
  dateFrom?: string;
  dateTo?: string;
  rnName?: string;
}

export function DiaryPDFExport({ entries, dateFrom, dateTo, rnName }: DiaryPDFExportProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeContactInfo: false,
    includeOutcomes: true,
    includeLocations: false,
    acknowledgement: false,
  });

  const logExport = async (entriesCount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        action: "diary_pdf_export",
        meta: {
          entries_count: entriesCount,
          date_from: dateFrom,
          date_to: dateTo,
          included_contact_info: exportOptions.includeContactInfo,
          included_outcomes: exportOptions.includeOutcomes,
          included_locations: exportOptions.includeLocations,
        },
      });
    } catch (error) {
      console.error("Failed to log export:", error);
    }
  };

  const handleExportClick = () => {
    setShowWarning(true);
  };

  const generatePDF = async () => {
    if (!exportOptions.acknowledgement) {
      toast.error("Please acknowledge HIPAA compliance requirements");
      return;
    }
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(15, 42, 106);
      doc.text("RN Case Manager Diary Report", pageWidth / 2, 20, { align: "center" });
      
      // Date range
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      let subtitle = "Generated: " + format(new Date(), "MMM d, yyyy 'at' h:mm a");
      if (dateFrom || dateTo) {
        const from = dateFrom ? format(new Date(dateFrom), "MMM d, yyyy") : "Start";
        const to = dateTo ? format(new Date(dateTo), "MMM d, yyyy") : "End";
        subtitle += ` | Period: ${from} - ${to}`;
      }
      if (rnName) {
        subtitle += ` | RN: ${rnName}`;
      }
      doc.text(subtitle, pageWidth / 2, 28, { align: "center" });
      
      // Summary stats
      const completed = entries.filter(e => e.completion_status === "completed").length;
      const pending = entries.filter(e => e.completion_status === "pending").length;
      const overdue = entries.filter(e => e.completion_status === "overdue").length;
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Entries: ${entries.length} | Completed: ${completed} | Pending: ${pending} | Overdue: ${overdue}`, 14, 38);
      
      // Entry details table - with PHI protection
      const tableData = entries.map(entry => {
        const row = [
          format(new Date(entry.scheduled_date), "MMM d, yyyy"),
          entry.scheduled_time?.slice(0, 5) || "-",
          entry.title,
          entry.entry_type.replace("_", " "),
          entry.completion_status,
          entry.priority || "normal",
        ];
        
        // Only include location if option is enabled
        if (exportOptions.includeLocations) {
          row.push(entry.location || "-");
        } else {
          row.push("[Redacted]");
        }
        
        // Only include outcome if option is enabled
        if (exportOptions.includeOutcomes) {
          row.push(entry.outcome_notes || "-");
        } else {
          row.push("[Redacted - PHI Protected]");
        }
        
        return row;
      });
      
      autoTable(doc, {
        startY: 45,
        head: [["Date", "Time", "Title", "Type", "Status", "Priority", "Location", "Outcome"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 42, 106], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 15 },
          2: { cellWidth: 35 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 18 },
          6: { cellWidth: 25 },
          7: { cellWidth: 35 }
        }
      });
      
      // Detailed entries section
      let yPos = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFontSize(14);
      doc.setTextColor(15, 42, 106);
      doc.text("Detailed Entry Notes", 14, yPos);
      yPos += 8;
      
      entries.forEach((entry, index) => {
        // Check if we need a new page
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, "bold");
        doc.text(`${index + 1}. ${entry.title}`, 14, yPos);
        yPos += 6;
        
        doc.setFont(undefined, "normal");
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        
        const details = [
          `Date: ${format(new Date(entry.scheduled_date), "MMM d, yyyy")} ${entry.scheduled_time ? "at " + entry.scheduled_time.slice(0, 5) : ""}`,
          `Type: ${entry.entry_type.replace("_", " ")} | Status: ${entry.completion_status} | Priority: ${entry.priority || "normal"}`,
        ];
        
        // PHI Protection - only include if options enabled
        if (exportOptions.includeLocations && entry.location) {
          details.push(`Location: ${entry.location}`);
        }
        
        if (exportOptions.includeContactInfo) {
          if (entry.contact_name) details.push(`Contact: ${entry.contact_name}`);
          if (entry.contact_phone) details.push(`Phone: ${entry.contact_phone}`);
          if (entry.contact_email) details.push(`Email: ${entry.contact_email}`);
        }
        
        if (entry.description) details.push(`Description: ${entry.description}`);
        
        if (exportOptions.includeOutcomes && entry.outcome_notes) {
          details.push(`Outcome: ${entry.outcome_notes}`);
        }
        
        details.forEach(detail => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          const lines = doc.splitTextToSize(detail, pageWidth - 28);
          doc.text(lines, 18, yPos);
          yPos += lines.length * 5;
        });
        
        yPos += 5; // Space between entries
      });
      
      // HIPAA Compliance Watermark
      doc.setFontSize(60);
      doc.setTextColor(255, 0, 0, 0.05);
      doc.text("CONFIDENTIAL - HIPAA PROTECTED", pageWidth / 2, doc.internal.pageSize.getHeight() / 2, {
        align: "center",
        angle: 45,
      });

      // Footer with strong warning
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount} | CONFIDENTIAL - HIPAA PROTECTED HEALTH INFORMATION`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
        doc.setTextColor(200, 0, 0);
        doc.text(
          "⚠ UNAUTHORIZED DISCLOSURE PROHIBITED - Store Securely & Dispose Properly",
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 6,
          { align: "center" }
        );
      }
      
      // Save with timestamp for audit trail
      const fileName = `RN_Diary_CONFIDENTIAL_${format(new Date(), "yyyy-MM-dd_HHmmss")}.pdf`;
      doc.save(fileName);
      
      // Log the export
      await logExport(entries.length);
      
      setShowWarning(false);
      toast.success("Secure PDF exported - Remember to store in HIPAA-compliant location!", {
        duration: 6000,
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <>
      <Button onClick={handleExportClick} variant="outline">
        <Download className="h-4 w-4 mr-2" />
        Export to PDF
      </Button>

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="h-6 w-6" />
              <DialogTitle className="text-xl">HIPAA Compliance Warning</DialogTitle>
            </div>
            <DialogDescription className="space-y-4 text-left">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-semibold text-red-900 mb-2">
                  ⚠ You are about to export Protected Health Information (PHI)
                </p>
                <p className="text-sm text-red-800">
                  This PDF will contain patient health information protected under HIPAA regulations. 
                  Unauthorized disclosure may result in civil and criminal penalties.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1">Security Requirements</h4>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Store in encrypted, HIPAA-compliant location only</li>
                      <li>Do not email or share via unsecured channels</li>
                      <li>Dispose properly when no longer needed (shred physical copies)</li>
                      <li>Access limited to authorized personnel only</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Export Options (PHI Protection):</h4>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="includeOutcomes"
                      checked={exportOptions.includeOutcomes}
                      onCheckedChange={(checked) =>
                        setExportOptions({ ...exportOptions, includeOutcomes: !!checked })
                      }
                    />
                    <Label htmlFor="includeOutcomes" className="text-sm cursor-pointer">
                      Include outcome notes (may contain clinical PHI)
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="includeLocations"
                      checked={exportOptions.includeLocations}
                      onCheckedChange={(checked) =>
                        setExportOptions({ ...exportOptions, includeLocations: !!checked })
                      }
                    />
                    <Label htmlFor="includeLocations" className="text-sm cursor-pointer">
                      Include appointment locations
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="includeContactInfo"
                      checked={exportOptions.includeContactInfo}
                      onCheckedChange={(checked) =>
                        setExportOptions({ ...exportOptions, includeContactInfo: !!checked })
                      }
                    />
                    <Label htmlFor="includeContactInfo" className="text-sm cursor-pointer">
                      Include contact phone/email (personal identifiers)
                    </Label>
                  </div>
                </div>

                <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <Checkbox
                    id="acknowledgement"
                    checked={exportOptions.acknowledgement}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, acknowledgement: !!checked })
                    }
                  />
                  <Label htmlFor="acknowledgement" className="text-sm font-semibold cursor-pointer">
                    I acknowledge that I am authorized to export this PHI and will handle it in 
                    compliance with HIPAA regulations and organizational policies.
                  </Label>
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic">
                Note: This export action will be logged in the audit trail for compliance purposes.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarning(false)}>
              Cancel
            </Button>
            <Button 
              onClick={generatePDF}
              disabled={!exportOptions.acknowledgement}
              className="bg-red-600 hover:bg-red-700"
            >
              <Shield className="h-4 w-4 mr-2" />
              Proceed with Secure Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
