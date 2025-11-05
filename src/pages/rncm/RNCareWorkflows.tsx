import { AppLayout } from "@/components/AppLayout";
import { CareWorkflowBuilder } from "@/components/RNClinicalLiaison/CareWorkflowBuilder";

export default function RNCareWorkflows() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <CareWorkflowBuilder />
      </div>
    </AppLayout>
  );
}
