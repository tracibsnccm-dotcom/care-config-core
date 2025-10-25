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
          <p className="text-3xl md:text-4xl font-extrabold text-white max-w-2xl mx-auto">
            Comprehensive <span className="text-[#d97706]">Nursing</span> Care Management<br />
            for Legal and Medical Coordination
          </p>
        </div>

        {/* ─────────────── Get Started Section (above cards) ─────────────── */}
        <section id="get-started" className="py-10 text-center">
          <h2 className="mb-2 text-3xl md:text-4xl font-extrabold">
            <span className="text-[#0f2a6a]">Get Started with </span>
            <span className="text-[#d97706]">Reconcile C.A.R.E.</span>
          </h2>
          <p className="text-white text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Pick the button below that matches who you are. Start here to connect with your team. 
            Our secure platform brings together clients, attorneys, and nurse care managers to keep everyone informed.
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
              <p className="mt-2 text-sm md:text-base text-white font-semibold">
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
              <p className="mt-2 text-sm md:text-base text-white font-semibold">
                Log in to update information, submit follow-ups, or check your progress.
              </p>
            </div>

            {/* Attorney Portal */}
            <div>
              <NavLink
                to="/attorney-portal"
                className="block w-full bg-[#128f8b] text-white font-medium py-2 px-5 rounded-lg hover:shadow-md transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#128f8b]"
              >
                Attorney Portal
              </NavLink>
              <p className="mt-2 text-sm md:text-base text-white font-semibold">
                Access client files, review updates, and coordinate care in real time.
              </p>
            </div>
          </div>

          {/* Divider before feature cards */}
          <div className="mt-10 mx-auto w-24 h-px bg-[#128f8b] rounded-full" />
        </section>

        {/* ─────────────── Cards Section Heading (adds context above cards) ─────────────── */}
        <section id="platform-highlights" className="text-center mb-6">
          <h3 className="text-2xl md:text-3xl font-bold text-white">
            Platform Highlights
          </h3>
          <p className="text-white/90 text-base md:text-lg mt-1">
            Designed for privacy, clinical insight, and dependable provider coordination.
          </p>
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
