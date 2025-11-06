import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTestScenarios } from "@/hooks/useTestScenarios";
import { useState } from "react";
import { FileText, Play, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ScenarioManager() {
  const { scenarios, loading, activeScenario, loadScenario, saveScenario, deleteScenario } =
    useTestScenarios();
  const [isCreating, setIsCreating] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState("");
  const [newScenarioDescription, setNewScenarioDescription] = useState("");

  const handleCreateScenario = async () => {
    if (!newScenarioName) return;

    await saveScenario(newScenarioName, newScenarioDescription, {
      clientProfile: "Test client",
      attorneyStatus: "Active",
      timeline: {},
    });

    setNewScenarioName("");
    setNewScenarioDescription("");
    setIsCreating(false);
  };

  if (loading) {
    return <div>Loading scenarios...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Active Scenario Display */}
      {activeScenario && (
        <Card className="p-6 border-primary">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-primary">Active Scenario</h3>
              <p className="text-2xl font-bold mt-2">{activeScenario.name}</p>
            </div>
            <Button variant="outline" onClick={() => loadScenario("")}>
              Clear
            </Button>
          </div>
          {activeScenario.core_pattern && (
            <p className="text-muted-foreground">{activeScenario.core_pattern}</p>
          )}
        </Card>
      )}

      {/* Create New Scenario */}
      <Card className="p-6">
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create New Scenario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Test Scenario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="scenario-name">Scenario Name</Label>
                <Input
                  id="scenario-name"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  placeholder="e.g., Emergency Alert Test"
                />
              </div>
              <div>
                <Label htmlFor="scenario-description">Description</Label>
                <Textarea
                  id="scenario-description"
                  value={newScenarioDescription}
                  onChange={(e) => setNewScenarioDescription(e.target.value)}
                  placeholder="Describe the test scenario..."
                  rows={4}
                />
              </div>
              <Button onClick={handleCreateScenario} className="w-full">
                Create Scenario
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>

      {/* Scenario List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Available Scenarios</h3>
        
        {scenarios.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No scenarios created yet. Create your first scenario to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
              >
              <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{scenario.name}</span>
                  </div>
                  {scenario.core_pattern && (
                    <p className="text-sm text-muted-foreground mt-1">{scenario.core_pattern}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadScenario(scenario.id)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Load
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteScenario(scenario.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
