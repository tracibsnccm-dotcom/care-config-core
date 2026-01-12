import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MessageSquare, Send, Search, FileText, Clock, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useAuth } from "@/auth/supabaseAuth";

interface Message {
  id: string;
  case_id: string;
  clientName: string;
  caseId: string;
  subject: string;
  preview: string;
  message_text: string;
  timestamp: Date;
  created_at: string;
  status: 'unread' | 'read' | 'replied';
  channel: 'email' | 'sms' | 'portal';
  sender_type: 'client' | 'attorney' | 'rn';
  sender_name?: string;
  is_read: boolean;
}

export default function ClientCommunicationCenter() {
  const { user } = useAuth();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("=== useEffect triggered ===");
    console.log("User:", user);
    if (user?.id) {
      fetchMessages();
    } else {
      console.log("No user, skipping fetch");
    }
  }, [user?.id]);

  async function fetchMessages() {
    console.log("=== FETCHING MESSAGES ===");
    console.log("User from auth:", user);
    console.log("User ID:", user?.id);
    
    if (!user?.id) {
      console.log("No user ID, returning early");
      return;
    }
    
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // First, get case IDs assigned to this attorney
      const assignmentsResponse = await fetch(
        `${supabaseUrl}/rest/v1/case_assignments?user_id=eq.${user.id}&role=eq.ATTORNEY&select=case_id`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      if (!assignmentsResponse.ok) {
        console.error("Failed to fetch case assignments");
        console.error("Response status:", assignmentsResponse.status);
        console.error("Response statusText:", assignmentsResponse.statusText);
        return;
      }

      const assignments = await assignmentsResponse.json();
      console.log("Case assignments response:", assignments);
      
      const caseIds = assignments.map((a: any) => a.case_id);
      console.log("Case IDs:", caseIds);

      if (caseIds.length === 0) {
        console.log("No case IDs found, setting empty messages");
        setMessages([]);
        return;
      }

      // Fetch messages for cases assigned to this attorney
      const messagesUrl = `${supabaseUrl}/rest/v1/rc_messages?` +
        `case_id=in.(${caseIds.join(',')})` +
        `&sender_type=in.(client,attorney)` +
        `&order=created_at.desc`;

      console.log("Fetching messages from URL:", messagesUrl);

      const response = await fetch(messagesUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });

      console.log("Messages response status:", response.status);
      console.log("Messages response ok:", response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("Messages response:", data);
        
        // Fetch case info to get client names
        const casesUrl = `${supabaseUrl}/rest/v1/rc_cases?` +
          `id=in.(${caseIds.join(',')})` +
          `&select=id,case_number,rc_clients(first_name,last_name)`;
        
        const casesResponse = await fetch(casesUrl, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        });

        let caseMap = new Map();
        if (casesResponse.ok) {
          const casesData = await casesResponse.json();
          casesData.forEach((c: any) => {
            caseMap.set(c.id, {
              case_number: c.case_number,
              client_name: c.rc_clients
                ? `${c.rc_clients.first_name || ''} ${c.rc_clients.last_name || ''}`.trim()
                : 'Client',
            });
          });
        }

        // Transform messages to match the Message interface
        const transformedMessages: Message[] = data.map((msg: any) => {
          const caseInfo = caseMap.get(msg.case_id);
          return {
            id: msg.id,
            case_id: msg.case_id,
            clientName: caseInfo?.client_name || 'Client',
            caseId: caseInfo?.case_number || msg.case_id.slice(0, 8),
            subject: msg.message_text.slice(0, 50) + (msg.message_text.length > 50 ? '...' : ''),
            preview: msg.message_text,
            message_text: msg.message_text,
            timestamp: new Date(msg.created_at),
            created_at: msg.created_at,
            status: msg.sender_type === 'client' && !msg.is_read ? 'unread' : msg.is_read ? 'read' : 'replied',
            channel: 'portal',
            sender_type: msg.sender_type,
            sender_name: msg.sender_name,
            is_read: msg.is_read,
          };
        });

        console.log("Transformed messages:", transformedMessages);
        setMessages(transformedMessages);
        console.log("Final messages state set to:", transformedMessages.length, "messages");
      } else {
        console.error("Messages response not OK, status:", response.status);
        const errorText = await response.text();
        console.error("Error response text:", errorText);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
      console.log("Loading set to false");
    }
  }

  async function handleSendReply() {
    if (!replyText.trim() || !selectedMessage || !user?.id) return;
    
    setSending(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Get attorney name if available
      const attorneyName = user.user_metadata?.full_name || user.email || 'Attorney';
      
      const messageData = {
        case_id: selectedMessage.case_id,
        sender_type: 'attorney',
        sender_id: user.id,
        sender_name: attorneyName,
        message_text: replyText.trim(),
        is_read: false,
        created_at: new Date().toISOString()
      };
      
      console.log("Sending message:", messageData);
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_messages`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(messageData)
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error('Failed to send message');
      }
      
      console.log("Message sent successfully");
      setReplyText("");
      // Refresh messages
      await fetchMessages();
      
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  const filteredMessages = messages.filter(msg =>
    msg.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread': return <Badge variant="destructive">Unread</Badge>;
      case 'read': return <Badge variant="secondary">Read</Badge>;
      case 'replied': return <Badge variant="default">Replied</Badge>;
      default: return null;
    }
  };

  const templates = [
    { id: '1', name: 'Welcome Message', content: 'Dear [Client Name],\n\nWelcome to our legal services...' },
    { id: '2', name: 'Appointment Reminder', content: 'Dear [Client Name],\n\nThis is a reminder...' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-destructive">{messages.filter(m => m.status === 'unread').length}</p>
              <p className="text-sm text-muted-foreground">Unread Messages</p>
            </div>
            <Mail className="h-8 w-8 text-destructive" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{messages.length}</p>
              <p className="text-sm text-muted-foreground">Total Messages</p>
            </div>
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-success">2.5h</p>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
            </div>
            <Clock className="h-8 w-8 text-success" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">95%</p>
              <p className="text-sm text-muted-foreground">Response Rate</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-4">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="h-[600px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading messages...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No messages found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMessages.map(msg => (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedMessage?.id === msg.id ? 'bg-primary/10 border-primary' : 'bg-card border-border'
                    } border hover:bg-accent/30`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm text-foreground truncate">{msg.clientName}</p>
                      {getStatusBadge(msg.status)}
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1 truncate">{msg.subject}</p>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{msg.preview}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        <Card className="lg:col-span-2 p-6">
          {selectedMessage ? (
            <div className="space-y-6">
              <div className="pb-4 border-b border-border">
                <h3 className="text-xl font-semibold text-foreground">{selectedMessage.subject}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  From: {selectedMessage.clientName} • Case: {selectedMessage.caseId}
                </p>
              </div>

              <div className="py-4">
                <p className="text-foreground whitespace-pre-wrap">{selectedMessage.message_text || selectedMessage.preview}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">Reply</h4>
                  <Select>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Use template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  className="min-h-[200px]"
                />
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      console.log("=== SEND CLICKED ===");
                      handleSendReply();
                    }}
                    disabled={!replyText.trim() || sending}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {sending ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[600px] text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Message Selected</h3>
              <p className="text-sm text-muted-foreground">Select a message to view and reply</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
