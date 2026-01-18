import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, MessageSquare, Calendar, Users, AlertCircle, Activity, BookOpen, Video, ExternalLink, Clock, Play, Square, ClipboardList, Bell, Search, GitBranch, UserCheck, HeartPulse, FolderKanban } from "lucide-react";
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

  // Expose openResourcesDialog function globally so bottom card can trigger it
  useEffect(() => {
    (window as any).openRNResourcesDialog = () => setResourceDialogOpen(true);
    return () => {
      delete (window as any).openRNResourcesDialog;
    };
  }, []);

  // Work Queue: navigate to dedicated /rn/queue page
  const handleWorkQueueClick = () => navigate('/rn/queue');

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

  // First row: Core clinical work
  const firstRowActions = [
    { icon: ClipboardList, label: "Work Queue", onClick: handleWorkQueueClick, variant: "default" },
    { icon: FileText, label: "New Note", onClick: () => navigate("/rn-clinical-liaison") },
    { icon: MessageSquare, label: "Message Client", onClick: () => navigate("/rn-clinical-liaison") },
    { icon: Calendar, label: "Schedule", onClick: () => navigate("/rn-diary") },
    { icon: Bell, label: "Care Plan Reminders", onClick: () => navigate("/rn/care-plan-reminders") },
    { icon: Search, label: "Clinical Guidelines", onClick: () => navigate("/rn/clinical-guidelines") },
    { icon: Users, label: "Provider Network", onClick: () => navigate("/providers") },
    { icon: FileText, label: "Attorney Portal", onClick: () => navigate("/attorney-dashboard") },
  ];

  // Second row: Support/admin tools
  const secondRowActions = [
    { icon: HeartPulse, label: "Contact RN Sup/Mgr", onClick: () => navigate("/rn-clinical-liaison") },
    { icon: FolderKanban, label: "Documents & Files", onClick: () => navigate("/documents") },
    { icon: ClipboardList, label: "My To Do List", onClick: () => navigate("/rn/dashboard") },
    { icon: GitBranch, label: "Care Workflows", onClick: () => navigate("/rn/care-workflows") },
    { icon: UserCheck, label: "Case Hand-Offs", onClick: () => navigate("/rn/case-handoffs") },
    { icon: AlertCircle, label: "Report Alert", onClick: () => navigate("/rn-clinical-liaison") },
    { icon: Users, label: "Team Chat", onClick: () => navigate("/rn-clinical-liaison") },
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
  ];

  return (
    <>
      <div className="space-y-2">
        {/* First Row: Core clinical work */}
        <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
          {firstRowActions.map((action) => (
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
        {/* Second Row: Support/admin tools */}
        <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
          {secondRowActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className={`flex flex-col items-center gap-2 h-auto py-4 ${action.className || ""}`}
              onClick={action.onClick}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
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
