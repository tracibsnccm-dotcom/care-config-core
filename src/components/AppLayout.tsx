import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  FileText,
  Settings,
  LogOut,
  Activity,
  UserCircle,
  ClipboardEdit,
  Route as RouteIcon,
  HeartPulse,
  BookOpen,
  FolderKanban,
  Shield,
  BarChart3,
  ClipboardCheck,
} from "lucide-react";
import { Role, ROLES } from "@/config/rcms";
import { useApp } from "@/context/AppContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AppLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: "all" },
  { name: "Attorney", href: "/attorney", icon: UserCircle, roles: [ROLES.ATTORNEY, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: [ROLES.ATTORNEY, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Intake", href: "/intake", icon: ClipboardEdit, roles: [ROLES.ATTORNEY, ROLES.STAFF, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Cases", href: "/cases", icon: FileText, roles: [ROLES.ATTORNEY, ROLES.RN_CCM, ROLES.STAFF, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Management", href: "/management", icon: FolderKanban, roles: [ROLES.ATTORNEY, ROLES.RN_CCM, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Providers", href: "/providers", icon: Stethoscope, roles: [ROLES.ATTORNEY, ROLES.RN_CCM, ROLES.STAFF, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Router", href: "/router", icon: RouteIcon, roles: [ROLES.ATTORNEY, ROLES.RN_CCM, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Client Portal", href: "/client-portal", icon: UserCircle, roles: [ROLES.CLIENT, ROLES.ATTORNEY, ROLES.RN_CCM, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Check-ins", href: "/checkins", icon: HeartPulse, roles: [ROLES.CLIENT, ROLES.ATTORNEY, ROLES.RN_CCM, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Journal", href: "/journal", icon: BookOpen, roles: [ROLES.CLIENT, ROLES.ATTORNEY, ROLES.RN_CCM, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Journal Analytics", href: "/journal-analytics", icon: BarChart3, roles: [ROLES.ATTORNEY, ROLES.RN_CCM, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "RN CM Compliance", href: "/rn-cm/compliance", icon: ClipboardCheck, roles: [ROLES.RN_CCM, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "RN Quality", href: "/rn-cm/quality", icon: Activity, roles: [ROLES.RN_CCM, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Admin", href: "/admin", icon: Shield, roles: [ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Analytics", href: "/analytics", icon: Activity, roles: [ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Settings", href: "/settings", icon: Settings, roles: "all" },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { role, setRole, currentTier, setCurrentTier } = useApp();

  const canAccessRoute = (routeRoles: string | Role[]) => {
    if (routeRoles === "all") return true;
    return (routeRoles as Role[]).includes(role);
  };

  const filteredNav = navigation.filter((item) => canAccessRoute(item.roles));

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-sidebar-foreground">
            Reconcile <span className="text-sidebar-primary">C.A.R.E.</span>
          </h1>
          <p className="text-xs text-sidebar-foreground/60 mt-1">Care Management System</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-3">
          {/* Role Switcher */}
          <div>
            <label className="text-xs font-medium text-sidebar-foreground/60 mb-2 block">
              Current Role
            </label>
            <Select value={role} onValueChange={(value) => setRole(value as Role)}>
              <SelectTrigger className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border">
                <UserCircle className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ROLES).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tier Display */}
          <div className="px-3 py-2 bg-sidebar-accent/50 rounded-lg">
            <p className="text-xs font-medium text-sidebar-foreground/60">Tier</p>
            <p className="text-sm font-semibold text-sidebar-foreground">{currentTier}</p>
          </div>

          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all w-full">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
