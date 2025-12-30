import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, FileText, FileSpreadsheet, FileJson, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportOptions {
  format: "pdf" | "csv" | "json" | "excel";
  includeFields: string[];
  dateRange?: { from: Date; to: Date };
}

export default function ExportCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"cases" | "analytics" | "documents" | "communications">("cases");
  const [options, setOptions] = useState<ExportOptions>({
    format: "pdf",
    includeFields: ["all"]
  });
  const { toast } = useToast();

  const fieldOptions = {
    cases: ["Case Number", "Client Name", "Status", "Date Filed", "Settlement Amount", "Notes"],
    analytics: ["Performance Metrics", "Revenue Data", "Case Statistics", "Response Times"],
    documents: ["File Name", "Upload Date", "Category", "Size", "Tags"],
    communications: ["Date", "Client", "Message Type", "Subject", "Status"]
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate export

      if (options.format === "pdf") {
        exportToPDF();
      } else if (options.format === "csv") {
        exportToCSV();
      } else if (options.format === "json") {
        exportToJSON();
      }

      toast({ 
        title: "Export successful",
        description: `Your ${exportType} have been exported as ${options.format.toUpperCase()}`
      });
      setIsOpen(false);
    } catch (error) {
      toast({ 
        title: "Export failed",
        description: "There was an error exporting your data",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Attorney ${exportType.charAt(0).toUpperCase() + exportType.slice(1)} Report`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    // Sample data
    const tableData = [
      ["Case #2024-001", "John Smith", "Active", "$45,000"],
      ["Case #2024-002", "Sarah Johnson", "Settled", "$32,000"],
      ["Case #2024-003", "Mike Davis", "Active", "$78,000"]
    ];

    autoTable(doc, {
      head: [["Case Number", "Client", "Status", "Value"]],
      body: tableData,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`attorney-${exportType}-report.pdf`);
  };

  const exportToCSV = () => {
    const headers = ["Case Number", "Client Name", "Status", "Value"];
    const data = [
      ["Case #2024-001", "John Smith", "Active", "$45,000"],
      ["Case #2024-002", "Sarah Johnson", "Settled", "$32,000"],
      ["Case #2024-003", "Mike Davis", "Active", "$78,000"]
    ];

    const csv = [
      headers.join(","),
      ...data.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attorney-${exportType}-report.csv`;
    a.click();
  };

  const exportToJSON = () => {
    const data = {
      exportType,
      generatedAt: new Date().toISOString(),
      data: [
        { caseNumber: "Case #2024-001", client: "John Smith", status: "Active", value: 45000 },
        { caseNumber: "Case #2024-002", client: "Sarah Johnson", status: "Settled", value: 32000 },
        { caseNumber: "Case #2024-003", client: "Mike Davis", status: "Active", value: 78000 }
      ]
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attorney-${exportType}-report.json`;
    a.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Attorney Data</DialogTitle>
          <DialogDescription>
            Choose what data to export and in which format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Type */}
          <div className="space-y-2">
            <Label>What to Export</Label>
            <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cases">Cases & Case Data</SelectItem>
                <SelectItem value="analytics">Performance Analytics</SelectItem>
                <SelectItem value="documents">Documents & Files</SelectItem>
                <SelectItem value="communications">Client Communications</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: "pdf", icon: FileText, label: "PDF" },
                { value: "csv", icon: FileSpreadsheet, label: "CSV" },
                { value: "excel", icon: FileSpreadsheet, label: "Excel" },
                { value: "json", icon: FileJson, label: "JSON" }
              ].map(format => (
                <Card
                  key={format.value}
                  className={`p-4 cursor-pointer transition-all hover:border-primary ${
                    options.format === format.value ? "border-primary bg-accent" : ""
                  }`}
                  onClick={() => setOptions(prev => ({ ...prev, format: format.value as any }))}
                >
                  <format.icon className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm text-center font-medium">{format.label}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Field Selection */}
          <div className="space-y-2">
            <Label>Include Fields</Label>
            <Card className="p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="all" 
                  checked={options.includeFields.includes("all")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setOptions(prev => ({ ...prev, includeFields: ["all"] }));
                    }
                  }}
                />
                <label htmlFor="all" className="text-sm font-medium">
                  All Fields
                </label>
              </div>
              {fieldOptions[exportType].map(field => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox 
                    id={field}
                    disabled={options.includeFields.includes("all")}
                  />
                  <label htmlFor={field} className="text-sm">
                    {field}
                  </label>
                </div>
              ))}
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="flex-1"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {options.format.toUpperCase()}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
