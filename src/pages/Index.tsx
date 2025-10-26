import { NavLink } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Activity, Shield, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary">
      <div className="container mx-auto px-4 py-16">
        {/* ─────────────── Above-the-Fold: Ultra-Compact Hero + Get Started ─────────────── */}
        <section id="above-the-fold" className="flex flex-col items-center justify-start min-h-[82vh] pt-3 pb-1">
          {/* App name */}
          <h2
            className="font-extrabold text-primary-foreground mb-2 leading-tight"
            style={{ fontSize: "clamp(26px, 3.7vw, 40px)" }}
          >
            <span className="text-primary-foreground">Reconcile</span>
            <span className="text-accent"> C.A.R.E.</span>
          </h2>

          {/* Hero headline: 3-line centered */}
          <h1 className="font-extrabold text-primary-foreground text-center leading-tight mt-0">
            <span className="block" style={{ fontSize: "clamp(21px, 3.2vw, 36px)" }}>
              Comprehensive Nursing Care Management
            </span>
            <span className="block" style={{ fontSize: "clamp(16px, 2.2vw, 24px)" }}>
              for
            </span>
            <span className="block" style={{ fontSize: "clamp(21px, 3.2vw, 36px)" }}>
              Legal and Medical Coordination
            </span>
          </h1>

          {/* Teal divider between Hero and Get Started */}
          <div className="mt-3 mb-2 mx-auto w-20 h-0.5 bg-primary rounded-full" />

          {/* Get Started heading */}
          <h3
            className="font-extrabold text-center mb-0"
            style={{ fontSize: "clamp(20px, 2.8vw, 32px)" }}
          >
            <span className="text-secondary">Get Started with </span>
            <span className="text-primary-foreground">Reconcile</span>
            <span className="text-accent"> C.A.R.E.</span>
          </h3>

          {/* Prompt + microcopy (more compact) */}
          <p
            className="text-black font-bold text-center mt-3 mb-1"
            style={{ fontSize: "clamp(15px, 2.0vw, 20px)" }}
          >
            What would you like to do?
          </p>
          <p
            className="text-primary-foreground text-center mx-auto max-w-2xl leading-snug hidden lg:block"
            style={{ fontSize: "clamp(13px, 1.7vw, 18px)" }}
          >
            Start here to connect with your team. Our secure platform brings together clients,
            attorneys, and nurse care managers to keep everyone informed.
          </p>

          {/* Buttons (stacked, tighter padding) */}
          <div className="mt-3 flex flex-col items-center gap-2.5 w-full max-w-md">
            {/* Client Intake */}
            <div className="w-full">
              <NavLink
                to="/client-intake"
                className="block w-full bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg shadow hover:shadow-md transition-transform hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-primary"
                style={{ fontSize: "clamp(15px, 2.0vw, 17px)" }}
              >
                Start Your Intake
              </NavLink>
              <p className="hidden lg:block mt-1 text-sm text-primary-foreground/90 font-medium">
                Begin your case and securely complete your intake and consent forms.
              </p>
            </div>

            {/* Client Portal */}
            <div className="w-full">
              <NavLink
                to="/client-portal"
                className="block w-full bg-secondary text-secondary-foreground font-medium py-1.5 px-4 rounded-lg shadow hover:shadow-md transition-transform hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-secondary"
                style={{ fontSize: "clamp(14px, 1.9vw, 16px)" }}
              >
                Client Portal
              </NavLink>
              <p className="hidden lg:block mt-1 text-sm text-primary-foreground/90 font-medium">
                Log in to update information, submit follow-ups, or check your progress.
              </p>
            </div>

            {/* Attorney Portal */}
            <div className="w-full">
              <NavLink
                to="/attorney-portal"
                className="block w-full bg-accent text-accent-foreground font-medium py-1.5 px-4 rounded-lg shadow hover:shadow-md transition-transform hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-accent"
                style={{ fontSize: "clamp(14px, 1.9vw, 16px)" }}
              >
                Attorney Portal
              </NavLink>
              <p className="hidden lg:block mt-1 text-sm text-primary-foreground/90 font-medium">
                Access client files, review updates, and coordinate care in real time.
              </p>
            </div>
          </div>

          {/* Bottom divider to end the above-the-fold area */}
          <div className="mt-4 mx-auto w-20 h-0.5 bg-primary rounded-full" />
        </section>

        {/* ─────────────── Cards Section Heading (context above cards) ─────────────── */}
        <section id="platform-highlights" className="text-center mb-6">
          <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground">
            Platform Highlights
          </h3>
          <p className="text-primary-foreground/90 text-base md:text-lg mt-1">
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

        <p className="text-primary-foreground/60 text-sm text-center mt-8">Demo Mode • No Authentication Required</p>
      </div>
    </div>
  );
};

export default Index;
