import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/auth/supabaseAuth";
import { MessageSquare, Send } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

interface ProviderRNMessagingProps {
  caseId: string;
  recipientId: string;
  recipientName: string;
}

export function ProviderRNMessaging({
  caseId,
  recipientId,
  recipientName,
}: ProviderRNMessagingProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`provider-rn-messages-${caseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "provider_rn_messages",
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId]);

  async function fetchMessages() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("provider_rn_messages")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark received messages as read
      if (user && data) {
        const unreadIds = data
          .filter((m) => m.recipient_id === user.id && !m.read_at)
          .map((m) => m.id);

        if (unreadIds.length > 0) {
          await supabase
            .from("provider_rn_messages")
            .update({ read_at: new Date().toISOString() })
            .in("id", unreadIds);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!user || !newMessage.trim()) return;

    try {
      setSending(true);

      const { error } = await supabase.from("provider_rn_messages").insert({
        case_id: caseId,
        sender_id: user.id,
        recipient_id: recipientId,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      toast.success("Message sent");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        Messages with {recipientName}
      </h3>

      <ScrollArea className="h-80 mb-4 pr-4">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Loading messages...
          </p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet. Start a conversation!
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {format(new Date(msg.created_at), "MMM d, h:mm a")}
                      {!isOwn && !msg.read_at && (
                        <span className="ml-2 font-semibold">• New</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          size="icon"
          className="h-full"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
