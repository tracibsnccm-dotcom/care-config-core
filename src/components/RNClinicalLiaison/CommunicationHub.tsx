import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { MessageSquare, Send, Mail, Phone, Calendar } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  message_text: string;
  sender_id: string;
  sender_role: string;
  created_at: string;
  is_important?: boolean;
}

interface DirectMessage {
  id: string;
  message_text: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  read_at?: string;
}

interface Communication {
  id: string;
  type: string;
  channel: string;
  status: string;
  message_content?: string;
  sent_at: string;
}

interface CommunicationHubProps {
  caseId: string;
  clientId: string;
}

export default function CommunicationHub({ caseId, clientId }: CommunicationHubProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllCommunications();
  }, [caseId]);

  const fetchAllCommunications = async () => {
    try {
      const [messagesRes, directRes, commsRes] = await Promise.all([
        supabase
          .from("attorney_rn_messages")
          .select("*")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false }),
        supabase
          .from("client_direct_messages")
          .select("*")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false }),
        supabase
          .from("client_communications")
          .select("*")
          .eq("client_id", clientId)
          .order("sent_at", { ascending: false })
          .limit(20)
      ]);

      if (messagesRes.error) throw messagesRes.error;
      if (directRes.error) throw directRes.error;
      if (commsRes.error) throw commsRes.error;

      setMessages(messagesRes.data || []);
      setDirectMessages(directRes.data || []);
      setCommunications(commsRes.data || []);
    } catch (error: any) {
      toast.error("Failed to load communications");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase.from("attorney_rn_messages").insert({
        case_id: caseId,
        sender_id: user.id,
        sender_role: "RN_CM",
        message_text: newMessage,
        is_important: false
      });

      if (error) throw error;
      
      toast.success("Message sent");
      setNewMessage("");
      fetchAllCommunications();
    } catch (error: any) {
      toast.error("Failed to send message");
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading communications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Team Messages</p>
              <p className="text-2xl font-bold">{messages.length}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Direct Messages</p>
              <p className="text-2xl font-bold">{directMessages.length}</p>
            </div>
            <Mail className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Client Communications</p>
              <p className="text-2xl font-bold">{communications.length}</p>
            </div>
            <Phone className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="team" className="w-full">
        <TabsList>
          <TabsTrigger value="team">Team Messages ({messages.length})</TabsTrigger>
          <TabsTrigger value="direct">Direct Messages ({directMessages.length})</TabsTrigger>
          <TabsTrigger value="history">Communication History ({communications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          <Card className="p-4">
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="border-b pb-3 last:border-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{msg.sender_role}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                          {msg.is_important && (
                            <Badge variant="destructive">Important</Badge>
                          )}
                        </div>
                        <p className="text-sm">{msg.message_text}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                rows={3}
              />
              <Button onClick={handleSendMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="direct">
          <Card className="p-4">
            <div className="space-y-3">
              {directMessages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No direct messages</p>
              ) : (
                directMessages.map((msg) => (
                  <div key={msg.id} className="border-b pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                      {!msg.read_at && <Badge variant="secondary">Unread</Badge>}
                    </div>
                    <p className="text-sm">{msg.message_text}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-4">
            <div className="space-y-3">
              {communications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No communication history</p>
              ) : (
                communications.map((comm) => (
                  <div key={comm.id} className="border-b pb-3 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{comm.type}</Badge>
                      <Badge variant="secondary">{comm.channel}</Badge>
                      <Badge>{comm.status}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(comm.sent_at).toLocaleString()}
                      </span>
                    </div>
                    {comm.message_content && (
                      <p className="text-sm text-muted-foreground">{comm.message_content}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
