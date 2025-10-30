import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Video, AlertTriangle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ResourceLibrary() {
  const resources = [
    {
      id: "1",
      type: "article",
      title: "Understanding Your Recovery Journey",
      description: "A guide to managing expectations and milestones in personal injury recovery",
      link: "#",
    },
    {
      id: "2",
      type: "video",
      title: "Pain Management Techniques",
      description: "Evidence-based approaches to managing chronic pain",
      link: "#",
    },
    {
      id: "3",
      type: "article",
      title: "The 4Ps of Wellness Explained",
      description: "Deep dive into Physical, Psychological, Psychosocial, and Professional wellness",
      link: "#",
    },
    {
      id: "4",
      type: "article",
      title: "Working With Your Care Team",
      description: "How to communicate effectively with attorneys, RNs, and providers",
      link: "#",
    },
  ];

  return (
    <Card className="p-6 border-primary/20">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5 text-primary" />
        Resource Library
      </h2>

      {/* Crisis Notice */}
      <Alert className="mb-6 border-destructive/50 bg-destructive/5">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <AlertDescription className="text-sm">
          <p className="font-semibold text-foreground mb-1">Crisis Support Available 24/7</p>
          <p className="text-muted-foreground">
            If you're experiencing a mental health crisis, call or text <strong className="text-foreground">988</strong> for the Suicide & Crisis Lifeline.
            For medical emergencies, call <strong className="text-foreground">911</strong>.
          </p>
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {resource.type === "video" ? (
                <Video className="w-5 h-5 text-primary" />
              ) : (
                <BookOpen className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">{resource.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
              <Button
                variant="link"
                size="sm"
                className="px-0 h-auto mt-2 text-primary"
                asChild
              >
                <a href={resource.link} target="_blank" rel="noopener noreferrer">
                  Read More <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
