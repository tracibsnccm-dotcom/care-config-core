import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, FileText, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileUploaded: (fileUrl: string, fileName: string, fileSize: number, mimeType: string) => void;
  currentFileUrl?: string;
  accept?: Record<string, string[]>;
  maxSize?: number;
}

export function FileUpload({ 
  onFileUploaded, 
  currentFileUrl,
  accept = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'text/plain': ['.txt'],
    'text/csv': ['.csv'],
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  },
  maxSize = 20971520 // 20MB
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    url: string;
  } | null>(currentFileUrl ? { name: currentFileUrl.split('/').pop() || 'file', url: currentFileUrl } : null);
  const { toast } = useToast();

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `resources/${fileName}`;

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('management-resources')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('management-resources')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      setUploadedFile({ name: file.name, url: publicUrl });
      
      onFileUploaded(publicUrl, file.name, file.size, file.type);

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled: uploading
  });

  const removeFile = () => {
    setUploadedFile(null);
    onFileUploaded('', '', 0, '');
  };

  if (uploadedFile) {
    return (
      <div className="border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {uploadedFile.name}
            </div>
            <a 
              href={uploadedFile.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View file
            </a>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeFile}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive && !isDragReject ? 'border-primary bg-primary/5' : 'border-border'}
          ${isDragReject ? 'border-destructive bg-destructive/5' : ''}
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-muted/50'}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-2">
          <div className={`p-3 rounded-full ${isDragActive ? 'bg-primary/10' : 'bg-muted'}`}>
            <Upload className={`h-6 w-6 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          
          {uploading ? (
            <div className="w-full max-w-xs space-y-2">
              <p className="text-sm font-medium text-foreground">Uploading...</p>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
            </div>
          ) : isDragActive ? (
            <p className="text-sm font-medium text-primary">Drop the file here</p>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">
                Drag & drop a file here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, Word, Excel, PowerPoint, Images (max 20MB)
              </p>
            </>
          )}
        </div>
      </div>

      {isDragReject && (
        <p className="text-xs text-destructive mt-2">
          File type not supported or file is too large (max 20MB)
        </p>
      )}
    </div>
  );
}