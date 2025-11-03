import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface Widget {
  id: string;
  name: string;
  category: "clinical" | "legal-tool" | "custom";
  component: React.ComponentType<any>;
  defaultEnabled: boolean;
}

interface WidgetGridProps {
  availableWidgets: Widget[];
  storageKey?: string;
}

export function WidgetGrid({ availableWidgets, storageKey = "attorney-widgets" }: WidgetGridProps) {
  const [enabledWidgets, setEnabledWidgets] = useState<string[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setEnabledWidgets(JSON.parse(saved));
    } else {
      // Default to enabled widgets
      setEnabledWidgets(
        availableWidgets.filter((w) => w.defaultEnabled).map((w) => w.id)
      );
    }
  }, [storageKey, availableWidgets]);

  // Save preferences
  const savePreferences = (widgetIds: string[]) => {
    setEnabledWidgets(widgetIds);
    localStorage.setItem(storageKey, JSON.stringify(widgetIds));
  };

  const toggleWidget = (widgetId: string) => {
    const updated = enabledWidgets.includes(widgetId)
      ? enabledWidgets.filter((id) => id !== widgetId)
      : [...enabledWidgets, widgetId];
    savePreferences(updated);
  };

  const activeWidgets = availableWidgets.filter((w) =>
    enabledWidgets.includes(w.id)
  );

  return (
    <div className="space-y-4">
      {/* Header with customization */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Dashboard</h2>
        <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Customize Widgets
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customize Your Dashboard</DialogTitle>
              <DialogDescription>
                Select which widgets to display on your dashboard. Changes are saved automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Clinical Features */}
              <div>
                <h3 className="font-semibold mb-3 text-primary">Clinical Features</h3>
                <div className="space-y-3">
                  {availableWidgets
                    .filter((w) => w.category === "clinical")
                    .map((widget) => (
                      <div key={widget.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={widget.id}
                          checked={enabledWidgets.includes(widget.id)}
                          onCheckedChange={() => toggleWidget(widget.id)}
                        />
                        <Label
                          htmlFor={widget.id}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {widget.name}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>

              {/* Legal Tool Integrations */}
              <div>
                <h3 className="font-semibold mb-3 text-blue-600">Legal Tool Access</h3>
                <div className="space-y-3">
                  {availableWidgets
                    .filter((w) => w.category === "legal-tool")
                    .map((widget) => (
                      <div key={widget.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={widget.id}
                          checked={enabledWidgets.includes(widget.id)}
                          onCheckedChange={() => toggleWidget(widget.id)}
                        />
                        <Label
                          htmlFor={widget.id}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {widget.name}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>

              {/* Custom Tools */}
              <div>
                <h3 className="font-semibold mb-3">Custom Tools</h3>
                <div className="space-y-3">
                  {availableWidgets
                    .filter((w) => w.category === "custom")
                    .map((widget) => (
                      <div key={widget.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={widget.id}
                          checked={enabledWidgets.includes(widget.id)}
                          onCheckedChange={() => toggleWidget(widget.id)}
                        />
                        <Label
                          htmlFor={widget.id}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {widget.name}
                        </Label>
                      </div>
                    ))}
                </div>
                <Button variant="outline" size="sm" className="mt-3">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Tool
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeWidgets.map((widget) => {
          const WidgetComponent = widget.component;
          return (
            <div key={widget.id} className="relative group">
              <WidgetComponent />
            </div>
          );
        })}

        {/* Empty state */}
        {activeWidgets.length === 0 && (
          <Card className="col-span-full p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No widgets enabled. Click "Customize Widgets" to add tools to your dashboard.
            </p>
            <Button onClick={() => setIsCustomizing(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Widgets
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
