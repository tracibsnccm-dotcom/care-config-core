import { NavLink } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Activity, Shield, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Reconcile <span className="text-[#d97706] font-bold">C.A.R.E.</span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Comprehensive care management for legal and medical coordination
          </p>
        </div>

        {/* ─────────────── Get Started Section (above cards) ─────────────── */}
        <section id="get-started" className="py-10 text-center">
          <h2 className="text-2xl font-bold text-[#0f2a6a] mb-2">
            Get Started with <span className="text-[#d97706]">Reconcile C.A.R.E.</span>
          </h2>
          <p className="text-gray-700 text-base mb-8">
            Choose your path below to begin — secure, compliant, and built to simplify collaboration between clients, attorneys, and care managers.
          </p>

          <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
            {/* Client Intake */}
            <div>
              <NavLink
                to="/client-intake"
                className="block w-full bg-[#00695C] text-white text-lg font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#00695C]"
              >
                Start Your Intake
              </NavLink>
              <p className="mt-2 text-sm text-gray-900 font-semibold">
                Begin your case and securely complete your intake and consent forms.
              </p>
            </div>

            {/* Client Portal */}
            <div>
              <NavLink
                to="/client-portal"
                className="block w-full bg-[#0f2a6a] text-white font-medium py-2 px-5 rounded-lg hover:shadow-md transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#0f2a6a]"
              >
                Client Portal
              </NavLink>
              <p className="mt-2 text-sm text-gray-900 font-semibold">
                Log in to update information, submit follow-ups, or check your progress.
              </p>
            </div>

            {/* Attorney Portal */}
            <div>
              <NavLink
                to="/attorney-portal"
                className="block w-full bg-[#b85c00] text-white font-medium py-2 px-5 rounded-lg hover:shadow-md transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#b85c00]"
              >
                Attorney Portal
              </NavLink>
              <p className="mt-2 text-sm text-gray-900 font-semibold">
                Access client files, review updates, and coordinate care in real time.
              </p>
            </div>
          </div>

          {/* Divider before feature cards */}
          <div className="mt-10 mx-auto w-24 h-px bg-gray-300 rounded-full" />
        </section>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="p-6 bg-white/95 backdrop-blur border-0 shadow-card">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Secure & Compliant</h3>
            <p className="text-muted-foreground">
              Built with privacy-first design and role-based access controls
            </p>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur border-0 shadow-card">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">The 4Ps of Wellness Care Management Tool</h3>
            <p className="text-muted-foreground">
              Tracks Physical, Psychological, Psychosocial and Professional dynamics that impacts overall health and wellness.
            </p>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur border-0 shadow-card">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Provider Network</h3>
            <p className="text-muted-foreground">
              Connect clients with verified healthcare providers seamlessly
            </p>
          </Card>
        </div>

        <p className="text-white/60 text-sm text-center mt-8">Demo Mode • No Authentication Required</p>
      </div>
    </div>
  );
};

export default Index;
