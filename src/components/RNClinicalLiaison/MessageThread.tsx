import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { Star, Send, Paperclip, Upload, Tag, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMessageDraft } from "@/hooks/useMessageDraft";
import { Input } from "@/components/ui/input";
import { RCMS } from "@/constants/brand";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  sender_id: string;
  sender_role: string;
  message_text: string;
  is_important: boolean;
  created_at: string;
  attachments?: any;
  profiles?: {
    display_name: string;
    full_name: string;
  };
}

const MESSAGE_TAGS = [
  { id: "general", label: "General", color: "#95a5a6" },
  { id: "clinical_update", label: "Clinical Update", color: "#3498db" },
  { id: "treatment_request", label: "Treatment Request", color: "#2ecc71" },
  { id: "records_review", label: "Records Review", color: "#f39c12" },
  { id: "urgent", label: "Urgent", color: "#e74c3c" },
];

const QUICK_REPLIES = [
  { id: "request_pt_notes", text: "Please provide the most recent PT notes for review." },
  { id: "request_narrative", text: "Could you prepare a clinical narrative report for this case?" },
  { id: "schedule_review", text: "Let's schedule a case review meeting. What times work for you?" },
  { id: "mri_follow_up", text: "Has the patient completed the MRI? Please share results when available." },
  { id: "treatment_update", text: "Can you provide an update on the current treatment plan and progress?" },
  { id: "ime_prep", text: "IME is scheduled. Please prepare a summary of treatment history and current status." },
];

interface MessageThreadProps {
  caseId: string;
}

export function MessageThread({ caseId }: MessageThreadProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTag, setSelectedTag] = useState("general");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { draft, updateDraft, clearDraft, saveNow } = useMessageDraft(`rn-liaison-${caseId}`, caseId);

  const handleQuickReply = (text: string) => {
    updateDraft(text);
    setShowQuickReplies(false);
  };

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

      // TODO: Handle file upload to storage if selectedFile exists
      // For now, just send the text message with tag in attachments

      const { error, data: messageData } = await supabase
        .from("attorney_rn_messages")
        .insert({
          case_id: caseId,
          sender_id: user.id,
          sender_role: roleData?.role || "ATTORNEY",
          message_text: draft.trim(),
          is_important: selectedTag === "urgent",
          attachments: { tag: selectedTag },
        })
        .select()
        .single();

      if (error) throw error;

      // Get RN CM assigned to this case for notification
      const { data: rnAssignment } = await supabase
        .from("case_assignments")
        .select("user_id")
        .eq("case_id", caseId)
        .eq("role", "RN_CCM")
        .single();

      if (rnAssignment?.user_id) {
        await supabase.rpc('notify_user', {
          target_user_id: rnAssignment.user_id,
          notification_title: 'New Message from Attorney',
          notification_message: `You have a new message regarding case ${caseId.slice(0, 8).toUpperCase()}`,
          notification_type: 'info',
          notification_link: `/case-detail/${caseId}`,
          notification_metadata: { case_id: caseId, source: 'rn_liaison' }
        });
      }

      await clearDraft();
      setSelectedFile(null);
      setSelectedTag("general");
      toast.success("Message sent and RN CM notified");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast.success(`File selected: ${file.name}`);
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
                    backgroundColor: isCurrentUser ? RCMS.brandNavy : undefined,
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
                          fill={msg.is_important ? RCMS.brandGold : "none"}
                          style={{ color: msg.is_important ? RCMS.brandGold : "#ffffff80" }}
                        />
                      </button>
                    )}
                  </div>
                  {/* Message Tag Badge */}
                  {msg.attachments?.tag && (
                    <Badge
                      variant="secondary"
                      className="mb-2 text-xs"
                      style={{
                        backgroundColor: `${
                          MESSAGE_TAGS.find((t) => t.id === msg.attachments.tag)?.color || "#95a5a6"
                        }20`,
                        color: MESSAGE_TAGS.find((t) => t.id === msg.attachments.tag)?.color || "#95a5a6",
                        border: "none",
                      }}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {MESSAGE_TAGS.find((t) => t.id === msg.attachments.tag)?.label || "General"}
                    </Badge>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                  {msg.is_important && (
                    <div className="mt-2 flex items-center gap-1 text-xs opacity-90">
                      <Star className="w-3 h-3" fill={RCMS.brandGold} style={{ color: RCMS.brandGold }} />
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
        {/* Quick Replies Dropdown */}
        {showQuickReplies && (
          <div className="mb-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">Quick Replies</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowQuickReplies(false)}
                className="h-6 px-2"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply.id}
                  onClick={() => handleQuickReply(reply.text)}
                  className="w-full text-left p-2 rounded hover:bg-muted text-xs text-foreground transition-colors"
                >
                  {reply.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Tag Selector */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground">
              Message Category
            </label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              className="h-7 text-xs"
              style={{ borderColor: RCMS.brandTeal, color: RCMS.brandTeal }}
            >
              Quick Replies
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {MESSAGE_TAGS.map((tag) => (
              <Button
                key={tag.id}
                size="sm"
                variant={selectedTag === tag.id ? "default" : "outline"}
                onClick={() => setSelectedTag(tag.id)}
                className="text-xs"
                style={
                  selectedTag === tag.id
                    ? {
                        backgroundColor: tag.color,
                        color: "#ffffff",
                        border: "none",
                      }
                    : {
                        borderColor: tag.color,
                        color: tag.color,
                      }
                }
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag.label}
              </Button>
            ))}
          </div>
        </div>
        
        {selectedFile && (
          <div className="mb-2 p-2 bg-muted/50 rounded flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" style={{ color: RCMS.brandTeal }} />
              <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedFile(null)}
              className="h-6 px-2"
            >
              Remove
            </Button>
          </div>
        )}
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
            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              style={{ borderColor: RCMS.brandTeal, color: RCMS.brandTeal }}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={loading || !draft.trim()}
                style={{
                  backgroundColor: RCMS.brandGold,
                  color: "#000000",
                }}
              className="hover:opacity-90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line • Attachments: PDF, Word, Images
        </p>
      </div>
    </Card>
  );
}
