import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Stethoscope, Briefcase, Users, AlertCircle } from "lucide-react";

export function SupportFooter() {
  const contacts = [
    {
      label: "RN Care Manager",
      icon: Stethoscope,
      action: "Contact RN",
      variant: "outline" as const,
    },
    {
      label: "Attorney",
      icon: Briefcase,
      action: "Message Attorney",
      variant: "outline" as const,
    },
    {
      label: "Provider",
      icon: Users,
      action: "Provider Portal",
      variant: "outline" as const,
    },
    {
      label: "Emergency",
      icon: AlertCircle,
      action: "911 / 988",
      variant: "destructive" as const,
    },
  ];

  return (
    <Card className="p-6 border-primary/20 bg-muted/5">
      <div className="text-center mb-4">
        <h3 className="font-bold text-foreground flex items-center justify-center gap-2">
          <Phone className="w-4 h-4 text-primary" />
          Need Support?
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Quick access to your care team</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {contacts.map((contact) => (
          <Button
            key={contact.label}
            variant={contact.variant}
            className="h-auto py-3 flex flex-col gap-2"
          >
            <contact.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{contact.action}</span>
          </Button>
        ))}
      </div>

      <div className="mt-4 text-center text-xs text-muted-foreground">
        <p>For life-threatening emergencies, always call <strong className="text-destructive">911</strong></p>
        <p className="mt-1">Mental health crisis support: Call or text <strong className="text-primary">988</strong></p>
      </div>
    </Card>
  );
}
