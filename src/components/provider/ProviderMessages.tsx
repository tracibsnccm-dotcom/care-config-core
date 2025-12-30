import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export function ProviderMessages() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Messages</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Send and receive messages about your cases
      </p>
      <div className="text-center py-12 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Messaging system coming soon</p>
        <p className="text-sm mt-1">You'll be able to communicate with RNs and attorneys here</p>
      </div>
    </Card>
  );
}
