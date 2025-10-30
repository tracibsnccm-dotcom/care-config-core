import { Card } from "@/components/ui/card";
import { Sparkles, TrendingUp } from "lucide-react";
import { useClientCheckins } from "@/hooks/useClientCheckins";

interface MotivationWidgetProps {
  caseId: string;
}

export function MotivationWidget({ caseId }: MotivationWidgetProps) {
  const { checkins } = useClientCheckins(caseId);

  // Calculate this month's check-ins
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyCheckins = checkins.filter(
    (c) => new Date(c.created_at) >= firstDayOfMonth
  ).length;

  const messages = [
    "Every check-in helps your care team support you better!",
    "You're taking an active role in your recovery — that's powerful!",
    "Consistency is key to healing. Keep going!",
    "Your progress matters. Thank you for staying engaged!",
    "Small steps add up to big changes. Well done!",
  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  return (
    <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            You're Doing Great!
          </h3>
          <p className="text-2xl font-bold text-primary mb-1">{monthlyCheckins} check-ins</p>
          <p className="text-sm text-muted-foreground mb-3">completed this month</p>
          <p className="text-sm text-foreground italic">"{randomMessage}"</p>
        </div>
      </div>
    </Card>
  );
}
