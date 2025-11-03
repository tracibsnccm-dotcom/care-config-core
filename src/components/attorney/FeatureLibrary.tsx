import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Zap } from "lucide-react";

export function FeatureLibrary() {
  const [tier, setTier] = useState<string>("trial");
  const [trialEnds, setTrialEnds] = useState<Date | null>(null);

  const features = [
    { key: "sol-tracker", name: "Statutes of Limitations Tracker", tier: "basic", category: "Risk Management" },
    { key: "medical-liens", name: "Medical Lien Management", tier: "clinical", category: "PI-Specific" },
    { key: "bill-review", name: "Medical Bill Review", tier: "clinical", category: "PI-Specific" },
    { key: "settlement-calc", name: "Settlement Calculator", tier: "clinical", category: "PI-Specific" },
    { key: "trust-accounting", name: "Trust Accounting", tier: "comprehensive", category: "Advanced" },
    { key: "rn-metrics", name: "RN Value Metrics", tier: "clinical", category: "Clinical" },
    { key: "time-tracking", name: "Time & Billing", tier: "basic", category: "Core" },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Your Subscription</h3>
            <Badge className="mt-2 bg-green-600">
              <Zap className="mr-1 h-3 w-3" />
              Trial - All Features Unlocked
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Trial ends in 23 days • Explore all features
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        {features.map((feature) => (
          <Card key={feature.key} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{feature.name}</h4>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary">{feature.category}</Badge>
                  <Badge variant="outline">
                    {feature.tier.charAt(0).toUpperCase() + feature.tier.slice(1)}
                  </Badge>
                </div>
              </div>
              {tier === "trial" ? (
                <Switch checked disabled />
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Requires {feature.tier} tier
                  </span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
