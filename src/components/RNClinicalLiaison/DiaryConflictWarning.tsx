import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";

interface DiaryConflictWarningProps {
  conflicts: Array<{
    id: string;
    title: string;
    scheduled_date: string;
    scheduled_time?: string;
  }>;
}

export function DiaryConflictWarning({ conflicts }: DiaryConflictWarningProps) {
  if (conflicts.length === 0) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Schedule Conflict Detected!</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>The following entries overlap with this schedule:</p>
        <ul className="list-disc list-inside space-y-1">
          {conflicts.map((conflict) => (
            <li key={conflict.id} className="text-sm">
              <strong>{conflict.title}</strong>
              {conflict.scheduled_time && ` at ${conflict.scheduled_time.slice(0, 5)}`}
            </li>
          ))}
        </ul>
        <p className="text-sm mt-2">
          Consider rescheduling to avoid double-booking.
        </p>
      </AlertDescription>
    </Alert>
  );
}
