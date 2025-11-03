import { RNSupervisorPerformanceView } from "@/components/RNClinicalLiaison/RNSupervisorPerformanceView";
import { AppLayout } from "@/components/AppLayout";

export default function RNSupervisorPerformance() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">RN Performance & Reviews</h1>
          <p className="text-muted-foreground mt-2">
            Monitor team performance metrics and conduct quarterly performance reviews
          </p>
        </div>
        
        <RNSupervisorPerformanceView />
      </div>
    </AppLayout>
  );
}