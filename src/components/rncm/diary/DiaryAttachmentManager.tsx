import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDiaryAttachments } from "@/hooks/useDiaryAttachments";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { useRef } from "react";

interface DiaryAttachmentManagerProps {
  entryId: string;
}

export function DiaryAttachmentManager({ entryId }: DiaryAttachmentManagerProps) {
  const { attachments, loading, uploading, uploadAttachment, downloadAttachment, deleteAttachment } =
    useDiaryAttachments(entryId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAttachment(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          variant="outline"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Uploading..." : "Upload File"}
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading attachments...</div>
      ) : attachments.length === 0 ? (
        <div className="text-muted-foreground">No attachments yet</div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <Card key={attachment.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{attachment.file_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatFileSize(attachment.file_size)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadAttachment(attachment)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAttachment(attachment.id, attachment.file_path)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
