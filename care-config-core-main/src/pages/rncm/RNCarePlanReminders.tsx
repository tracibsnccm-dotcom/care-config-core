import { AppLayout } from "@/components/AppLayout";
import { CarePlanReminders } from "@/components/RNClinicalLiaison/CarePlanReminders";

export default function RNCarePlanReminders() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <CarePlanReminders />
      </div>
    </AppLayout>
  );
}
