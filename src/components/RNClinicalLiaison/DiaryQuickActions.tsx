import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, AlertCircle, UserCheck, Clock, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function DiaryQuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [actionType, setActionType] = useState<"call" | "emergency" | "update" | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const quickActionTemplates = {
    call: {
      icon: Phone,
      label: "Quick Call Log",
      titleTemplate: "Phone Call - ",
      category: "Phone Call",
      priority: "medium" as const,
    },
    emergency: {
      icon: AlertCircle,
      label: "Emergency Note",
      titleTemplate: "Emergency: ",
      category: "Emergency",
      priority: "urgent" as const,
    },
    update: {
      icon: UserCheck,
      label: "Client Update",
      titleTemplate: "Client Update - ",
      category: "Follow-up",
      priority: "medium" as const,
    },
  };

  const handleQuickAction = (type: "call" | "emergency" | "update") => {
    setActionType(type);
    setTitle(quickActionTemplates[type].titleTemplate);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!actionType) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const template = quickActionTemplates[actionType];
      
      const { error } = await supabase
        .from("rn_diary_entries")
        .insert({
          case_id: null,
          rn_id: user.id,
          entry_type: "general",
          title,
          description,
          scheduled_date: new Date().toISOString().split("T")[0],
          scheduled_time: new Date().toTimeString().split(" ")[0].substring(0, 5),
          completion_status: "completed",
          priority: template.priority,
          created_by: user.id,
        });

      if (error) throw error;

      toast.success("Entry added successfully");
      setIsOpen(false);
      setTitle("");
      setDescription("");
      setActionType(null);
    } catch (error) {
      console.error("Error adding entry:", error);
      toast.error("Failed to add entry");
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        {Object.entries(quickActionTemplates).map(([key, template]) => {
          const Icon = template.icon;
          return (
            <Button
              key={key}
              onClick={() => handleQuickAction(key as any)}
              className="h-14 w-14 rounded-full shadow-lg"
              variant={key === "emergency" ? "destructive" : "default"}
            >
              <Icon className="h-6 w-6" />
            </Button>
          );
        })}
        <Button
          onClick={() => {
            setTitle("");
            setDescription("");
            setIsOpen(true);
            setActionType(null);
          }}
          className="h-14 w-14 rounded-full shadow-lg"
          variant="secondary"
        >
          <Clock className="h-6 w-6" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType ? quickActionTemplates[actionType].label : "Quick Entry"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entry title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details..."
                rows={4}
              />
            </div>
            <Button onClick={handleSave} disabled={!title} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Save Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}