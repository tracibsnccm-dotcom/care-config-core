import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { MessageSquare, Send, Search, Clock, CheckCheck, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  message_text: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  read_at?: string;
  case_id: string;
}

interface Client {
  user_id: string;
  display_name: string;
  case_id: string;
  unread_count: number;
}

export default function ClientCommunicationCenter() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClient) {
      fetchMessages();
      markAsRead();
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      // Get cases assigned to attorney
      const { data: cases, error: casesErr } = await supabase
        .from("case_assignments")
        .select("case_id")
        .eq("user_id", user?.id)
        .eq("role", "ATTORNEY");

      if (casesErr) throw casesErr;
      if (!cases || cases.length === 0) {
        setClients([]);
        return;
      }

      const caseIds = cases.map(c => c.case_id);

      // Get client assignments for these cases
      const { data: clientAssignments, error: clientErr } = await supabase
        .from("case_assignments")
        .select("case_id, user_id")
        .in("case_id", caseIds)
        .eq("role", "CLIENT");

      if (clientErr) throw clientErr;

      // Get profiles
      const clientIds = clientAssignments?.map(c => c.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", clientIds);

      // Get unread message counts
      const { data: unreadMessages } = await supabase
        .from("client_direct_messages")
        .select("recipient_id, case_id")
        .eq("recipient_id", user?.id)
        .is("read_at", null);

      const unreadCounts = new Map<string, number>();
      unreadMessages?.forEach(msg => {
        unreadCounts.set(msg.case_id, (unreadCounts.get(msg.case_id) || 0) + 1);
      });

      const clientList: Client[] = clientAssignments?.map(ca => ({
        user_id: ca.user_id,
        display_name: profiles?.find(p => p.user_id === ca.user_id)?.display_name || "Unknown",
        case_id: ca.case_id,
        unread_count: unreadCounts.get(ca.case_id) || 0
      })) || [];

      setClients(clientList);
    } catch (error: any) {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedClient) return;

    try {
      const { data, error } = await supabase
        .from("client_direct_messages")
        .select("*")
        .eq("case_id", selectedClient.case_id)
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error("Failed to load messages");
    }
  };

  const markAsRead = async () => {
    if (!selectedClient) return;

    await supabase
      .from("client_direct_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("case_id", selectedClient.case_id)
      .eq("recipient_id", user?.id)
      .is("read_at", null);

    // Update unread count in local state
    setClients(clients.map(c => 
      c.case_id === selectedClient.case_id ? { ...c, unread_count: 0 } : c
    ));
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedClient || !user) return;

    try {
      const { error } = await supabase.from("client_direct_messages").insert({
        case_id: selectedClient.case_id,
        sender_id: user.id,
        recipient_id: selectedClient.user_id,
        message_text: newMessage
      });

      if (error) throw error;

      setNewMessage("");
      fetchMessages();
      toast.success("Message sent");
    } catch (error: any) {
      toast.error("Failed to send message");
    }
  };

  const filteredClients = clients.filter(c =>
    c.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnread = clients.reduce((sum, c) => sum + c.unread_count, 0);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading communications...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Clients</p>
              <p className="text-2xl font-bold">{clients.length}</p>
            </div>
            <User className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unread Messages</p>
              <p className="text-2xl font-bold text-blue-500">{totalUnread}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Conversations</p>
              <p className="text-2xl font-bold">{clients.filter(c => c.unread_count > 0).length}</p>
            </div>
            <CheckCheck className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Main Communication Interface */}
      <Card className="p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
          {/* Client List */}
          <div className="border-r">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <ScrollArea className="h-[calc(600px-73px)]">
              <div className="p-2 space-y-1">
                {filteredClients.map((client) => (
                  <button
                    key={client.user_id}
                    onClick={() => setSelectedClient(client)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedClient?.user_id === client.user_id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{client.display_name}</span>
                      {client.unread_count > 0 && (
                        <Badge variant="default" className="ml-2">
                          {client.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Case: {client.case_id.slice(-8)}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Message Area */}
          <div className="col-span-2 flex flex-col">
            {selectedClient ? (
              <>
                {/* Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedClient.display_name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Case #{selectedClient.case_id.slice(-8)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.message_text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs opacity-70">
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </span>
                            {msg.sender_id === user?.id && msg.read_at && (
                              <CheckCheck className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="resize-none"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Select a client to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
