import { AppLayout } from "@/components/AppLayout";
import { CaseHandoffSystem } from "@/components/RNClinicalLiaison/CaseHandoffSystem";

export default function RNCaseHandoffs() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <CaseHandoffSystem />
      </div>
    </AppLayout>
  );
}
