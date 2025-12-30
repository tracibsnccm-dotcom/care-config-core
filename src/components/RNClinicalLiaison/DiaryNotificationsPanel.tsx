import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function DiaryNotificationsPanel() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("rn_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rn_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("rn_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {notifications?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No notifications
              </p>
            ) : (
              notifications?.map((notif: any) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border ${
                    notif.is_read ? 'bg-background' : 'bg-primary/5'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-medium text-sm ${
                      notif.type === 'warning' ? 'text-orange-600' :
                      notif.type === 'mention' ? 'text-blue-600' :
                      notif.type === 'reminder' ? 'text-purple-600' :
                      ''
                    }`}>
                      {notif.title}
                    </span>
                    {!notif.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsReadMutation.mutate(notif.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{notif.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notif.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}