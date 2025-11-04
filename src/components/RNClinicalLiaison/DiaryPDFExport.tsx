import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

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
  const generatePDF = () => {
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
      
      // Entry details table
      const tableData = entries.map(entry => [
        format(new Date(entry.scheduled_date), "MMM d, yyyy"),
        entry.scheduled_time?.slice(0, 5) || "-",
        entry.title,
        entry.entry_type.replace("_", " "),
        entry.completion_status,
        entry.priority || "normal",
        entry.location || "-",
        entry.outcome_notes || "-"
      ]);
      
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
        
        if (entry.location) details.push(`Location: ${entry.location}`);
        if (entry.contact_name) details.push(`Contact: ${entry.contact_name}`);
        if (entry.contact_phone) details.push(`Phone: ${entry.contact_phone}`);
        if (entry.contact_email) details.push(`Email: ${entry.contact_email}`);
        if (entry.description) details.push(`Description: ${entry.description}`);
        if (entry.outcome_notes) details.push(`Outcome: ${entry.outcome_notes}`);
        
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
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount} | RN Case Manager Diary | Confidential`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }
      
      // Save
      const fileName = `RN_Diary_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      doc.save(fileName);
      
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <Button onClick={generatePDF} variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Export to PDF
    </Button>
  );
}
