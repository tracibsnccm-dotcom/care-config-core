import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MessageSquare, 
  User, 
  UserPlus, 
  FileText, 
  Calendar, 
  Pill, 
  Activity, 
  AlertTriangle,
  Send,
  Plus
} from "lucide-react";
import { useState, useEffect } from "react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { useAuth } from "@/auth/supabaseAuth";
import { useToast } from "@/hooks/use-toast";

interface Case {
  id: string;
  case_number: string | null;
  client_name: string;
}

interface Note {
  id: string;
  case_id: string;
  case_number: string;
  client_name: string;
  note_text: string;
  created_at: string;
  created_by_type: 'attorney' | 'rn' | 'client' | 'system';
  created_by_id: string | null;
  created_by_name: string | null;
  is_auto: boolean;
  note_type?: string;
  trigger_event?: string;
}

export default function AttorneyCaseNotes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'auto' | 'manual' | 'rn'>('all');
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [messageClientOpen, setMessageClientOpen] = useState(false);
  const [messageRNOpen, setMessageRNOpen] = useState(false);
  const [newNote, setNewNote] = useState({ caseId: '', noteText: '', shareWithRN: false, shareWithClient: false });
  const [messageClient, setMessageClient] = useState({ caseId: '', messageText: '' });
  const [messageRN, setMessageRN] = useState({ caseId: '', messageText: '' });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchCases();
      fetchNotes();
    }
  }, [user?.id]);

  async function fetchCases() {
    if (!user?.id) return;
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const assignmentsUrl = `${supabaseUrl}/rest/v1/rc_case_assignments?user_id=eq.${user.id}&status=eq.active&select=case_id`;
      const assignmentsResponse = await fetch(assignmentsUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });

      if (!assignmentsResponse.ok) return;

      const assignmentsData = await assignmentsResponse.json();
      const caseIds = assignmentsData.map((a: any) => a.case_id);

      if (caseIds.length === 0) {
        setCases([]);
        return;
      }

      const casesUrl = `${supabaseUrl}/rest/v1/rc_cases?id=in.(${caseIds.join(',')})&select=id,case_number,rc_clients(first_name,last_name)`;
      const casesResponse = await fetch(casesUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });

      if (casesResponse.ok) {
        const casesData = await casesResponse.json();
        const transformedCases: Case[] = casesData.map((c: any) => ({
          id: c.id,
          case_number: c.case_number,
          client_name: c.rc_clients
            ? `${c.rc_clients.first_name || ''} ${c.rc_clients.last_name || ''}`.trim()
            : 'Client',
        }));
        setCases(transformedCases);
      }
    } catch (err) {
      console.error("Error fetching cases:", err);
    }
  }

  async function fetchNotes() {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const assignmentsUrl = `${supabaseUrl}/rest/v1/rc_case_assignments?user_id=eq.${user.id}&status=eq.active&select=case_id`;
      const assignmentsResponse = await fetch(assignmentsUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });

      if (!assignmentsResponse.ok) return;

      const assignmentsData = await assignmentsResponse.json();
      const caseIds = assignmentsData.map((a: any) => a.case_id);

      if (caseIds.length === 0) {
        setNotes([]);
        return;
      }

      // Fetch notes - adapt to existing schema
      const notesUrl = `${supabaseUrl}/rest/v1/rc_case_notes?case_id=in.(${caseIds.join(',')})&order=created_at.desc`;
      const notesResponse = await fetch(notesUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });

      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        
        // Fetch case info
        const casesUrl = `${supabaseUrl}/rest/v1/rc_cases?id=in.(${caseIds.join(',')})&select=id,case_number,rc_clients(first_name,last_name)`;
        const casesResponse = await fetch(casesUrl, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          }
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

        // Transform notes
        const transformedNotes: Note[] = notesData.map((note: any) => {
          const caseInfo = caseMap.get(note.case_id);
          return {
            id: note.id,
            case_id: note.case_id,
            case_number: caseInfo?.case_number || note.case_id.slice(0, 8),
            client_name: caseInfo?.client_name || 'Client',
            note_text: note.content || note.note_text || '',
            created_at: note.created_at,
            created_by_type: note.created_by_role === 'ATTORNEY' ? 'attorney' : 
                            note.created_by_role === 'RN_CCM' ? 'rn' : 
                            note.is_auto_generated ? 'system' : 'attorney',
            created_by_id: note.created_by,
            created_by_name: note.created_by_name || null,
            is_auto: note.is_auto_generated || false,
            note_type: note.note_type,
            trigger_event: note.trigger_event,
          };
        });

        setNotes(transformedNotes);
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote() {
    console.log("=== SAVE NOTE CLICKED ===");
    console.log("Selected case:", newNote.caseId);
    console.log("Note text:", newNote.noteText);
    console.log("Share with RN:", newNote.shareWithRN);
    console.log("Share with Client:", newNote.shareWithClient);

    console.log("=== HANDLE SAVE NOTE ===");
    if (!newNote.caseId || !newNote.noteText.trim() || !user?.id) {
      console.log("Validation failed");
      toast({
        title: "Error",
        description: "Please select a case and enter note text",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const attorneyName = user.user_metadata?.full_name || user.email || 'Attorney';

      const noteData = {
        case_id: newNote.caseId,
        note_type: 'manual',
        note_text: newNote.noteText.trim(),
        content: newNote.noteText.trim(), // Also set content field for compatibility
        created_by: user.id,
        created_by_type: 'attorney',
        created_by_id: user.id,
        created_by_role: 'ATTORNEY',
        created_by_name: attorneyName,
        is_auto: false,
        is_auto_generated: false,
        visible_to_attorney: true,
        visible_to_rn: newNote.shareWithRN,
        visible_to_client: newNote.shareWithClient,
        visibility: newNote.shareWithRN && newNote.shareWithClient ? 'shared_all' :
                   newNote.shareWithRN ? 'shared_rn' :
                   newNote.shareWithClient ? 'shared_provider' : 'private',
        created_at: new Date().toISOString(),
      };

      console.log("Sending note data:", noteData);

      const response = await fetch(`${supabaseUrl}/rest/v1/rc_case_notes`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(noteData),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error('Failed to save note');
      }

      const result = await response.json();
      console.log("Note saved successfully:", result);

      toast({
        title: "Note added",
        description: "Your note has been saved successfully.",
      });

      setAddNoteOpen(false);
      setNewNote({ caseId: '', noteText: '', shareWithRN: false, shareWithClient: false });
      fetchNotes();
    } catch (err: any) {
      console.error("Error adding note:", err);
      toast({
        title: "Error",
        description: "Failed to save note: " + (err.message || "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSendClientMessage() {
    if (!messageClient.caseId || !messageClient.messageText.trim() || !user?.id) {
      toast({
        title: "Error",
        description: "Please select a case and enter message text",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const attorneyName = user.user_metadata?.full_name || user.email || 'Attorney';

      const messageData = {
        case_id: messageClient.caseId,
        sender_type: 'attorney',
        sender_id: user.id,
        sender_name: attorneyName,
        message_text: messageClient.messageText.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/rc_messages`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast({
        title: "Message sent",
        description: "Your message has been sent to the client.",
      });

      setMessageClientOpen(false);
      setMessageClient({ caseId: '', messageText: '' });
    } catch (err: any) {
      console.error("Error sending message:", err);
      toast({
        title: "Error",
        description: "Failed to send message: " + (err.message || "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleSendRNMessage() {
    if (!messageRN.caseId || !messageRN.messageText.trim() || !user?.id) {
      toast({
        title: "Error",
        description: "Please select a case and enter message text",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const attorneyName = user.user_metadata?.full_name || user.email || 'Attorney';

      const messageData = {
        case_id: messageRN.caseId,
        sender_type: 'attorney',
        recipient_type: 'rn',
        sender_id: user.id,
        sender_name: attorneyName,
        message_text: messageRN.messageText.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/rc_messages`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast({
        title: "Message sent",
        description: "Your message has been sent to the RN.",
      });

      setMessageRNOpen(false);
      setMessageRN({ caseId: '', messageText: '' });
    } catch (err: any) {
      console.error("Error sending message:", err);
      toast({
        title: "Error",
        description: "Failed to send message: " + (err.message || "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  }

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const getNoteTypeBadge = (note: Note) => {
    if (note.is_auto || note.created_by_type === 'system') {
      return <Badge className="bg-gray-500 text-white">System</Badge>;
    } else if (note.created_by_type === 'attorney') {
      return <Badge className="bg-blue-600 text-white">Attorney</Badge>;
    } else if (note.created_by_type === 'rn') {
      return <Badge className="bg-green-600 text-white">RN</Badge>;
    } else if (note.created_by_type === 'client') {
      return <Badge className="bg-purple-600 text-white">Client</Badge>;
    }
    return <Badge variant="outline">Note</Badge>;
  };

  const getEventIcon = (note: Note) => {
    const eventType = note.trigger_event || note.note_type || '';
    if (eventType.includes('appointment') || eventType.includes('calendar')) {
      return <Calendar className="h-4 w-4" />;
    } else if (eventType.includes('medication') || eventType.includes('med')) {
      return <Pill className="h-4 w-4" />;
    } else if (eventType.includes('wellness') || eventType.includes('treatment') || eventType.includes('activity')) {
      return <Activity className="h-4 w-4" />;
    } else if (eventType.includes('intake') || eventType.includes('document')) {
      return <FileText className="h-4 w-4" />;
    } else if (eventType.includes('alert') || eventType.includes('crisis')) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const filteredNotes = notes.filter(note => {
    if (selectedCaseId !== 'all' && note.case_id !== selectedCaseId) return false;
    
    switch (activeFilter) {
      case 'auto':
        return note.is_auto || note.created_by_type === 'system';
      case 'manual':
        return !note.is_auto && note.created_by_type === 'attorney';
      case 'rn':
        return note.created_by_type === 'rn';
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Case Notes</h2>
          <p className="text-sm text-gray-600">View activity and communicate with your team</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setMessageClientOpen(true)}>
            <User className="h-4 w-4 mr-2" />
            Message Client
          </Button>
          <Button variant="outline" onClick={() => setMessageRNOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Message RN
          </Button>
          <Button onClick={() => setAddNoteOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Cases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cases</SelectItem>
            {cases.map(caseItem => (
              <SelectItem key={caseItem.id} value={caseItem.id}>
                {caseItem.case_number || caseItem.id.slice(0, 8)} - {caseItem.client_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="auto">Auto-Generated</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="rn">RN Notes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
        ) : filteredNotes.length > 0 ? (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {filteredNotes.map(note => (
                <div key={note.id} className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getEventIcon(note)}
                      <span className="text-xs text-gray-500">{formatTimestamp(note.created_at)}</span>
                    </div>
                    {getNoteTypeBadge(note)}
                  </div>
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {note.case_number} - {note.client_name}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note_text}</p>
                  {note.created_by_name && (
                    <p className="text-xs text-gray-500 mt-2">By: {note.created_by_name}</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600">No notes found</p>
          </div>
        )}
      </Card>

      {/* Add Note Dialog */}
      <Dialog open={addNoteOpen} onOpenChange={setAddNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>Create a new note for a case</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Case *</Label>
              <Select value={newNote.caseId} onValueChange={(v) => setNewNote({ ...newNote, caseId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map(caseItem => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.case_number || caseItem.id.slice(0, 8)} - {caseItem.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Note Text *</Label>
              <Textarea
                value={newNote.noteText}
                onChange={(e) => setNewNote({ ...newNote, noteText: e.target.value })}
                placeholder="Enter your note..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="share-rn"
                  checked={newNote.shareWithRN}
                  onCheckedChange={(checked) => setNewNote({ ...newNote, shareWithRN: checked as boolean })}
                />
                <Label htmlFor="share-rn" className="font-normal cursor-pointer">Share with RN</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="share-client"
                  checked={newNote.shareWithClient}
                  onCheckedChange={(checked) => setNewNote({ ...newNote, shareWithClient: checked as boolean })}
                />
                <Label htmlFor="share-client" className="font-normal cursor-pointer">Share with Client</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddNoteOpen(false);
              setNewNote({ caseId: '', noteText: '', shareWithRN: false, shareWithClient: false });
            }}>Cancel</Button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Save button clicked");
                handleAddNote();
              }}
              disabled={!newNote.caseId || !newNote.noteText.trim() || saving}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Note"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Client Dialog */}
      <Dialog open={messageClientOpen} onOpenChange={setMessageClientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message Client</DialogTitle>
            <DialogDescription>Send a message to the client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Case *</Label>
              <Select value={messageClient.caseId} onValueChange={(v) => setMessageClient({ ...messageClient, caseId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map(caseItem => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.case_number || caseItem.id.slice(0, 8)} - {caseItem.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea 
                value={messageClient.messageText}
                onChange={(e) => setMessageClient({ ...messageClient, messageText: e.target.value })}
                placeholder="Type your message..." 
                rows={6} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setMessageClientOpen(false);
              setMessageClient({ caseId: '', messageText: '' });
            }}>Cancel</Button>
            <Button onClick={handleSendClientMessage} disabled={sendingMessage || !messageClient.caseId || !messageClient.messageText.trim()}>
              {sendingMessage ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message RN Dialog */}
      <Dialog open={messageRNOpen} onOpenChange={setMessageRNOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message RN</DialogTitle>
            <DialogDescription>Send a message to the RN assigned to this case</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Case *</Label>
              <Select value={messageRN.caseId} onValueChange={(v) => setMessageRN({ ...messageRN, caseId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map(caseItem => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.case_number || caseItem.id.slice(0, 8)} - {caseItem.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea 
                value={messageRN.messageText}
                onChange={(e) => setMessageRN({ ...messageRN, messageText: e.target.value })}
                placeholder="Type your message..." 
                rows={6} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setMessageRNOpen(false);
              setMessageRN({ caseId: '', messageText: '' });
            }}>Cancel</Button>
            <Button onClick={handleSendRNMessage} disabled={sendingMessage || !messageRN.caseId || !messageRN.messageText.trim()}>
              {sendingMessage ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
