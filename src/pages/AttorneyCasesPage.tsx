import { useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { fmtDate } from "@/lib/store";
import { FolderOpen, FileText, ArrowLeft } from "lucide-react";

export default function AttorneyCasesPage() {
  const navigate = useNavigate();
  const { cases } = useApp();

  return (
    <AppLayout>
      <div className="p-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/attorney/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">View Cases</h1>
        <p className="text-muted-foreground mb-6">
          Browse and manage your cases.
        </p>

        {!cases || cases.length === 0 ? (
          <Card className="p-8 border-border text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No cases yet</h2>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              You don’t have any released cases. New cases will appear here after intake and release.
            </p>
            <Button asChild variant="default">
              <Link to="/attorney/pending-intakes">
                <FileText className="w-4 h-4 mr-2" />
                Go to Pending Intakes
              </Link>
            </Button>
          </Card>
        ) : (
          <Card className="border-border">
            <div className="divide-y divide-border">
              {cases.map((c) => (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/attorney/cases/${c.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/attorney/cases/${c.id}`);
                    }
                  }}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">
                        {c.client?.rcmsId || c.id}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-muted text-muted-foreground">
                        {c.status?.replace(/_/g, " ") || "—"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {c.intake?.incidentType || "N/A"}
                      {c.intake?.injuries?.length ? ` • ${(c.intake.injuries ?? []).slice(0, 2).join(", ")}` : ""}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground ml-4 shrink-0">
                    {fmtDate(c.updatedAt || c.createdAt || "")}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
