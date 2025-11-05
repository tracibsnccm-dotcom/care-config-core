import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, MessageSquare, Calendar, Users, AlertCircle, Activity, BookOpen, Video, ExternalLink, Clock, Play, Square, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Resource {
  id: string;
  title: string;
  type: "document" | "video" | "guide";
  category: string;
  url: string;
}

export function RNQuickActionsBar() {
  const navigate = useNavigate();
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  const resources: Resource[] = [
    {
      id: "1",
      title: "Care Plan Best Practices",
      type: "document",
      category: "Clinical Guidelines",
      url: "#",
    },
    {
      id: "2",
      title: "Medication Management Video",
      type: "video",
      category: "Training",
      url: "#",
    },
    {
      id: "3",
      title: "Documentation Standards",
      type: "guide",
      category: "Compliance",
      url: "#",
    },
    {
      id: "4",
      title: "Client Communication Tips",
      type: "document",
      category: "Best Practices",
      url: "#",
    },
  ];

  const getIcon = (type: Resource["type"]) => {
    switch (type) {
      case "document":
        return <FileText className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "guide":
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const actions = [
    { icon: ClipboardList, label: "My Work Queue", onClick: () => navigate("/rn-work-queue"), variant: "default" },
    { icon: FileText, label: "New Note", onClick: () => navigate("/rn-clinical-liaison") },
    { icon: MessageSquare, label: "Message Client", onClick: () => navigate("/rn-clinical-liaison") },
    { icon: Calendar, label: "Schedule", onClick: () => navigate("/rn-diary") },
    { icon: Users, label: "Team Chat", onClick: () => navigate("/rn-clinical-liaison") },
    { icon: AlertCircle, label: "Report Alert", onClick: () => navigate("/rn-clinical-liaison") },
    { icon: Activity, label: "Log Activity", onClick: () => navigate("/rn-clinical-liaison") },
    { 
      icon: isTracking ? Square : Play, 
      label: isTracking ? "Stop Timer" : "Start Timer", 
      onClick: () => {
        if (!isTracking) {
          setIsTracking(true);
        } else {
          navigate("/rn/time-tracking");
        }
      },
      className: isTracking ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" : ""
    },
    { icon: BookOpen, label: "Resources", onClick: () => setResourceDialogOpen(true) },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={(action as any).variant ?? "outline"}
            className={`flex flex-col items-center gap-2 h-auto py-4 ${action.className || ""}`}
            onClick={action.onClick}
          >
            <action.icon className="h-5 w-5" />
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>

      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Resource Library
            </DialogTitle>
            <DialogDescription>
              Quick access to guides and training materials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {resources.map((resource) => (
              <Button
                key={resource.id}
                variant="ghost"
                className="w-full justify-start"
                asChild
              >
                <a href={resource.url} className="flex items-center gap-3">
                  {getIcon(resource.type)}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{resource.title}</p>
                    <p className="text-xs text-muted-foreground">{resource.category}</p>
                  </div>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
