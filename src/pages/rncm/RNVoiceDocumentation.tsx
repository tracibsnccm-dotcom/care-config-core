import { AppLayout } from "@/components/AppLayout";
import { VoiceToTextDocumentation } from "@/components/RNClinicalLiaison/VoiceToTextDocumentation";

export default function RNVoiceDocumentation() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <VoiceToTextDocumentation />
      </div>
    </AppLayout>
  );
}
