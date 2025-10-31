import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Eye, Download } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

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
}

interface UrgentDocumentsSectionProps {
  documents: Document[];
  onMarkAsRead: (docId: string) => void;
  getDocumentTypeColor: (type: string) => string;
}

export function UrgentDocumentsSection({
  documents,
  onMarkAsRead,
  getDocumentTypeColor,
}: UrgentDocumentsSectionProps) {
  const navigate = useNavigate();

  if (documents.length === 0) return null;

  return (
    <Card className="border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20">
      <div className="p-4 border-b border-orange-500/20">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-600 animate-pulse" />
          <h3 className="font-bold text-orange-900 dark:text-orange-100">
            Requires Immediate Attention
          </h3>
          <Badge className="bg-orange-600 text-white ml-2">
            {documents.length}
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
            {documents.map((doc) => (
              <TableRow
                key={doc.id}
                className="animate-pulse-orange hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors cursor-pointer"
                onClick={() => {
                  onMarkAsRead(doc.id);
                  navigate(`/cases/${doc.case_id}`);
                }}
              >
                <TableCell className="font-medium">
                  {format(new Date(doc.created_at), "MMM dd, yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="truncate max-w-xs font-semibold text-orange-900 dark:text-orange-100">
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
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[#128f8b] hover:text-[#128f8b] hover:bg-[#128f8b]/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(doc.id);
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
    </Card>
  );
}
