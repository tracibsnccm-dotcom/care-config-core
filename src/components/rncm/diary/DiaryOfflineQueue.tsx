import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDiaryOfflineQueue } from "@/hooks/useDiaryOfflineQueue";
import { AlertCircle, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";

export function DiaryOfflineQueue() {
  const { queueItems, retryItem, clearQueue } = useDiaryOfflineQueue();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (queueItems.length === 0) {
    return (
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Badge variant="outline" className="gap-1">
            <Wifi className="h-3 w-3" />
            Online
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <WifiOff className="h-3 w-3" />
            Offline
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="font-medium">Pending Syncs ({queueItems.length})</span>
          </div>
          <Button variant="ghost" size="sm" onClick={clearQueue}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {queueItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex-1">
                <div className="text-sm font-medium">{item.operation_type}</div>
                {item.last_error && (
                  <div className="text-xs text-red-600">{item.last_error}</div>
                )}
                <div className="text-xs text-muted-foreground">
                  Retry count: {item.retry_count}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => retryItem(item.id, item.operation_type, item.operation_data)}
                disabled={!isOnline}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
