import { Card } from "@/components/ui/card";
import { RCMS } from "../constants/brand";

export default function RNSupervisor() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 md:p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                RN Supervisor Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome to the RN Supervisor Dashboard. This portal is currently under development.
              </p>
            </div>

            <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-foreground">
                <strong>Note:</strong> This is a placeholder page for RN Supervisors. 
                Full supervisor functionality will be available soon.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
