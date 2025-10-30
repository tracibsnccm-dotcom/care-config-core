import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { Star, Send, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMessageDraft } from "@/hooks/useMessageDraft";

interface Message {
  id: string;
  sender_id: string;
  sender_role: string;
  message_text: string;
  is_important: boolean;
  created_at: string;
  profiles?: {
    display_name: string;
    full_name: string;
  };
}

interface MessageThreadProps {
  caseId: string;
}

export function MessageThread({ caseId }: MessageThreadProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { draft, updateDraft, clearDraft, saveNow } = useMessageDraft(`rn-liaison-${caseId}`, caseId);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from("attorney_rn_messages")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles separately
      if (messagesData && messagesData.length > 0) {
        const senderIds = [...new Set(messagesData.map((m) => m.sender_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, display_name, full_name")
          .in("user_id", senderIds);

        const profilesMap = new Map(
          profilesData?.map((p) => [p.user_id, p]) || []
        );

        const messagesWithProfiles = messagesData.map((msg) => ({
          ...msg,
          profiles: profilesMap.get(msg.sender_id),
        }));

        setMessages(messagesWithProfiles as any);
      } else {
        setMessages([]);
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`messages:${caseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attorney_rn_messages",
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!draft.trim() || !user?.id) return;

    setLoading(true);
    try {
      // Get user's role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const { error } = await supabase.from("attorney_rn_messages").insert({
        case_id: caseId,
        sender_id: user.id,
        sender_role: roleData?.role || "ATTORNEY",
        message_text: draft.trim(),
        is_important: false,
      });

      if (error) throw error;

      await clearDraft();
      toast.success("Message sent");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const toggleImportant = async (messageId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("attorney_rn_messages")
        .update({ is_important: !currentState })
        .eq("id", messageId);

      if (error) throw error;
      fetchMessages();
    } catch (error: any) {
      console.error("Error toggling importance:", error);
      toast.error("Failed to update message");
    }
  };

  return (
    <Card className="rounded-2xl border-2 shadow-lg overflow-hidden">
      {/* Messages Container */}
      <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-muted/20">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">
              No messages yet. Start the conversation below.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  isCurrentUser ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl p-4 shadow-sm",
                    isCurrentUser
                      ? "rounded-tr-none"
                      : "rounded-tl-none",
                    isCurrentUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-card"
                  )}
                  style={{
                    backgroundColor: isCurrentUser ? "#0f2a6a" : undefined,
                    color: isCurrentUser ? "#ffffff" : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-sm">
                        {msg.profiles?.display_name || msg.profiles?.full_name || "Unknown"}
                      </p>
                      <p className="text-xs opacity-70">
                        {format(new Date(msg.created_at), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                    {isCurrentUser && (
                      <button
                        onClick={() => toggleImportant(msg.id, msg.is_important)}
                        className="transition-transform hover:scale-110"
                        aria-label="Mark as important"
                      >
                        <Star
                          className="w-4 h-4"
                          fill={msg.is_important ? "#b09837" : "none"}
                          style={{ color: msg.is_important ? "#b09837" : "#ffffff80" }}
                        />
                      </button>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                  {msg.is_important && (
                    <div className="mt-2 flex items-center gap-1 text-xs opacity-90">
                      <Star className="w-3 h-3" fill="#b09837" style={{ color: "#b09837" }} />
                      <span>Important</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Textarea
            value={draft}
            onChange={(e) => updateDraft(e.target.value)}
            onBlur={saveNow}
            placeholder="Type your message to RN CM..."
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <Button
              size="icon"
              variant="outline"
              disabled
              title="Attachments (coming soon)"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={loading || !draft.trim()}
              style={{
                backgroundColor: "#b09837",
                color: "#000000",
              }}
              className="hover:opacity-90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </Card>
  );
}
