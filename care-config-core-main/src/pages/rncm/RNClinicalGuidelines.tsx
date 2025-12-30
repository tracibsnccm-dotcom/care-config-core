import { AppLayout } from "@/components/AppLayout";
import { ClinicalGuidelinesLookup } from "@/components/RNClinicalLiaison/ClinicalGuidelinesLookup";

export default function RNClinicalGuidelines() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <ClinicalGuidelinesLookup />
      </div>
    </AppLayout>
  );
}
