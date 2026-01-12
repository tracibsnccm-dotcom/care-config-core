import { AttorneyCommunicationCenter } from "@/components/attorney/AttorneyCommunicationCenter";
import { AppLayout } from "@/components/AppLayout";

export default function AttorneyCommunications() {
  return (
    <AppLayout>
      <div className="p-6">
        <AttorneyCommunicationCenter />
      </div>
    </AppLayout>
  );
}
