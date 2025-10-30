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
    <div className="space-y-6">
      {/* Crisis Emergency Section */}
      <div className="bg-rcms-navy p-6 rounded-lg border-2 border-rcms-gold shadow-xl">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
            <AlertCircle className="w-6 h-6 text-rcms-gold" />
            ⚠️ In Crisis?
          </h3>
          <div className="space-y-3 text-white">
            <p className="text-sm leading-relaxed">
              If you are experiencing a medical or mental health emergency, call{" "}
              <a href="tel:911" className="font-bold text-lg text-white hover:text-rcms-gold transition-colors">
                911
              </a>{" "}
              immediately.
            </p>
            <p className="text-sm leading-relaxed">
              If you are in emotional distress or having thoughts of harming yourself, call or text{" "}
              <a href="tel:988" className="font-bold text-lg text-white hover:text-rcms-gold transition-colors">
                988
              </a>{" "}
              to connect with the Suicide & Crisis Lifeline (available 24/7).
            </p>
          </div>
        </div>
      </div>

      {/* Support Team Section */}
      <Card className="p-6 bg-white border-2 border-rcms-gold shadow-xl">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
            <Phone className="w-5 h-5 text-rcms-gold" />
            Need Support?
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Quick access to your care team</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {contacts.slice(0, 3).map((contact) => (
            <Button
              key={contact.label}
              variant={contact.variant}
              className="h-auto py-4 flex flex-col gap-2 border-rcms-gold hover:bg-rcms-gold/10 transition-all duration-300 hover:shadow-md"
            >
              <contact.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{contact.action}</span>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
