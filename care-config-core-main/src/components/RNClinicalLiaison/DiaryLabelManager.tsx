import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tag, X } from "lucide-react";

const PRESET_LABELS = [
  { value: "urgent", label: "Urgent", color: "red" },
  { value: "routine", label: "Routine", color: "blue" },
  { value: "follow-up", label: "Follow-up", color: "green" },
  { value: "administrative", label: "Administrative", color: "gray" },
  { value: "emergency", label: "Emergency", color: "destructive" },
  { value: "documentation", label: "Documentation", color: "purple" },
];

interface DiaryLabelManagerProps {
  value?: string;
  color?: string;
  onChange: (label: string, color: string) => void;
  onClear: () => void;
}

export function DiaryLabelManager({ value, color, onChange, onClear }: DiaryLabelManagerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Tag className="h-4 w-4" />
        Label & Color Code
      </label>
      
      <div className="flex gap-2 items-center">
        <Select
          value={value || ""}
          onValueChange={(val) => {
            const preset = PRESET_LABELS.find((p) => p.value === val);
            if (preset) {
              onChange(preset.label, preset.color);
            }
          }}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select label..." />
          </SelectTrigger>
          <SelectContent>
            {PRESET_LABELS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                <div className="flex items-center gap-2">
                  <Badge variant={preset.color as any} className="text-xs">
                    {preset.label}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {value && (
          <>
            <Badge variant={color as any} className="whitespace-nowrap">
              {value}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Color codes help visually categorize and filter entries
      </p>
    </div>
  );
}
