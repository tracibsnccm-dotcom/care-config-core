import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  case_id: string;
  sender_type: 'client' | 'rn' | 'attorney';
  sender_id: string | null;
  sender_name?: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
}

interface CaseMessages {
  case_id: string;
  case_number: string | null;
  client_name?: string;
  unreadCount: number;
  latestMessage?: Message;
}

export function CommunicationWidget() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestMessage, setLatestMessage] = useState<CaseMessages | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnreadMessages();
  }, []);

  async function fetchUnreadMessages() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Fetch unread client messages
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_messages?sender_type=eq.client&is_read=eq.false&order=created_at.desc&limit=1`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      if (response.ok) {
        const messages: Message[] = await response.json();
        
        // Get total unread count
        const countResponse = await fetch(
          `${supabaseUrl}/rest/v1/rc_messages?sender_type=eq.client&is_read=eq.false&select=id`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
          }
        );

        if (countResponse.ok) {
          const allUnread = await countResponse.json();
          setUnreadCount(allUnread.length || 0);
        }

        if (messages.length > 0) {
          const latest = messages[0];
          
          // Get case info
          const caseResponse = await fetch(
            `${supabaseUrl}/rest/v1/rc_cases?id=eq.${latest.case_id}&is_superseded=eq.false&select=id,case_number,rc_clients(first_name,last_name)&limit=1`,
            {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
              },
            }
          );

          if (caseResponse.ok) {
            const caseData = await caseResponse.json();
            const caseInfo = caseData[0];
            if (caseInfo) {
              setLatestMessage({
                case_id: latest.case_id,
                case_number: caseInfo.case_number,
                client_name: caseInfo.rc_clients
                  ? `${caseInfo.rc_clients.first_name || ''} ${caseInfo.rc_clients.last_name || ''}`.trim()
                  : undefined,
                unreadCount: 0,
                latestMessage: latest,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching unread messages:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleViewAll = () => {
    navigate('/attorney/communications');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-slate-500">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Communications
          </CardTitle>
          {unreadCount > 0 && (
            <Badge className="bg-blue-600 text-white">{unreadCount}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {unreadCount === 0 ? (
          <div className="text-center py-4">
            <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No unread messages</p>
          </div>
        ) : (
          <div className="space-y-3">
            {latestMessage && (
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {latestMessage.case_number || 'Case'}
                    </p>
                    {latestMessage.client_name && (
                      <p className="text-xs text-slate-600">{latestMessage.client_name}</p>
                    )}
                  </div>
                  <Badge className="bg-amber-600 text-white text-xs">New</Badge>
                </div>
                {latestMessage.latestMessage && (
                  <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                    {latestMessage.latestMessage.message_text}
                  </p>
                )}
                {latestMessage.latestMessage && (
                  <p className="text-xs text-slate-500">
                    {format(new Date(latestMessage.latestMessage.created_at), "MMM d, h:mm a")}
                  </p>
                )}
              </div>
            )}
            {unreadCount > 1 && (
              <p className="text-xs text-slate-500 text-center">
                +{unreadCount - 1} more unread message{unreadCount - 1 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
        <Button
          onClick={handleViewAll}
          variant="outline"
          className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          View All Messages
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
