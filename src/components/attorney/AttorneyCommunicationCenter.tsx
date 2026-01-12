import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Send, ChevronDown, ChevronUp, Calendar, User, FileText, Search } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/auth/supabaseAuth";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  case_id: string;
  sender_type: 'client' | 'rn' | 'attorney';
  sender_id: string | null;
  sender_name?: string;
  message_text: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface RNNote {
  id: string;
  case_id: string;
  rn_id: string | null;
  rn_name?: string;
  note_type: string | null;
  note_body: string | null;
  created_at: string;
}

interface Case {
  id: string;
  case_number: string | null;
  client_id: string;
  client_name?: string;
}

interface CaseMessages {
  case: Case;
  messages: Message[];
  unreadCount: number;
}

export function AttorneyCommunicationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("client-messages");
  const [cases, setCases] = useState<Case[]>([]);
  const [caseMessages, setCaseMessages] = useState<CaseMessages[]>([]);
  const [messageList, setMessageList] = useState<CaseMessages[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [rnNotes, setRNNotes] = useState<RNNote[]>([]);
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  useEffect(() => {
    if (user?.id) {
      fetchCases();
    }
  }, [user?.id]);

  useEffect(() => {
    if (cases.length > 0) {
      if (activeTab === "client-messages") {
        fetchClientMessages();
      } else if (activeTab === "rn-communications") {
        fetchRNNotes();
      } else if (activeTab === "all-activity") {
        fetchAllActivity();
      }
    }
  }, [activeTab, cases]);

  async function fetchCases() {
    if (!user?.id) return;
    
    try {
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
        return;
      }

      const assignments = await assignmentsResponse.json();
      const caseIds = assignments.map((a: any) => a.case_id);

      if (caseIds.length === 0) {
        setCases([]);
        return;
      }

      // Fetch cases assigned to attorney with client info
      const casesUrl = `${supabaseUrl}/rest/v1/rc_cases?` +
        `id=in.(${caseIds.join(',')})` +
        `&select=id,case_number,client_id,rc_clients(first_name,last_name)` +
        `&order=case_number.asc`;

      const response = await fetch(casesUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const processedCases = data.map((c: any) => ({
          id: c.id,
          case_number: c.case_number,
          client_id: c.client_id,
          client_name: c.rc_clients
            ? `${c.rc_clients.first_name || ''} ${c.rc_clients.last_name || ''}`.trim()
            : undefined,
        }));
        setCases(processedCases);
      }
    } catch (err) {
      console.error("Error fetching cases:", err);
    }
  }

  async function fetchClientMessages() {
    if (!user?.id || cases.length === 0) {
      if (cases.length === 0 && user?.id) {
        // Cases haven't loaded yet, wait for them
        await fetchCases();
        return;
      }
      return;
    }

    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const caseIds = cases.map(c => c.id);
      if (caseIds.length === 0) {
        setCaseMessages([]);
        setMessageList([]);
        return;
      }

      // Fetch messages only for cases assigned to this attorney
      const messagesUrl = `${supabaseUrl}/rest/v1/rc_messages?` +
        `case_id=in.(${caseIds.join(',')})` +
        `&sender_type=in.(client,attorney)` +
        `&order=created_at.desc`;

      const response = await fetch(messagesUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });

      if (response.ok) {
        const messages: Message[] = await response.json();
        
        // Group messages by case
        const messagesByCase = new Map<string, CaseMessages>();
        
        messages.forEach((msg) => {
          if (!messagesByCase.has(msg.case_id)) {
            const caseInfo = cases.find((c) => c.id === msg.case_id);
            if (caseInfo) {
              messagesByCase.set(msg.case_id, {
                case: caseInfo,
                messages: [],
                unreadCount: 0,
              });
            }
          }
          
          const caseMsg = messagesByCase.get(msg.case_id);
          if (caseMsg) {
            caseMsg.messages.push(msg);
            if (msg.sender_type === 'client' && !msg.is_read) {
              caseMsg.unreadCount++;
            }
          }
        });

        // Sort by unread count, then by most recent message
        const sortedCases = Array.from(messagesByCase.values()).sort((a, b) => {
          if (b.unreadCount !== a.unreadCount) {
            return b.unreadCount - a.unreadCount;
          }
          const aLastMsg = a.messages[0]?.created_at || '';
          const bLastMsg = b.messages[0]?.created_at || '';
          return bLastMsg.localeCompare(aLastMsg);
        });

        setCaseMessages(sortedCases);
        setMessageList(sortedCases);
      }
    } catch (err) {
      console.error("Error fetching client messages:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRNNotes() {
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      let url = `${supabaseUrl}/rest/v1/rc_rn_notes?select=*,rc_users(full_name)&order=created_at.desc`;
      
      if (dateRange.start) {
        url += `&created_at=gte.${dateRange.start}`;
      }
      if (dateRange.end) {
        url += `&created_at=lte.${dateRange.end}`;
      }

      const response = await fetch(url, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const notes: RNNote[] = data.map((note: any) => ({
          ...note,
          rn_name: note.rc_users?.full_name || 'RN',
        }));
        setRNNotes(notes);
      }
    } catch (err) {
      console.error("Error fetching RN notes:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllActivity() {
    try {
      setLoading(true);
      await Promise.all([fetchClientMessages(), fetchRNNotes()]);
    } catch (err) {
      console.error("Error fetching all activity:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReply() {
    const selectedCase = caseMessages.find(cm => cm.case.id === selectedCaseId);
    const caseId = selectedCase?.case.id;

    console.log("Send Reply clicked");
    console.log("Reply text:", replyText);
    console.log("Selected case:", selectedCase);

    if (!replyText.trim() || !user?.id) {
      console.log("Validation failed - message empty or no user");
      return;
    }

    if (!caseId) {
      console.error("No case ID provided");
      toast({
        title: "Error",
        description: "No case selected. Please select a case to send a message.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Get attorney name if available
      const attorneyName = user.user_metadata?.full_name || user.email || 'Attorney';

      const messageData = {
        case_id: caseId,
        sender_type: 'attorney',
        sender_id: user.id,
        sender_name: attorneyName,
        message_text: replyText.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
      };

      console.log("Sending message data:", messageData);

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_messages`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(messageData),
        }
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(errorText || 'Failed to send message');
      }

      const result = await response.json();
      console.log("Message sent successfully:", result);

      // Clear the textarea
      setReplyText("");
      
      // Refresh the message thread
      await fetchClientMessages();
      
      // Show success toast
      toast({
        title: "Message sent",
        description: "Your reply has been sent successfully.",
      });
    } catch (err: any) {
      console.error("Error sending message:", err);
      toast({
        title: "Error",
        description: "Failed to send message: " + (err.message || "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  async function markAsRead(messageId: string) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      await fetch(
        `${supabaseUrl}/rest/v1/rc_messages?id=eq.${messageId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_read: true,
            read_at: new Date().toISOString(),
          }),
        }
      );

      await fetchClientMessages();
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  }

  // Mark messages as read when viewing detail
  useEffect(() => {
    if (selectedCaseId && caseMessages.length > 0) {
      const caseMsg = caseMessages.find((cm) => cm.case.id === selectedCaseId);
      if (caseMsg) {
        caseMsg.messages
          .filter((m) => m.sender_type === 'client' && !m.is_read)
          .forEach((m) => {
            markAsRead(m.id);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCaseId, caseMessages.length]);

  const allActivityItems = [
    ...caseMessages.flatMap((cm) =>
      cm.messages.map((msg) => ({
        type: 'message' as const,
        case: cm.case,
        data: msg,
        created_at: msg.created_at,
      }))
    ),
    ...rnNotes.map((note) => ({
      type: 'rn_note' as const,
      case: cases.find((c) => c.id === note.case_id),
      data: note,
      created_at: note.created_at,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalUnread = caseMessages.reduce((sum, cm) => sum + cm.unreadCount, 0);

  if (loading && activeTab === "client-messages" && caseMessages.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-slate-600">Loading communications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-slate-800 text-2xl flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                Communication Center
              </CardTitle>
              <p className="text-slate-600 text-sm mt-1">
                View and manage all case communications
              </p>
            </div>
            {totalUnread > 0 && (
              <Badge className="bg-blue-600 text-white text-lg px-3 py-1">
                {totalUnread} Unread
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border-b border-slate-200">
          <TabsTrigger value="client-messages" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Client Messages
            {totalUnread > 0 && (
              <Badge className="ml-2 bg-blue-600 text-white">{totalUnread}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rn-communications" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            RN Communications
          </TabsTrigger>
          <TabsTrigger value="all-activity" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            All Activity
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Client Messages */}
        <TabsContent value="client-messages" className="space-y-4">
          {/* Message List View */}
          {!selectedCaseId && (
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search messages by client name or case number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {messageList
                    .filter((cm) => {
                      if (!searchTerm) return true;
                      const search = searchTerm.toLowerCase();
                      return (
                        cm.case.client_name?.toLowerCase().includes(search) ||
                        cm.case.case_number?.toLowerCase().includes(search) ||
                        cm.messages.some(m => m.message_text.toLowerCase().includes(search))
                      );
                    })
                    .map((caseMsg) => {
                      const latestMsg = caseMsg.messages[0];
                      const preview = latestMsg?.message_text.slice(0, 50) || '';
                      return (
                        <div
                          key={caseMsg.case.id}
                          onClick={() => {
                            setSelectedCaseId(caseMsg.case.id);
                            setExpandedCases(new Set([caseMsg.case.id]));
                          }}
                          className={`p-4 rounded-lg cursor-pointer transition-colors border mb-2 ${
                            selectedCaseId === caseMsg.case.id
                              ? 'bg-blue-50 border-blue-300'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">
                                {caseMsg.case.client_name || 'Client'}
                              </p>
                              <p className="text-sm text-slate-600">
                                {caseMsg.case.case_number || 'Case ' + caseMsg.case.id.slice(0, 8)}
                              </p>
                            </div>
                            {caseMsg.unreadCount > 0 && (
                              <Badge variant="destructive">{caseMsg.unreadCount}</Badge>
                            )}
                          </div>
                          {latestMsg && (
                            <>
                              <p className="text-sm text-slate-700 mb-1 line-clamp-2">
                                {preview}{preview.length < latestMsg.message_text.length ? '...' : ''}
                              </p>
                              <p className="text-xs text-slate-500">
                                {format(new Date(latestMsg.created_at), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            </>
                          )}
                        </div>
                      );
                    })}
                  {messageList.filter((cm) => {
                    if (!searchTerm) return true;
                    const search = searchTerm.toLowerCase();
                    return (
                      cm.case.client_name?.toLowerCase().includes(search) ||
                      cm.case.case_number?.toLowerCase().includes(search) ||
                      cm.messages.some(m => m.message_text.toLowerCase().includes(search))
                    );
                  }).length === 0 && (
                    <div className="p-8 text-center">
                      <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">No messages found.</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Message Detail View */}
          {selectedCaseId && (
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCaseId(null)}
                      className="mb-2"
                    >
                      ← Back to Messages
                    </Button>
                    {(() => {
                      const caseMsg = caseMessages.find(cm => cm.case.id === selectedCaseId);
                      return caseMsg ? (
                        <div>
                          <h3 className="font-semibold text-slate-800 text-lg">
                            {caseMsg.case.client_name || 'Client'}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {caseMsg.case.case_number || 'Case ' + caseMsg.case.id.slice(0, 8)}
                          </p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const caseMsg = caseMessages.find(cm => cm.case.id === selectedCaseId);
                  if (!caseMsg) return null;

                  const messages = caseMsg.messages.sort(
                    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  );

                  return (
                    <div className="space-y-4">
                      {/* Message Thread */}
                      <ScrollArea className="h-[500px] bg-slate-50 rounded-lg p-4">
                        <div className="space-y-3">
                          {messages.map((message) => {
                            const isClient = message.sender_type === 'client';
                            return (
                              <div
                                key={message.id}
                                className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}
                              >
                                <div
                                  className={`max-w-[75%] rounded-lg p-3 ${
                                    isClient
                                      ? 'bg-amber-100 text-slate-800 border border-amber-200'
                                      : 'bg-blue-600 text-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm">
                                      {message.sender_name || (isClient ? 'Client' : 'You')}
                                    </span>
                                    {message.is_read && !isClient && (
                                      <span className="text-xs text-white/70">✓ Read</span>
                                    )}
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                                  <p className={`text-xs mt-1 ${isClient ? 'text-slate-500' : 'text-white/70'}`}>
                                    {format(new Date(message.created_at), "MMM d, yyyy 'at' h:mm a")}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>

                      {/* Compose Message */}
                      <div className="space-y-2">
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your message..."
                          rows={3}
                          className="bg-white border-slate-200"
                        />
                        <div className="flex justify-end flex-col items-end gap-2">
                          <button 
                            type="button"
                            onClick={() => alert("Button works!")}
                            className="bg-green-500 text-white px-2 py-1 rounded mb-2"
                          >
                            Test Click
                          </button>
                          <button
                            type="button"
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log("=== SEND BUTTON CLICKED ===");
                              console.log("replyText:", replyText);
                              console.log("selectedCase:", caseMsg);
                              handleSendReply();
                            }}
                            disabled={!replyText.trim() || sending}
                          >
                            SEND TEST
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

        </TabsContent>

        {/* Tab 2: RN Communications */}
        <TabsContent value="rn-communications" className="space-y-4">
          {/* Date Range Filter */}
          <Card className="bg-white border-slate-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>
              </div>
              <Button
                onClick={fetchRNNotes}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Apply Filter
              </Button>
            </CardContent>
          </Card>

          {rnNotes.length === 0 ? (
            <Card className="bg-white border-slate-200">
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">No RN notes found.</p>
              </CardContent>
            </Card>
          ) : (
            rnNotes.map((note) => {
              const caseInfo = cases.find((c) => c.id === note.case_id);
              return (
                <Card key={note.id} className="bg-white border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {caseInfo?.case_number || 'Case ' + note.case_id.slice(0, 8)}
                        </h3>
                        {caseInfo?.client_name && (
                          <p className="text-sm text-slate-600">{caseInfo.client_name}</p>
                        )}
                      </div>
                      <Badge className="bg-green-600 text-white">RN Note</Badge>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-600">{note.rn_name || 'RN'}</span>
                        {note.note_type && (
                          <Badge variant="outline" className="ml-2">
                            {note.note_type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{note.note_body}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Tab 3: All Activity */}
        <TabsContent value="all-activity" className="space-y-4">
          {allActivityItems.length === 0 ? (
            <Card className="bg-white border-slate-200">
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">No activity found.</p>
              </CardContent>
            </Card>
          ) : (
            allActivityItems.map((item, idx) => {
              const caseInfo = item.case || cases.find((c) => c.id === (item.data as any).case_id);
              const bgColor =
                item.type === 'message'
                  ? (item.data as Message).sender_type === 'client'
                    ? 'bg-amber-50 border-amber-200'
                    : (item.data as Message).sender_type === 'attorney'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-slate-50 border-slate-200'
                  : 'bg-green-50 border-green-200';

              return (
                <Card key={item.type + '-' + (item.data as any).id || idx} className={bgColor}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {caseInfo?.case_number || 'Case'}
                        </h3>
                        {caseInfo?.client_name && (
                          <p className="text-sm text-slate-600">{caseInfo.client_name}</p>
                        )}
                      </div>
                      <Badge
                        className={
                          item.type === 'message'
                            ? (item.data as Message).sender_type === 'client'
                              ? 'bg-amber-600 text-white'
                              : 'bg-blue-600 text-white'
                            : 'bg-green-600 text-white'
                        }
                      >
                        {item.type === 'message'
                          ? (item.data as Message).sender_type === 'client'
                            ? 'Client'
                            : 'Attorney'
                          : 'RN Note'}
                      </Badge>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      {item.type === 'message' ? (
                        <p className="text-slate-700 whitespace-pre-wrap">
                          {(item.data as Message).message_text}
                        </p>
                      ) : (
                        <p className="text-slate-700 whitespace-pre-wrap">
                          {(item.data as RNNote).note_body}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
