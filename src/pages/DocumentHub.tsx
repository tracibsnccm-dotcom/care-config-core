import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Eye,
  Download,
  RefreshCw,
  Search,
  Filter,
  FolderOpen,
  Clock,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/supabaseAuth";

interface Document {
  id: string;
  dateUploaded: Date;
  fileName: string;
  caseId: string;
  uploadedBy: string;
  type: "Clinical Report" | "Legal Filing" | "Client Form" | "Provider Note";
  status: "pending" | "reviewed" | "archived";
  readBy: string[]; // user IDs who have read this document
  requiresImmediateAttention: boolean;
}

// Mock data - in production, this would come from the database
const mockDocuments: Document[] = [
  {
    id: "1",
    dateUploaded: new Date("2025-10-31T14:30:00"),
    fileName: "urgent_medical_update.pdf",
    caseId: "CASE-2024-007",
    uploadedBy: "Dr. Johnson (Provider)",
    type: "Clinical Report",
    status: "pending",
    readBy: [],
    requiresImmediateAttention: true,
  },
  {
    id: "2",
    dateUploaded: new Date("2025-10-31T10:15:00"),
    fileName: "critical_legal_filing.pdf",
    caseId: "CASE-2024-008",
    uploadedBy: "Lisa Chen (Attorney)",
    type: "Legal Filing",
    status: "pending",
    readBy: [],
    requiresImmediateAttention: true,
  },
  {
    id: "3",
    dateUploaded: new Date("2025-10-30T16:45:00"),
    fileName: "new_consent_form.pdf",
    caseId: "CASE-2024-002",
    uploadedBy: "Client Portal",
    type: "Client Form",
    status: "pending",
    readBy: [],
    requiresImmediateAttention: false,
  },
  {
    id: "4",
    dateUploaded: new Date("2025-10-29T09:20:00"),
    fileName: "medical_records_summary.pdf",
    caseId: "CASE-2024-001",
    uploadedBy: "Maria Garcia (RN-CCM)",
    type: "Clinical Report",
    status: "reviewed",
    readBy: ["user-123"],
    requiresImmediateAttention: false,
  },
  {
    id: "5",
    dateUploaded: new Date("2025-10-28T11:30:00"),
    fileName: "discovery_motion.pdf",
    caseId: "CASE-2024-003",
    uploadedBy: "Lisa Chen (Attorney)",
    type: "Legal Filing",
    status: "pending",
    readBy: [],
    requiresImmediateAttention: false,
  },
  {
    id: "6",
    dateUploaded: new Date("2025-10-27T14:00:00"),
    fileName: "provider_visit_notes.pdf",
    caseId: "CASE-2024-005",
    uploadedBy: "Dr. Smith (Provider)",
    type: "Provider Note",
    status: "pending",
    readBy: [],
    requiresImmediateAttention: false,
  },
  {
    id: "7",
    dateUploaded: new Date("2025-10-26T10:00:00"),
    fileName: "settlement_analysis.pdf",
    caseId: "CASE-2024-003",
    uploadedBy: "Lisa Chen (Attorney)",
    type: "Clinical Report",
    status: "reviewed",
    readBy: ["user-123"],
    requiresImmediateAttention: false,
  },
];

export default function DocumentHub() {
  const { cases } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentUserId = user?.id || "user-123"; // Fallback for demo
  
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [selectedCase, setSelectedCase] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof Document>("dateUploaded");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    if (selectedCase !== "all" && doc.caseId !== selectedCase) return false;
    if (selectedType !== "all" && doc.type !== selectedType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        doc.fileName.toLowerCase().includes(query) ||
        doc.caseId.toLowerCase().includes(query) ||
        doc.uploadedBy.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Separate urgent documents that need immediate attention
  const urgentDocuments = filteredDocuments.filter(
    doc => doc.requiresImmediateAttention && !doc.readBy.includes(currentUserId)
  );
  
  // Regular documents (excluding urgent unread ones)
  const regularDocuments = filteredDocuments.filter(
    doc => !doc.requiresImmediateAttention || doc.readBy.includes(currentUserId)
  );

  // Sort documents by date (latest first by default)
  const sortedUrgent = [...urgentDocuments].sort((a, b) => 
    b.dateUploaded.getTime() - a.dateUploaded.getTime()
  );
  
  const sortedDocuments = [...regularDocuments].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (aVal instanceof Date && bVal instanceof Date) {
      return sortDirection === "asc" 
        ? aVal.getTime() - bVal.getTime()
        : bVal.getTime() - aVal.getTime();
    }
    
    const aStr = String(aVal);
    const bStr = String(bVal);
    return sortDirection === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  const handleSort = (column: keyof Document) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const markAsRead = (docId: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === docId && !doc.readBy.includes(currentUserId)) {
        return { ...doc, readBy: [...doc.readBy, currentUserId] };
      }
      return doc;
    }));
  };

  const totalDocuments = documents.length;
  const awaitingReview = documents.filter(d => d.status === "pending").length;
  const lastUpdated = documents.length > 0 
    ? format(Math.max(...documents.map(d => d.dateUploaded.getTime())), "MMM dd, yyyy")
    : "N/A";

  const getDocumentTypeColor = (type: Document["type"]) => {
    switch (type) {
      case "Clinical Report":
        return "bg-[#128f8b]/10 text-[#128f8b] border-[#128f8b]/20";
      case "Legal Filing":
        return "bg-[#0f2a6a]/10 text-[#0f2a6a] border-[#0f2a6a]/20";
      case "Client Form":
        return "bg-[#b09837]/10 text-[#b09837] border-[#b09837]/20";
      case "Provider Note":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-[#b09837]" />
            Documents & Files
          </h1>
          <p className="text-muted-foreground mt-2">
            Access and manage reports, case files, and uploaded documents in one secure location.
          </p>
        </div>

        {/* Sidebar Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 border-[#128f8b]/20">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-[#128f8b]" />
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold text-foreground">{totalDocuments}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-[#b09837]/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-[#b09837]" />
              <div>
                <p className="text-sm text-muted-foreground">Awaiting Review</p>
                <p className="text-2xl font-bold text-foreground">{awaitingReview}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-[#0f2a6a]/20">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-[#0f2a6a]" />
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-lg font-bold text-foreground">{lastUpdated}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 mb-6 border-border">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Filter & Search</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Select Case
              </label>
              <Select value={selectedCase} onValueChange={setSelectedCase}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All Cases" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">All Cases</SelectItem>
                  {cases.slice(0, 10).map((caseItem) => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Document Type
              </label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Clinical Report">Clinical Report</SelectItem>
                  <SelectItem value="Legal Filing">Legal Filing</SelectItem>
                  <SelectItem value="Client Form">Client Form</SelectItem>
                  <SelectItem value="Provider Note">Provider Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Search by Keyword
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by file name, case ID, or uploader..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button className="bg-[#b09837] text-black hover:bg-black hover:text-[#b09837] transition-colors font-medium">
              <Upload className="w-4 h-4 mr-2" />
              Upload New Document
            </Button>
          </div>
        </Card>

        {/* Awaiting Review Section - Urgent Files */}
        {sortedUrgent.length > 0 && (
          <Card className="border-orange-500/50 mb-6 bg-orange-50/50 dark:bg-orange-950/20">
            <div className="p-4 border-b border-orange-500/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 animate-pulse" />
                <h3 className="font-bold text-orange-900 dark:text-orange-100">
                  Awaiting Review - Requires Immediate Attention
                </h3>
                <Badge className="bg-orange-600 text-white ml-2">
                  {sortedUrgent.length}
                </Badge>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="font-semibold">Date & Time</TableHead>
                    <TableHead className="font-semibold">File Name</TableHead>
                    <TableHead className="font-semibold">Case ID</TableHead>
                    <TableHead className="font-semibold">Uploaded By</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUrgent.map((doc) => (
                    <TableRow
                      key={doc.id}
                      className="animate-pulse-orange hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors cursor-pointer"
                      onClick={() => {
                        markAsRead(doc.id);
                        navigate(`/cases/${doc.caseId}`);
                      }}
                    >
                      <TableCell className="font-medium">
                        {format(doc.dateUploaded, "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <span className="truncate max-w-xs font-semibold text-orange-900 dark:text-orange-100">
                            {doc.fileName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{doc.caseId}</span>
                      </TableCell>
                      <TableCell className="text-sm">{doc.uploadedBy}</TableCell>
                      <TableCell>
                        <Badge className={getDocumentTypeColor(doc.type)}>
                          {doc.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[#128f8b] hover:text-[#128f8b] hover:bg-[#128f8b]/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(doc.id);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[#0f2a6a] hover:text-[#0f2a6a] hover:bg-[#0f2a6a]/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Regular Documents Table */}
        <Card className="border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold text-foreground">All Documents</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead 
                    className="cursor-pointer select-none font-semibold"
                    onClick={() => handleSort("dateUploaded")}
                  >
                    Date & Time {sortColumn === "dateUploaded" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none font-semibold"
                    onClick={() => handleSort("fileName")}
                  >
                    File Name {sortColumn === "fileName" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none font-semibold"
                    onClick={() => handleSort("caseId")}
                  >
                    Case ID {sortColumn === "caseId" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none font-semibold"
                    onClick={() => handleSort("uploadedBy")}
                  >
                    Uploaded By {sortColumn === "uploadedBy" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none font-semibold"
                    onClick={() => handleSort("type")}
                  >
                    Type {sortColumn === "type" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No documents found</p>
                      <p className="text-sm mt-1">Try adjusting your filters or upload a new document</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedDocuments.map((doc) => {
                    const isUnread = !doc.readBy.includes(currentUserId);
                    return (
                      <TableRow
                        key={doc.id}
                        className={`transition-colors cursor-pointer ${
                          isUnread 
                            ? 'bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100 dark:hover:bg-yellow-950/30' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          markAsRead(doc.id);
                          navigate(`/cases/${doc.caseId}`);
                        }}
                      >
                        <TableCell className="font-medium">
                          {format(doc.dateUploaded, "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className={`w-4 h-4 ${isUnread ? 'text-yellow-600' : 'text-muted-foreground'}`} />
                            <span className={`truncate max-w-xs ${isUnread ? 'font-semibold' : ''}`}>
                              {doc.fileName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{doc.caseId}</span>
                        </TableCell>
                        <TableCell className="text-sm">{doc.uploadedBy}</TableCell>
                        <TableCell>
                          <Badge className={getDocumentTypeColor(doc.type)}>
                            {doc.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[#128f8b] hover:text-[#128f8b] hover:bg-[#128f8b]/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(doc.id);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[#0f2a6a] hover:text-[#0f2a6a] hover:bg-[#0f2a6a]/10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[#b09837] hover:text-[#b09837] hover:bg-[#b09837]/10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
      
      <style>{`
        @keyframes pulse-orange {
          0%, 100% {
            background-color: rgba(251, 146, 60, 0.1);
          }
          50% {
            background-color: rgba(251, 146, 60, 0.3);
          }
        }
        
        .animate-pulse-orange {
          animation: pulse-orange 2s ease-in-out infinite;
        }
      `}</style>
    </AppLayout>
  );
}
