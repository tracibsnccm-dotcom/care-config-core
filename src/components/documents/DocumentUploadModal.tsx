import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: Array<{ id: string }>;
  onUploadComplete: () => void;
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  cases,
  onUploadComplete,
}: DocumentUploadModalProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCase, setSelectedCase] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [requiresAttention, setRequiresAttention] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCase || !documentType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      // TODO: Implement actual file upload to Supabase Storage
      // For now, just show success message
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Upload Successful",
        description: `${selectedFile.name} has been uploaded successfully`,
      });
      
      onUploadComplete();
      handleClose();
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setSelectedCase("");
    setDocumentType("");
    setRequiresAttention(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Upload New Document</span>
            <Button size="sm" variant="ghost" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="file-upload">Select File</Label>
            <div className="mt-2">
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center w-full h-32 px-4 transition border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 border-border bg-muted/30"
              >
                <div className="space-y-2 text-center">
                  {selectedFile ? (
                    <>
                      <FileText className="w-8 h-8 mx-auto text-primary" />
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                    </>
                  )}
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="case-select">Select Case *</Label>
            <Select value={selectedCase} onValueChange={setSelectedCase}>
              <SelectTrigger id="case-select" className="mt-2">
                <SelectValue placeholder="Choose a case" />
              </SelectTrigger>
              <SelectContent>
                {cases.slice(0, 20).map((caseItem) => (
                  <SelectItem key={caseItem.id} value={caseItem.id}>
                    {caseItem.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="doc-type">Document Type *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="doc-type" className="mt-2">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Clinical Report">Clinical Report</SelectItem>
                <SelectItem value="Legal Filing">Legal Filing</SelectItem>
                <SelectItem value="Client Form">Client Form</SelectItem>
                <SelectItem value="Provider Note">Provider Note</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="requires-attention"
              checked={requiresAttention}
              onCheckedChange={(checked) => setRequiresAttention(checked as boolean)}
            />
            <Label
              htmlFor="requires-attention"
              className="text-sm font-normal cursor-pointer"
            >
              Mark as requiring immediate attention
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !selectedCase || !documentType || uploading}
            className="bg-[#b09837] text-black hover:bg-black hover:text-[#b09837]"
          >
            {uploading ? (
              "Uploading..."
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
