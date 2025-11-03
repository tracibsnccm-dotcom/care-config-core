import { Link } from "react-router-dom";
import { 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle, 
  ClipboardList,
  HeartPulse,
  MessageSquare,
  Settings,
  Users,
  Activity,
  FolderKanban
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContext";
import { ROLES } from "@/config/rcms";

export default function RNPortalLanding() {
  const { role } = useApp();
  const isSupervisor = role === ROLES.SUPER_USER || role === ROLES.SUPER_ADMIN;
  
  return (
    <AppLayout>
      <div className="py-10 px-6 bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 min-h-screen">
        <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-3">
            <span>RN Case Management</span>
            <span className="opacity-75">Portal Home</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f2a6a]">
            Welcome to Your RN Portal
          </h1>
          <p className="text-[#0f2a6a]/80 mt-2 max-w-2xl">
            Access your dashboard, manage cases, track compliance, and communicate with clients and providers.
          </p>
        </header>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground mt-1">Assigned to you</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground mt-1">Due within 24h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Notes Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">3</div>
              <p className="text-xs text-muted-foreground mt-1">Approaching deadline</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quality Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">94%</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to={isSupervisor ? "/rn-supervisor-dashboard" : "/rn-dashboard"}
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#0f2a6a]/10 text-[#0f2a6a] group-hover:bg-[#0f2a6a] group-hover:text-white transition">
                {isSupervisor ? <Users className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">
                  {isSupervisor ? "Team Dashboard" : "My Dashboard"}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {isSupervisor 
                    ? "Monitor team performance, manage assignments, and review quality metrics."
                    : "View your performance metrics, assigned cases, and quality targets."}
                </p>
                <Badge className="mt-3" variant="secondary">
                  {isSupervisor ? "Supervisor View" : "My Metrics"}
                </Badge>
              </div>
            </div>
          </Link>

          <Link
            to="/cases"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#128f8b]/10 text-[#128f8b] group-hover:bg-[#128f8b] group-hover:text-white transition">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">My Cases</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Access assigned cases, update notes, and track care plans.
                </p>
                <Badge className="mt-3" variant="secondary">24 Active</Badge>
              </div>
            </div>
          </Link>

          <Link
            to="/rn-clinical-liaison"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#0f2a6a]/10 text-[#0f2a6a] group-hover:bg-[#0f2a6a] group-hover:text-white transition">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Clinical Liaison</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Coordinate care, manage appointments, and track medical records.
                </p>
                <Badge className="mt-3" variant="secondary">Care Coordination</Badge>
              </div>
            </div>
          </Link>

          <Link
            to="/client-portal"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#128f8b]/10 text-[#128f8b] group-hover:bg-[#128f8b] group-hover:text-white transition">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Client Communication</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Message clients, review check-ins, and monitor wellness data.
                </p>
                <Badge className="mt-3" variant="secondary">HIPAA Secure</Badge>
              </div>
            </div>
          </Link>

          <Link
            to="/providers"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#0f2a6a]/10 text-[#0f2a6a] group-hover:bg-[#0f2a6a] group-hover:text-white transition">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Provider Network</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Contact providers, request updates, and coordinate referrals.
                </p>
                <Badge className="mt-3" variant="secondary">Network Access</Badge>
              </div>
            </div>
          </Link>

          <Link
            to="/documents"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#128f8b]/10 text-[#128f8b] group-hover:bg-[#128f8b] group-hover:text-white transition">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Documents & Files</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Access medical records, reports, and case documentation.
                </p>
                <Badge className="mt-3" variant="secondary">Secure Storage</Badge>
              </div>
            </div>
          </Link>
        </div>

        {/* Compliance & Quality Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#0f2a6a] mb-4">Compliance & Quality</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/rn-cm/compliance"
              className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-700 group-hover:bg-green-600 group-hover:text-white transition">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Compliance Tasks</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Required fields, care plan timeliness, documentation standards.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/rn-cm/quality"
              className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Quality Metrics</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track performance, compare with team averages, view trends.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/concerns-complaints"
              className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition group border-orange-200"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-100 text-orange-700 group-hover:bg-orange-600 group-hover:text-white transition">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Concerns & Complaints</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Monitor and resolve client concerns and complaints.
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Settings & Profile */}
        <div>
          <h2 className="text-xl font-bold text-[#0f2a6a] mb-4">Settings & Profile</h2>
          <Link
            to="/rn/settings"
            className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition group inline-flex items-start gap-3 w-full md:w-auto"
          >
            <div className="p-2 rounded-lg bg-gray-100 text-gray-700 group-hover:bg-gray-600 group-hover:text-white transition">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">RN Settings</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Update profile, availability, communication preferences, and security settings.
              </p>
            </div>
          </Link>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}
