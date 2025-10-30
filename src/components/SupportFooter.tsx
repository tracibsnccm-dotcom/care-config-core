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
    <Card className="p-6 bg-white border-2 border-rcms-gold shadow-xl">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
          <Phone className="w-5 h-5 text-rcms-gold" />
          Need Support?
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Quick access to your care team</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {contacts.map((contact) => (
          <Button
            key={contact.label}
            variant={contact.variant}
            className="h-auto py-4 flex flex-col gap-2 border-rcms-gold hover:bg-rcms-gold/10"
          >
            <contact.icon className="w-6 h-6" />
            <span className="text-xs font-medium">{contact.action}</span>
          </Button>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t-2 border-rcms-gold text-center">
        <p className="text-sm text-foreground mb-2">
          <strong>Emergency:</strong> <span className="text-rcms-coral font-bold text-lg">911</span>
        </p>
        <p className="text-sm text-foreground">
          <strong>Mental Health Crisis:</strong> <span className="text-rcms-teal font-bold text-lg">988</span>
        </p>
      </div>
    </Card>
  );
}
