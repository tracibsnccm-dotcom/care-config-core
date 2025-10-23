import { Provider } from "@/config/rcms";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, ExternalLink } from "lucide-react";

interface ProviderCardProps {
  provider: Provider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  return (
    <Card className="p-5 hover:shadow-lg transition-all border-border">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg text-foreground">{provider.name}</h3>
          <p className="text-sm text-primary font-medium">{provider.specialty}</p>
        </div>
        <Badge variant={provider.active ? "default" : "secondary"} className="text-xs">
          {provider.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mr-2 text-primary" />
          <span>
            {provider.city}, {provider.state}
            {provider.distanceMiles && (
              <span className="ml-2 text-xs">({provider.distanceMiles} mi)</span>
            )}
          </span>
        </div>
      </div>

      {provider.schedulingUrl && (
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a href={provider.schedulingUrl} target="_blank" rel="noopener noreferrer">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Appointment
            <ExternalLink className="w-3 h-3 ml-2" />
          </a>
        </Button>
      )}
    </Card>
  );
}
