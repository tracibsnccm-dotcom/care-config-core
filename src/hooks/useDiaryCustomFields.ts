import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomField {
  id: string;
  field_name: string;
  field_type: string;
  field_options: any;
  is_required: boolean;
  display_order: number;
  created_at: string;
}

interface CustomFieldValue {
  id: string;
  entry_id: string;
  custom_field_id: string;
  field_value: any;
}

export function useDiaryCustomFields() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFields = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("rn_custom_fields")
          .select("*")
          .eq("created_by", user.id)
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error) throw error;
        setFields(data || []);
      } catch (error) {
        console.error("Error fetching custom fields:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, []);

  const createField = async (field: Omit<CustomField, "id" | "created_at">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("rn_custom_fields")
        .insert({ ...field, created_by: user.id })
        .select()
        .single();

      if (error) throw error;

      setFields([...fields, data]);
      toast.success("Custom field created");
      return data;
    } catch (error) {
      console.error("Error creating field:", error);
      toast.error("Failed to create custom field");
      return null;
    }
  };

  const deleteField = async (fieldId: string) => {
    try {
      const { error } = await supabase
        .from("rn_custom_fields")
        .update({ is_active: false })
        .eq("id", fieldId);

      if (error) throw error;

      setFields(fields.filter((f) => f.id !== fieldId));
      toast.success("Custom field deleted");
    } catch (error) {
      console.error("Error deleting field:", error);
      toast.error("Failed to delete custom field");
    }
  };

  return { fields, loading, createField, deleteField };
}

export function useDiaryCustomFieldValues(entryId: string | undefined) {
  const [values, setValues] = useState<CustomFieldValue[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entryId) return;

    const fetchValues = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("rn_entry_custom_fields")
          .select("*")
          .eq("entry_id", entryId);

        if (error) throw error;
        setValues(data || []);
      } catch (error) {
        console.error("Error fetching custom field values:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchValues();
  }, [entryId]);

  const saveValue = async (customFieldId: string, fieldValue: any) => {
    if (!entryId) return;

    try {
      const { error } = await supabase
        .from("rn_entry_custom_fields")
        .upsert({
          entry_id: entryId,
          custom_field_id: customFieldId,
          field_value: fieldValue,
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving custom field value:", error);
      toast.error("Failed to save custom field");
    }
  };

  return { values, loading, saveValue };
}
