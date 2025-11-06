import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useManagementResources, ManagementResource } from "@/hooks/useManagementResources";
import { FileUpload } from "./FileUpload";

interface ResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: ManagementResource;
  mode: 'create' | 'edit';
}

export function ResourceFormDialog({ open, onOpenChange, resource, mode }: ResourceFormDialogProps) {
  const { createResource, updateResource } = useManagementResources();
  
  const [formData, setFormData] = useState({
    title: resource?.title || '',
    description: resource?.description || '',
    resource_type: resource?.resource_type || 'policy',
    category: resource?.category || 'clinical',
    file_url: resource?.file_url || '',
    file_size: resource?.file_size || 0,
    mime_type: resource?.mime_type || '',
    access_level: resource?.access_level || 'all',
    is_featured: resource?.is_featured || false,
    version: resource?.version || '1.0',
    tags: resource?.tags?.join(', ') || '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const resourceData = {
        title: formData.title,
        description: formData.description,
        resource_type: formData.resource_type as any,
        category: formData.category as any,
        file_url: formData.file_url,
        file_size: formData.file_size,
        mime_type: formData.mime_type,
        access_level: formData.access_level,
        is_featured: formData.is_featured,
        version: formData.version,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      if (mode === 'edit' && resource) {
        await updateResource(resource.id, resourceData);
      } else {
        await createResource(resourceData as any);
      }
      
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        resource_type: 'policy',
        category: 'clinical',
        file_url: '',
        file_size: 0,
        mime_type: '',
        access_level: 'all',
        is_featured: false,
        version: '1.0',
        tags: '',
      });
    } catch (error) {
      console.error('Error saving resource:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Resource' : 'Edit Resource'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Clinical Documentation Standards"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Brief description of the resource..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource_type">Resource Type *</Label>
              <Select
                value={formData.resource_type}
                onValueChange={(value: any) => setFormData({ ...formData, resource_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="guide">Guide</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinical">Clinical</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_level">Access Level *</Label>
              <Select
                value={formData.access_level}
                onValueChange={(value) => setFormData({ ...formData, access_level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  <SelectItem value="director">Directors Only</SelectItem>
                  <SelectItem value="supervisor">Supervisors & Above</SelectItem>
                  <SelectItem value="manager">Managers & Above</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="1.0"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>File Upload</Label>
              <FileUpload
                currentFileUrl={formData.file_url}
                onFileUploaded={(url, fileName, size, mimeType) => {
                  setFormData({ 
                    ...formData, 
                    file_url: url,
                    file_size: size,
                    mime_type: mimeType,
                    title: formData.title || fileName.replace(/\.[^/.]+$/, '') // Use filename as title if empty
                  });
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Or manually enter a file URL if the file is hosted elsewhere
              </p>
              <Input
                id="file_url"
                type="url"
                value={formData.file_url}
                onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                placeholder="https://..."
                className="mt-2"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., urgent, required, new"
              />
            </div>

            <div className="flex items-center space-x-2 md:col-span-2">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
              <Label htmlFor="is_featured" className="cursor-pointer">
                Feature this resource
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'create' ? 'Create Resource' : 'Update Resource'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}