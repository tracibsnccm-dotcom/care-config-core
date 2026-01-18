import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { RNCaseRequestsPanel } from "@/components/rn/RNCaseRequestsPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function RNCaseRequestsPage() {
  const { caseId } = useParams<{ caseId: string }>();

  if (!caseId) {
    return (
      <AppLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Case ID is required. Go to a case to view Clinical Requests.</p>
          <Button variant="outline" className="mt-2" asChild>
            <Link to="/rn/dashboard">RN Dashboard</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link to={`/cases/${caseId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Case
          </Link>
        </Button>
        <RNCaseRequestsPanel caseId={caseId} />
      </div>
    </AppLayout>
  );
}
