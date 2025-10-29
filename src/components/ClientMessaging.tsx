import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, Clock, CheckCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useApp } from "@/context/AppContext";
import { Skeleton } from "@/components/ui/skeleton";

interface Message {
  id: string;
  subject: string;
  message_text: string;
  response_text: string | null;
  recipient_role: string;
  status: string;
  created_at: string;
  responded_at: string | null;
  sender_profile?: {
    display_name: string;
  };
  responder_profile?: {
    display_name: string;
  };
}

interface ClientMessagingProps {
  caseId: string;
}

export function ClientMessaging({ caseId }: ClientMessagingProps) {
  const { toast } = useToast();
  const { tier } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // New message form
  const [recipientRole, setRecipientRole] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");

  // Check if messaging is allowed for current tier
  const messagingAllowed = tier === "Clinical" || tier === "Premium";

  useEffect(() => {
    if (messagingAllowed) {
      fetchMessages();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `case_id=eq.${caseId}`
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [caseId, messagingAllowed]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error} = await supabase
        .from("messages")
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey (
            display_name
          ),
          responder_profile:profiles!messages_responded_by_fkey (
            display_name
          )
        `)
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!recipientRole || !subject.trim() || !messageText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("messages").insert({
        case_id: caseId,
        sender_id: user.id,
        recipient_role: recipientRole,
        subject: subject.trim(),
        message_text: messageText.trim(),
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully",
      });

      // Reset form
      setRecipientRole("");
      setSubject("");
      setMessageText("");
      
      // Refresh messages
      fetchMessages();
    } catch (err: any) {
      console.error("Error sending message:", err);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (!messagingAllowed) {
    return (
      <Alert>
        <MessageSquare className="w-4 h-4" />
        <AlertDescription>
          Messaging is available for Clinical and Premium tier subscribers. Upgrade your plan to communicate directly with your care team.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "RN_CCM": return "RN Case Manager";
      case "ATTORNEY": return "Attorney";
      case "PROVIDER": return "Provider";
      default: return role;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
      case "responded":
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />Responded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Send New Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Send a Message
          </CardTitle>
          <CardDescription>
            Ask questions to your RN Case Manager, Attorney, or Provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Send To</Label>
            <Select value={recipientRole} onValueChange={setRecipientRole}>
              <SelectTrigger id="recipient">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RN_CCM">RN Case Manager</SelectItem>
                <SelectItem value="ATTORNEY">Attorney</SelectItem>
                <SelectItem value="PROVIDER">Provider</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Brief subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Your Question</Label>
            <Textarea
              id="message"
              placeholder="Type your question or message here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={6}
            />
          </div>

          <Button 
            onClick={handleSendMessage} 
            disabled={sending}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </CardContent>
      </Card>

      {/* Message History */}
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
          <CardDescription>
            Your previous messages and responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <Alert>
              <AlertDescription>
                No messages yet. Send your first message to your care team above.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <Card key={msg.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{msg.subject}</CardTitle>
                        <CardDescription className="text-xs">
                          To: {getRoleName(msg.recipient_role)} • {format(new Date(msg.created_at), "PPp")}
                        </CardDescription>
                      </div>
                      {getStatusBadge(msg.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Your Message:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {msg.message_text}
                      </p>
                    </div>

                    {msg.response_text && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium mb-1 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Response:
                            {msg.responded_at && (
                              <span className="text-xs text-muted-foreground font-normal">
                                {format(new Date(msg.responded_at), "PPp")}
                              </span>
                            )}
                          </p>
                          <div className="bg-muted p-3 rounded-md">
                            <p className="text-sm whitespace-pre-wrap">{msg.response_text}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
