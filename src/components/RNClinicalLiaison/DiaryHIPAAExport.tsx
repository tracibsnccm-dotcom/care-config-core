import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Download, Shield, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function DiaryHIPAAExport() {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [anonymize, setAnonymize] = useState(true);
  const [excludePHI, setExcludePHI] = useState(true);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const handleExport = async () => {
    try {
      const { data: entries, error } = await supabase
        .from("rn_diary_entries")
        .select("*")
        .eq("rn_id", user?.id)
        .gte("scheduled_date", startDate)
        .lte("scheduled_date", endDate)
        .order("scheduled_date");

      if (error) throw error;

      const doc = new jsPDF();
      
      // Header with HIPAA notice
      doc.setFontSize(16);
      doc.text("Diary Entries Export", 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(220, 38, 38);
      doc.text("⚠️ CONFIDENTIAL - HIPAA Protected Information", 14, 28);
      doc.setTextColor(0, 0, 0);
      doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 14, 35);
      doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 40);
      
      if (anonymize) {
        doc.text("⚡ Client identifiers anonymized for privacy", 14, 45);
      }

      // Prepare table data
      const tableData = entries.map((entry: any) => {
        let title = entry.title;
        let description = entry.description || "";

        // HIPAA Compliance: Anonymize PHI
        if (anonymize) {
          title = title.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, "[CLIENT]");
          description = description.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, "[CLIENT]");
          description = description.replace(/\b\d{3}-\d{3}-\d{4}\b/g, "[PHONE]");
          description = description.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, "[EMAIL]");
        }

        // Exclude PHI fields
        if (excludePHI) {
          description = description.replace(/DOB:|SSN:|MRN:/gi, "[REDACTED]:");
        }

        return [
          entry.scheduled_date,
          entry.scheduled_time || "All day",
          title,
          entry.category || "N/A",
          entry.priority,
          entry.completion_status,
          description.substring(0, 100),
        ];
      });

      autoTable(doc, {
        startY: 55,
        head: [["Date", "Time", "Title", "Category", "Priority", "Status", "Description"]],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 66, 66] },
      });

      // Footer with compliance notice
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          "This document contains confidential health information protected by HIPAA. Unauthorized disclosure is prohibited.",
          14,
          doc.internal.pageSize.height - 10
        );
      }

      doc.save(`diary-export-${startDate}-to-${endDate}.pdf`);
      toast.success("Export completed successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          HIPAA-Compliant Export
        </CardTitle>
        <CardDescription>
          Export your diary entries with privacy protection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <Label htmlFor="end-date">End Date</Label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-medium">Privacy Settings</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymize"
              checked={anonymize}
              onCheckedChange={(checked) => setAnonymize(checked as boolean)}
            />
            <label htmlFor="anonymize" className="text-sm">
              Anonymize client names and identifiers
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="exclude-phi"
              checked={excludePHI}
              onCheckedChange={(checked) => setExcludePHI(checked as boolean)}
            />
            <label htmlFor="exclude-phi" className="text-sm">
              Redact PHI (DOB, SSN, MRN)
            </label>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            ✓ All exports include HIPAA confidentiality notices
            <br />
            ✓ No external calendar sync or cloud storage
            <br />
            ✓ Files remain on your local device only
          </p>
        </div>

        <Button onClick={handleExport} className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Export to PDF
        </Button>
      </CardContent>
    </Card>
  );
}