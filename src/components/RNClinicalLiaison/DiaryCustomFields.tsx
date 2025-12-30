import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Settings2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CustomField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "textarea" | "select";
  value: any;
  options?: string[];
}

interface DiaryCustomFieldsProps {
  value: Record<string, any>;
  onChange: (fields: Record<string, any>) => void;
}

export function DiaryCustomFields({ value = {}, onChange }: DiaryCustomFieldsProps) {
  const [fields, setFields] = useState<CustomField[]>(
    Object.entries(value).map(([key, val]: [string, any]) => ({
      key,
      label: key,
      type: typeof val === "number" ? "number" : "text",
      value: val,
    }))
  );
  const [isOpen, setIsOpen] = useState(false);

  const addField = () => {
    const newField: CustomField = {
      key: `field_${Date.now()}`,
      label: "New Field",
      type: "text",
      value: "",
    };
    const updated = [...fields, newField];
    setFields(updated);
    updateParent(updated);
  };

  const removeField = (index: number) => {
    const updated = fields.filter((_, i) => i !== index);
    setFields(updated);
    updateParent(updated);
  };

  const updateField = (index: number, updates: Partial<CustomField>) => {
    const updated = fields.map((f, i) => (i === index ? { ...f, ...updates } : f));
    setFields(updated);
    updateParent(updated);
  };

  const updateParent = (updatedFields: CustomField[]) => {
    const fieldValues: Record<string, any> = {};
    updatedFields.forEach((f) => {
      if (f.value !== "" && f.value !== null && f.value !== undefined) {
        fieldValues[f.key] = f.value;
      }
    });
    onChange(fieldValues);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button type="button" variant="outline" className="w-full flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Custom Fields ({fields.length})
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4 space-y-4">
        {fields.map((field, index) => (
          <div key={field.key} className="border rounded-lg p-3 space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Field label"
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
                className="flex-1"
              />
              <Select
                value={field.type}
                onValueChange={(type: any) => updateField(index, { type })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeField(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {field.type === "textarea" ? (
              <Textarea
                placeholder={`Enter ${field.label}`}
                value={field.value || ""}
                onChange={(e) => updateField(index, { value: e.target.value })}
              />
            ) : field.type === "select" ? (
              <div className="space-y-2">
                <Input
                  placeholder="Options (comma-separated)"
                  value={field.options?.join(", ") || ""}
                  onChange={(e) =>
                    updateField(index, { options: e.target.value.split(",").map((s) => s.trim()) })
                  }
                />
                <Select
                  value={field.value}
                  onValueChange={(value) => updateField(index, { value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select value..." />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Input
                type={field.type}
                placeholder={`Enter ${field.label}`}
                value={field.value || ""}
                onChange={(e) => updateField(index, { value: e.target.value })}
              />
            )}
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addField} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Field
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
