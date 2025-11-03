import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, ThumbsUp, MessageSquare, TrendingUp } from "lucide-react";

interface ClientSatisfactionFeedbackProps {
  caseId: string;
}

export default function ClientSatisfactionFeedback({ caseId }: ClientSatisfactionFeedbackProps) {
  const overallRating = 4.7;
  const totalReviews = 24;

  const ratings = {
    communication: 4.8,
    responsiveness: 4.9,
    knowledge: 4.7,
    empathy: 4.6,
    overall: 4.7,
  };

  const recentFeedback = [
    {
      id: "1",
      rating: 5,
      comment: "M. Garcia has been incredibly helpful throughout my recovery. She always responds quickly and explains everything clearly.",
      date: "2025-01-28",
      category: "Communication",
    },
    {
      id: "2",
      rating: 5,
      comment: "Very knowledgeable and compassionate. Made the whole process much less stressful.",
      date: "2025-01-25",
      category: "Care Quality",
    },
    {
      id: "3",
      rating: 4,
      comment: "Great follow-up and coordination with my healthcare providers. Could improve appointment scheduling process.",
      date: "2025-01-20",
      category: "Coordination",
    },
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : i < rating
            ? "fill-yellow-200 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-4xl font-bold mb-1">{overallRating}</p>
            <p className="text-sm text-muted-foreground">Overall Rating</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              {renderStars(overallRating)}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <p className="text-4xl font-bold mb-1">{totalReviews}</p>
            <p className="text-sm text-muted-foreground">Client Reviews</p>
            <Badge variant="default" className="mt-2">
              100% Response Rate
            </Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <ThumbsUp className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-4xl font-bold mb-1">96%</p>
            <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>+5% from last month</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Breakdown</h3>
        <div className="space-y-4">
          {Object.entries(ratings).map(([category, rating]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{category.replace(/([A-Z])/g, " $1").trim()}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{rating}</span>
                  <div className="flex items-center gap-0.5">{renderStars(rating)}</div>
                </div>
              </div>
              <Progress value={(rating / 5) * 100} className="h-2" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Client Feedback</h3>
        <div className="space-y-4">
          {recentFeedback.map((feedback) => (
            <div key={feedback.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">{renderStars(feedback.rating)}</div>
                  <Badge variant="outline">{feedback.category}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(feedback.date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{feedback.comment}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900">
        <div className="flex gap-3">
          <Star className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5 fill-current" />
          <div>
            <p className="text-sm font-medium text-green-900 dark:text-green-100">Excellent Performance</p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Client satisfaction scores consistently exceed industry benchmarks, demonstrating exceptional care coordination and communication.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
