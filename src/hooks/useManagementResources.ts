import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ManagementResource {
  id: string;
  title: string;
  description?: string;
  resource_type: 'policy' | 'template' | 'guide' | 'training' | 'form';
  category: 'clinical' | 'compliance' | 'hr' | 'operations' | 'legal';
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  tags?: string[];
  access_level: string;
  uploaded_by?: string;
  is_featured: boolean;
  version: string;
  created_at: string;
  updated_at: string;
}

export function useManagementResources() {
  const [resources, setResources] = useState<ManagementResource[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("management_resources")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources((data as ManagementResource[]) || []);
    } catch (error: any) {
      toast({
        title: "Error loading resources",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createResource = async (resource: Omit<ManagementResource, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from("management_resources")
        .insert([resource]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resource created successfully",
      });

      fetchResources();
    } catch (error: any) {
      toast({
        title: "Error creating resource",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateResource = async (id: string, updates: Partial<ManagementResource>) => {
    try {
      const { error } = await supabase
        .from("management_resources")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resource updated successfully",
      });

      fetchResources();
    } catch (error: any) {
      toast({
        title: "Error updating resource",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteResource = async (id: string) => {
    try {
      const { error } = await supabase
        .from("management_resources")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });

      fetchResources();
    } catch (error: any) {
      toast({
        title: "Error deleting resource",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  return {
    resources,
    loading,
    createResource,
    updateResource,
    deleteResource,
    refresh: fetchResources,
  };
}