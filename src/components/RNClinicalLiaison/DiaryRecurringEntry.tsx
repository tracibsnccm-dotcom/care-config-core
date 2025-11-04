import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Repeat, Info } from "lucide-react";

interface DiaryRecurringEntryProps {
  isRecurring: boolean;
  onRecurringChange: (value: boolean) => void;
  recurrencePattern: string;
  onPatternChange: (value: string) => void;
  recurrenceEndDate: string;
  onEndDateChange: (value: string) => void;
}

export function DiaryRecurringEntry({
  isRecurring,
  onRecurringChange,
  recurrencePattern,
  onPatternChange,
  recurrenceEndDate,
  onEndDateChange
}: DiaryRecurringEntryProps) {
  const getRecurrenceDescription = () => {
    if (!isRecurring || !recurrencePattern) return null;

    const descriptions: Record<string, string> = {
      daily: "Every day",
      weekly: "Every week on the same day",
      biweekly: "Every 2 weeks on the same day",
      monthly: "Every month on the same date"
    };

    return descriptions[recurrencePattern];
  };

  return (
    <Card className="border-dashed">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="recurring"
            checked={isRecurring}
            onCheckedChange={onRecurringChange}
          />
          <Label htmlFor="recurring" className="flex items-center gap-2 cursor-pointer">
            <Repeat className="h-4 w-4" />
            Make this a recurring entry
          </Label>
        </div>

        {isRecurring && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recurrence-pattern">Repeat Pattern *</Label>
                <Select value={recurrencePattern} onValueChange={onPatternChange}>
                  <SelectTrigger id="recurrence-pattern">
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="recurrence-end">End Date (Optional)</Label>
                <Input
                  id="recurrence-end"
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {getRecurrenceDescription() && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900">{getRecurrenceDescription()}</p>
                  <p className="text-blue-700 mt-1">
                    {recurrenceEndDate 
                      ? `Repeating until ${new Date(recurrenceEndDate).toLocaleDateString()}`
                      : "Repeating indefinitely (you can set an end date)"
                    }
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
