import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { format } from "date-fns";

interface DiaryPrintViewProps {
  rnId: string;
  startDate: Date;
  endDate: Date;
}

export function DiaryPrintView({ rnId, startDate, endDate }: DiaryPrintViewProps) {
  const { data: entries } = useQuery({
    queryKey: ["diary-print", rnId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rn_diary_entries")
        .select("*")
        .eq("rn_id", rnId)
        .gte("scheduled_date", format(startDate, "yyyy-MM-dd"))
        .lte("scheduled_date", format(endDate, "yyyy-MM-dd"))
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-xl font-semibold">Print Schedule</h2>
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>

      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            @page {
              margin: 1cm;
            }
          }
        `}
      </style>

      <div className="print-container space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">RN Diary Schedule</h1>
          <p className="text-muted-foreground">
            {format(startDate, "MMMM d, yyyy")} - {format(endDate, "MMMM d, yyyy")}
          </p>
        </div>

        {entries?.map((entry) => (
          <div key={entry.id} className="border-b pb-4 page-break-inside-avoid">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">{entry.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(entry.scheduled_date), "EEEE, MMMM d, yyyy")}
                  {entry.scheduled_time && ` at ${entry.scheduled_time}`}
                </p>
              </div>
              <div className="text-sm">
                <span
                  className={`px-2 py-1 rounded ${
                    entry.priority === "high"
                      ? "bg-red-100 text-red-800"
                      : entry.priority === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {entry.priority}
                </span>
              </div>
            </div>

            {entry.description && <p className="text-sm mb-2">{entry.description}</p>}

            {entry.location && (
              <p className="text-sm text-muted-foreground">Location: {entry.location}</p>
            )}

            <div className="mt-2 flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 bg-gray-100 rounded">{entry.entry_type}</span>
              {entry.label && (
                <span className="text-xs px-2 py-1 bg-gray-100 rounded">{entry.label}</span>
              )}
            </div>

            <div className="mt-3 pt-2 border-t print:border-gray-300">
              <p className="text-xs text-muted-foreground">Notes:</p>
              <div className="h-12 border-b print:border-dotted"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
