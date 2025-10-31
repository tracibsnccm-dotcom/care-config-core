import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { FileText, Eye, Download, Shield } from "lucide-react";
import { format } from "date-fns";
import { DocumentActionsMenu } from "./DocumentActionsMenu";

interface Document {
  id: string;
  created_at: string;
  file_name: string;
  case_id: string;
  uploaded_by: string;
  document_type: string;
  status: string;
  read_by: string[];
  requires_attention: boolean;
  file_path: string;
  mime_type: string | null;
  category: string;
  is_sensitive: boolean;
  note: string | null;
}

interface DocumentTableProps {
  documents: Document[];
  currentUserId: string;
  onMarkAsRead: (docId: string) => void;
  onPreview: (doc: Document) => void;
  getDocumentTypeColor: (type: string) => string;
  cases: Array<{ id: string }>;
  onUpdate: () => void;
}

const ITEMS_PER_PAGE = 20;

export function DocumentTable({
  documents,
  currentUserId,
  onMarkAsRead,
  onPreview,
  getDocumentTypeColor,
  cases,
  onUpdate,
}: DocumentTableProps) {
  const navigate = useNavigate();
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<keyof Document>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (column: keyof Document) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (sortColumn === "created_at") {
      return sortDirection === "asc" 
        ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime()
        : new Date(bVal as string).getTime() - new Date(aVal as string).getTime();
    }
    
    const aStr = String(aVal);
    const bStr = String(bVal);
    return sortDirection === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  const totalPages = Math.ceil(sortedDocuments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDocuments = sortedDocuments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocs(new Set(paginatedDocuments.map(doc => doc.id)));
    } else {
      setSelectedDocs(new Set());
    }
  };

  const handleSelectDoc = (docId: string, checked: boolean) => {
    const newSelected = new Set(selectedDocs);
    if (checked) {
      newSelected.add(docId);
    } else {
      newSelected.delete(docId);
    }
    setSelectedDocs(newSelected);
  };

  const handleBulkMarkAsRead = () => {
    selectedDocs.forEach(docId => onMarkAsRead(docId));
    setSelectedDocs(new Set());
  };

  return (
    <>
      <Card className="border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground">All Documents</h3>
          {selectedDocs.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {selectedDocs.size} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMarkAsRead}
              >
                <Eye className="w-4 h-4 mr-2" />
                Mark as Read
              </Button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedDocs.size === paginatedDocuments.length && paginatedDocuments.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none font-semibold"
                  onClick={() => handleSort("created_at")}
                >
                  Date & Time {sortColumn === "created_at" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none font-semibold"
                  onClick={() => handleSort("file_name")}
                >
                  File Name {sortColumn === "file_name" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none font-semibold"
                  onClick={() => handleSort("case_id")}
                >
                  Case ID {sortColumn === "case_id" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="font-semibold">Uploaded By</TableHead>
                <TableHead 
                  className="cursor-pointer select-none font-semibold"
                  onClick={() => handleSort("document_type")}
                >
                  Type {sortColumn === "document_type" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Notes</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No documents found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or upload a new document</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDocuments.map((doc) => {
                  const isUnread = !doc.read_by.includes(currentUserId);
                  return (
                    <TableRow
                      key={doc.id}
                      className={`transition-colors cursor-pointer ${
                        isUnread 
                          ? 'bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100 dark:hover:bg-yellow-950/30' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => onPreview(doc)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedDocs.has(doc.id)}
                          onCheckedChange={(checked) => handleSelectDoc(doc.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {format(new Date(doc.created_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className={`w-4 h-4 ${isUnread ? 'text-yellow-600' : 'text-muted-foreground'}`} />
                          <span className={`truncate max-w-xs ${isUnread ? 'font-semibold' : ''}`}>
                            {doc.file_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{doc.case_id}</span>
                      </TableCell>
                      <TableCell className="text-sm">User {doc.uploaded_by.slice(0, 8)}</TableCell>
                      <TableCell>
                        <Badge className={getDocumentTypeColor(doc.document_type)}>
                          {doc.document_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {doc.note || <span className="text-muted-foreground">No note</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {doc.is_sensitive && <Shield className="w-4 h-4 text-red-600" />}
                          <Badge 
                            variant={doc.status === "reviewed" ? "default" : "outline"}
                            className={
                              doc.status === "reviewed" 
                                ? "bg-green-500 text-white" 
                                : "bg-amber-100 text-amber-800 border-amber-300"
                            }
                          >
                            {doc.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkAsRead(doc.id);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <DocumentActionsMenu
                            documentId={doc.id}
                            caseId={doc.case_id}
                            isSensitive={doc.is_sensitive}
                            cases={cases}
                            onActionComplete={onUpdate}
                          />
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

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
}
