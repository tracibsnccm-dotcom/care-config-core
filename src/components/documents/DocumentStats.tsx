import { Card } from "@/components/ui/card";
import { FileText, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface DocumentStatsProps {
  totalDocuments: number;
  awaitingReview: number;
  lastUpdated: string;
}

export function DocumentStats({ totalDocuments, awaitingReview, lastUpdated }: DocumentStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4 border-[#128f8b]/20">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-[#128f8b]" />
          <div>
            <p className="text-sm text-muted-foreground">Total Documents</p>
            <p className="text-2xl font-bold text-foreground">{totalDocuments}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 border-[#b09837]/20">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-[#b09837]" />
          <div>
            <p className="text-sm text-muted-foreground">Awaiting Review</p>
            <p className="text-2xl font-bold text-foreground">{awaitingReview}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 border-[#0f2a6a]/20">
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-[#0f2a6a]" />
          <div>
            <p className="text-sm text-muted-foreground">Last Updated</p>
            <p className="text-lg font-bold text-foreground">{lastUpdated}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
