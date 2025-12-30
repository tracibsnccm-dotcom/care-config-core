import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDiaryVersions } from "@/hooks/useDiaryVersions";
import { Clock, RotateCcw } from "lucide-react";
import { format } from "date-fns";

interface DiaryVersionHistoryProps {
  entryId: string;
}

export function DiaryVersionHistory({ entryId }: DiaryVersionHistoryProps) {
  const { versions, loading, restoreVersion } = useDiaryVersions(entryId);

  const handleRestore = async (versionId: string, changedFields: Record<string, any>) => {
    await restoreVersion(versionId, changedFields);
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading version history...</div>;
  }

  if (versions.length === 0) {
    return <div className="text-muted-foreground">No version history available</div>;
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {versions.map((version) => (
          <Card key={version.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Version {version.version_number}</span>
                  <span>•</span>
                  <span>{format(new Date(version.created_at), "PPp")}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Changed fields:</span>
                  <ul className="mt-1 list-inside list-disc">
                    {Object.keys(version.changed_fields).map((field) => (
                      <li key={field} className="text-muted-foreground">
                        {field}: {JSON.stringify(version.changed_fields[field])}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRestore(version.id, version.changed_fields)}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
