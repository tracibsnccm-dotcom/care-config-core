import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Activity, FileText, Users, Pill, Stethoscope } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TreatmentTimelineProps {
  caseId: string;
}

interface TimelineEvent {
  id: string;
  type: "appointment" | "medication" | "procedure" | "note" | "referral";
  title: string;
  description: string;
  date: string;
  provider?: string;
}

export default function TreatmentTimeline({ caseId }: TreatmentTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTimelineEvents();
  }, [caseId]);

  const fetchTimelineEvents = async () => {
    try {
      setLoading(true);

      // Fetch case data with intake information
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("*, intakes(*)")
        .eq("id", caseId)
        .single();

      if (caseError) throw caseError;

      const timelineEvents: TimelineEvent[] = [];

      // Parse intake_data to get medical information
      if (caseData?.intakes?.[0]?.intake_data) {
        const intakeData = caseData.intakes[0].intake_data as any;
        
        // Add medications if available
        if (intakeData?.medications) {
          const meds = Array.isArray(intakeData.medications) ? intakeData.medications : [intakeData.medications];
          meds.forEach((med: any, idx: number) => {
            if (med?.name) {
              timelineEvents.push({
                id: `med-${idx}`,
                type: "medication",
                title: `Started ${med.name}`,
                description: `Dosage: ${med.dosage || "Not specified"}`,
                date: caseData.created_at,
                provider: "Primary Care",
              });
            }
          });
        }

        // Add treatments if available
        if (intakeData?.treatments) {
          const treatments = Array.isArray(intakeData.treatments) ? intakeData.treatments : [intakeData.treatments];
          treatments.forEach((treatment: any, idx: number) => {
            if (treatment) {
              timelineEvents.push({
                id: `treatment-${idx}`,
                type: "procedure",
                title: treatment.type || treatment.name || "Treatment Session",
                description: treatment.notes || treatment.description || "Ongoing treatment",
                date: caseData.created_at,
                provider: treatment.provider || "Medical Provider",
              });
            }
          });
        }
      }

      // Sort by date descending
      timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setEvents(timelineEvents);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      toast({
        title: "Error",
        description: "Failed to load treatment timeline",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-5 w-5" />;
      case "medication":
        return <Pill className="h-5 w-5" />;
      case "procedure":
        return <Stethoscope className="h-5 w-5" />;
      case "note":
        return <FileText className="h-5 w-5" />;
      case "referral":
        return <Users className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "appointment":
        return "text-blue-500";
      case "medication":
        return "text-green-500";
      case "procedure":
        return "text-purple-500";
      case "note":
        return "text-orange-500";
      case "referral":
        return "text-pink-500";
      default:
        return "text-gray-500";
    }
  };

  if (loading) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Treatment Timeline</h3>

      {events.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No treatment history available</p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {events.map((event, index) => (
              <div key={event.id} className="relative flex gap-4">
                {/* Icon */}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-border ${getTypeColor(event.type)}`}>
                  {getIcon(event.type)}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{event.title}</h4>
                    <Badge variant="outline" className="capitalize">
                      {event.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                    {event.provider && <span>• {event.provider}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
