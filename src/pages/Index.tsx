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

        {/* RCMS C.A.R.E. — Header + Buttons (Non-destructive, no background changes) */}
        <section id="rcms-landing-cta" className="py-10">
          <header className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white">Reconcile <span className="text-[#d97706] font-bold">C.A.R.E.</span></h2>
            <p className="text-white/90 text-base mt-1">
              A secure platform connecting attorneys, clients, and clinical insight.
            </p>
            {/* Subtle divider (1px line only) */}
            <div className="mt-4 mx-auto w-24 h-px bg-white/30 rounded-full" />
          </header>

          <div className="flex flex-col items-center gap-5 mt-8 max-w-md mx-auto text-center">
            <div>
              <NavLink
                to="/client-intake"
                className="block w-full bg-[#00695C] text-white text-lg font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#00695C]"
              >
                Start Your Intake
              </NavLink>
              <p className="mt-2 text-sm text-white/90 font-semibold">
                Begin your case. Complete your intake form and consent securely.
              </p>
            </div>

            <div>
              <NavLink
                to="/client-portal"
                className="block w-full bg-[#0f2a6a] text-white font-medium py-2 px-5 rounded-lg hover:shadow-md transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#0f2a6a]"
              >
                Client Portal
              </NavLink>
              <p className="mt-2 text-sm text-white/90 font-semibold">
                Return to update your information or check your case progress.
              </p>
            </div>

            <div>
              <NavLink
                to="/attorney-portal"
                className="block w-full bg-[#b85c00] text-white font-medium py-2 px-5 rounded-lg hover:shadow-md transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#b85c00]"
              >
                Attorney Portal
              </NavLink>
              <p className="mt-2 text-sm text-white/90 font-semibold">
                Access client files, case updates, and provider routing.
              </p>
            </div>
          </div>
        </section>

        <p className="text-white/60 text-sm text-center mt-8">Demo Mode • No Authentication Required</p>
      </div>
    </div>
  );
};

export default Index;
