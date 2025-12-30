import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  document_type: string;
}

interface DocumentPreviewModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreviewModal({
  document,
  isOpen,
  onClose,
}: DocumentPreviewModalProps) {
  if (!document) return null;

  const isPDF = document.mime_type === "application/pdf" || document.file_name.endsWith(".pdf");
  const isImage = document.mime_type?.startsWith("image/") || 
    /\.(jpg|jpeg|png|gif|webp)$/i.test(document.file_name);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate pr-4">{document.file_name}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4">
          {isPDF ? (
            <iframe
              src={document.file_path}
              className="w-full h-full min-h-[600px] rounded"
              title={document.file_name}
            />
          ) : isImage ? (
            <img
              src={document.file_path}
              alt={document.file_name}
              className="max-w-full h-auto mx-auto"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Preview not available</p>
                <p className="text-sm">This file type cannot be previewed in the browser.</p>
                <Button className="mt-4" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download to view
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
