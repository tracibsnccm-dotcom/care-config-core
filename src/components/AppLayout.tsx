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
} from "lucide-react";
import { Role, ROLES } from "@/config/rcms";

interface AppLayoutProps {
  children: ReactNode;
  currentRole?: Role;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: "all" },
  { name: "Cases", href: "/cases", icon: FileText, roles: [ROLES.ATTORNEY, ROLES.RN_CCM, ROLES.STAFF, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Providers", href: "/providers", icon: Stethoscope, roles: [ROLES.ATTORNEY, ROLES.RN_CCM, ROLES.STAFF, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Clients", href: "/clients", icon: Users, roles: [ROLES.ATTORNEY, ROLES.RN_CCM, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Analytics", href: "/analytics", icon: Activity, roles: [ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Settings", href: "/settings", icon: Settings, roles: "all" },
];

export function AppLayout({ children, currentRole = ROLES.ATTORNEY }: AppLayoutProps) {
  const location = useLocation();

  const canAccessRoute = (routeRoles: string | Role[]) => {
    if (routeRoles === "all") return true;
    return (routeRoles as Role[]).includes(currentRole);
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
          <p className="text-xs text-sidebar-foreground/60 mt-1">Case Management System</p>
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

        <div className="p-4 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-medium text-sidebar-foreground/60">Current Role</p>
            <p className="text-sm font-semibold text-sidebar-foreground mt-0.5">{currentRole}</p>
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
