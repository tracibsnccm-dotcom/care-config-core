import { AppLayout } from "@/components/AppLayout";
import { EducationMaterialLibrary } from "@/components/RNClinicalLiaison/EducationMaterialLibrary";

export default function RNEducationLibrary() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <EducationMaterialLibrary />
      </div>
    </AppLayout>
  );
}
