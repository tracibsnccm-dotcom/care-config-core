import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { FileText, Plus, Trash2 } from "lucide-react";

interface Template {
  id: string;
  template_name: string;
  title_template: string;
  description_template?: string;
  category?: string;
  priority: string;
  estimated_duration_minutes?: number;
  is_shared: boolean;
}

export function DiaryTemplates({ onUseTemplate }: { onUseTemplate?: (template: Template) => void }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [titleTemplate, setTitleTemplate] = useState("");
  const [descriptionTemplate, setDescriptionTemplate] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [isShared, setIsShared] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ["diary-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rn_diary_templates")
        .select("*")
        .order("template_name");
      if (error) throw error;
      return data as Template[];
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("rn_diary_templates")
        .insert({
          template_name: templateName,
          title_template: titleTemplate,
          description_template: descriptionTemplate || null,
          category: category || null,
          priority,
          estimated_duration_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
          is_shared: isShared,
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-templates"] });
      setIsCreateOpen(false);
      resetForm();
      toast.success("Template created successfully");
    },
    onError: (error) => {
      console.error("Error creating template:", error);
      toast.error("Failed to create template");
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rn_diary_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-templates"] });
      toast.success("Template deleted");
    },
  });

  const resetForm = () => {
    setTemplateName("");
    setTitleTemplate("");
    setDescriptionTemplate("");
    setCategory("");
    setPriority("medium");
    setEstimatedMinutes("");
    setIsShared(false);
  };

  if (isLoading) return <div>Loading templates...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Entry Templates
        </h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Entry Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Morning Medication Round"
                />
              </div>
              <div>
                <Label htmlFor="title">Title Template</Label>
                <Input
                  id="title"
                  value={titleTemplate}
                  onChange={(e) => setTitleTemplate(e.target.value)}
                  placeholder="Entry title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description Template</Label>
                <Textarea
                  id="description"
                  value={descriptionTemplate}
                  onChange={(e) => setDescriptionTemplate(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Medication"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="estimated-minutes">Estimated Duration (minutes)</Label>
                <Input
                  id="estimated-minutes"
                  type="number"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  placeholder="30"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-shared"
                  checked={isShared}
                  onCheckedChange={setIsShared}
                />
                <Label htmlFor="is-shared">Share with team</Label>
              </div>
              <Button 
                onClick={() => createTemplateMutation.mutate()} 
                disabled={!templateName || !titleTemplate || createTemplateMutation.isPending}
                className="w-full"
              >
                Create Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates?.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{template.template_name}</CardTitle>
              <CardDescription>{template.title_template}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {template.description_template && (
                <p className="text-sm text-muted-foreground">{template.description_template}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {template.category && (
                  <span className="text-xs bg-secondary px-2 py-1 rounded">{template.category}</span>
                )}
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{template.priority}</span>
                {template.estimated_duration_minutes && (
                  <span className="text-xs bg-muted px-2 py-1 rounded">{template.estimated_duration_minutes}m</span>
                )}
                {template.is_shared && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Shared</span>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onUseTemplate?.(template)}
                >
                  Use Template
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTemplateMutation.mutate(template.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}