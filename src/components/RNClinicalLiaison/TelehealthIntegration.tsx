import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Calendar, Clock, Plus, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface TelehealthIntegrationProps {
  caseId: string;
}

interface TelehealthSession {
  id: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  duration: number;
  status: "scheduled" | "completed" | "cancelled";
  meeting_link?: string;
  participant: string;
}

export default function TelehealthIntegration({ caseId }: TelehealthIntegrationProps) {
  const [sessions] = useState<TelehealthSession[]>([
    {
      id: "1",
      title: "Case Review Meeting",
      scheduled_date: "2025-02-20",
      scheduled_time: "14:00",
      duration: 30,
      status: "scheduled",
      meeting_link: "https://meet.example.com/abc123",
      participant: "M. Garcia, RN CCM",
    },
    {
      id: "2",
      title: "Treatment Plan Discussion",
      scheduled_date: "2025-01-25",
      scheduled_time: "10:00",
      duration: 45,
      status: "completed",
      participant: "M. Garcia, RN CCM",
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [duration, setDuration] = useState("30");
  const { toast } = useToast();

  const handleScheduleMeeting = () => {
    if (!meetingTitle || !meetingDate || !meetingTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Meeting Scheduled",
      description: "Telehealth meeting has been scheduled. Meeting link will be sent via email.",
    });

    setDialogOpen(false);
    setMeetingTitle("");
    setMeetingDate("");
    setMeetingTime("");
    setDuration("30");
  };

  const getStatusBadge = (status: TelehealthSession["status"]) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      scheduled: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const upcomingSessions = sessions.filter((s) => s.status === "scheduled");
  const pastSessions = sessions.filter((s) => s.status !== "scheduled");

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Upcoming Telehealth Sessions</h3>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Telehealth Meeting</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Meeting Title</Label>
                  <Input
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="e.g., Case Review Meeting"
                  />
                </div>

                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Duration (minutes)</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleScheduleMeeting} className="w-full">
                  Schedule Meeting
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {upcomingSessions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No upcoming telehealth sessions</p>
        ) : (
          <div className="space-y-4">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="p-4 border rounded-lg bg-primary/5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{session.title}</h4>
                    <p className="text-sm text-muted-foreground">{session.participant}</p>
                  </div>
                  {getStatusBadge(session.status)}
                </div>

                <div className="flex flex-wrap gap-4 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(session.scheduled_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{session.scheduled_time} ({session.duration} min)</span>
                  </div>
                </div>

                {session.meeting_link && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => window.open(session.meeting_link, "_blank")}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Join Meeting
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Past Sessions</h3>
        {pastSessions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No past sessions</p>
        ) : (
          <div className="space-y-3">
            {pastSessions.map((session) => (
              <div key={session.id} className="p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{session.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.scheduled_date).toLocaleDateString()} at {session.scheduled_time}
                    </p>
                  </div>
                  {getStatusBadge(session.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
