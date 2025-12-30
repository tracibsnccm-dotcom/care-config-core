import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDiaryGoals } from "@/hooks/useDiaryGoals";
import { Plus, Target } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DiaryGoalsDashboardProps {
  rnId: string;
}

export function DiaryGoalsDashboard({ rnId }: DiaryGoalsDashboardProps) {
  const { goals, createGoal, updateGoal } = useDiaryGoals(rnId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "professional_development",
    target_date: "",
    current_progress: 0,
  });

  const handleCreateGoal = async () => {
    await createGoal(newGoal);
    setIsDialogOpen(false);
    setNewGoal({
      title: "",
      description: "",
      category: "professional_development",
      target_date: "",
      current_progress: 0,
    });
  };

  const handleProgressUpdate = async (goalId: string, progress: number) => {
    await updateGoal(goalId, { current_progress: progress });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          Professional Goals
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newGoal.category}
                  onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional_development">Professional Development</SelectItem>
                    <SelectItem value="clinical_skills">Clinical Skills</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                    <SelectItem value="patient_care">Patient Care</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="target_date">Target Date</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateGoal} className="w-full">
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          No goals yet. Create your first goal to start tracking your progress!
        </Card>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <Card key={goal.id} className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{goal.title}</h4>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{goal.current_progress}%</span>
                </div>
                <Progress value={goal.current_progress} />
                <div className="flex items-center gap-2">
                  {[0, 25, 50, 75, 100].map((value) => (
                    <Button
                      key={value}
                      variant="outline"
                      size="sm"
                      onClick={() => handleProgressUpdate(goal.id, value)}
                    >
                      {value}%
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
