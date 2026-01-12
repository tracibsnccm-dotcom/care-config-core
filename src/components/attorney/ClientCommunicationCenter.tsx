import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MessageSquare, Send, Search, FileText, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface Message {
  id: string;
  clientName: string;
  caseId: string;
  subject: string;
  preview: string;
  timestamp: Date;
  status: 'unread' | 'read' | 'replied';
  channel: 'email' | 'sms' | 'portal';
}

export default function ClientCommunicationCenter() {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");

  const messages: Message[] = [
    {
      id: '1',
      clientName: 'John Doe',
      caseId: 'RC-12345678',
      subject: 'Question about upcoming appointment',
      preview: 'Hi, I wanted to confirm the time for my appointment next week...',
      timestamp: new Date(),
      status: 'unread',
      channel: 'email'
    }
  ];

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
      <div className="bg-red-500 text-white p-4 text-xl font-bold">
        === EDITING THIS FILE ===
      </div>
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
                <p className="text-foreground">{selectedMessage.preview}</p>
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
                  placeholder="Type your reply..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="min-h-[200px]"
                />
                
                <div className="flex justify-end">
                  <Button>
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </Button>
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
