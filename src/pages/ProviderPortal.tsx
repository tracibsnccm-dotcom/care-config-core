import { useState, useEffect } from "react";
import { useAuth } from "@/auth/supabaseAuth";
import { AppLayout } from "@/components/AppLayout";
import { ProviderAppointmentCalendar } from "@/components/provider/ProviderAppointmentCalendar";
import { ProviderMessages } from "@/components/provider/ProviderMessages";
import { ProviderNotes } from "@/components/provider/ProviderNotes";
import { ProviderCommentBox } from "@/components/provider/ProviderCommentBox";
import { ProviderDocumentViewer } from "@/components/provider/ProviderDocumentViewer";
import { AppointmentManagement } from "@/components/appointments/AppointmentManagement";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { User, Calendar, FileText, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CaseOption {
  id: string;
  client_label: string;
}

export default function ProviderPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [selectedCase, setSelectedCase] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignedCases();
  }, [user]);

  async function fetchAssignedCases() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("cases")
        .select("id, client_label")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCases(data || []);
      if (data && data.length > 0) {
        setSelectedCase(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching cases:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Provider Portal</h1>
            <p className="text-muted-foreground mt-1">
              Manage your assigned cases, appointments, and communications
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/provider-profile-setup")}
            className="bg-primary/10 hover:bg-primary/20 border-primary"
          >
            <Settings className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Case Selector */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <User className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Select Case
              </label>
              <Select value={selectedCase} onValueChange={setSelectedCase}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.client_label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary">{cases.length} Cases</Badge>
          </div>
        </Card>

        {/* Main Grid */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <ProviderAppointmentCalendar />
              <ProviderCommentBox caseId={selectedCase} />
            </div>
            <div className="space-y-6">
              <ProviderNotes />
              <ProviderMessages />
            </div>
          </div>

          {/* Full Width Sections */}
          <AppointmentManagement />
          <ProviderDocumentViewer />
        </div>
      </div>
    </AppLayout>
  );
}
