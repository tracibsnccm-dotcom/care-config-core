import { NavLink } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Activity, Shield, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary">
      <div className="container mx-auto px-4 py-16">
        {/* ===================== HERO + GET STARTED ===================== */}
        <section className="text-center py-16 px-6 bg-gradient-to-b from-secondary via-primary to-secondary">
          {/* Hero */}
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2 tracking-tight">
            Reconcile <span className="text-accent">C.A.R.E.</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-primary-foreground leading-snug mb-6">
            Comprehensive Nursing Care Management<br />
            <span className="text-lg font-normal">for</span><br />
            Legal and Medical Coordination
          </h2>

          {/* Divider */}
          <div className="border-t border-border w-2/3 mx-auto my-8"></div>

          {/* Get Started (with border & correct colors) */}
          <div className="border-2 border-border rounded-2xl shadow-lg bg-card/10 backdrop-blur-sm p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              <span className="text-secondary">Get Started with</span> <span className="text-primary-foreground">Reconcile</span> <span className="text-accent">C.A.R.E.</span>
            </h3>

            {/* Instruction line */}
            <p className="text-foreground font-bold text-lg mb-3">
              What would you like to do?
            </p>

            <p className="text-primary-foreground text-base md:text-lg mb-8">
              Start here to connect with your team. Our secure platform brings together
              clients, attorneys, and nurse care managers to keep everyone informed.
            </p>

            {/* Buttons (colors fixed) */}
            <div className="flex flex-col md:flex-row flex-wrap justify-center gap-4">
              {/* Client Intake (primary) */}
              <a
                href="/intake"
                className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg px-8 py-4 rounded-xl shadow-md transition-all duration-200"
              >
                Client Intake
              </a>

              {/* Client Portal (blue) */}
              <a
                href="/client-portal"
                className="inline-block bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold text-base px-6 py-3 rounded-lg shadow-md transition-all duration-200"
              >
                Client Portal
              </a>

              {/* Attorney Portal (orange) */}
              <a
                href="/attorney-portal"
                className="inline-block bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base px-6 py-3 rounded-lg shadow-md transition-all duration-200"
              >
                Attorney Portal
              </a>

              {/* Provider Portal (eggplant) */}
              <a
                href="/provider-portal"
                className="inline-block bg-secondary-light hover:bg-secondary-light/90 text-secondary-foreground font-semibold text-base px-6 py-3 rounded-lg shadow-md transition-all duration-200"
              >
                Provider Portal
              </a>
            </div>
          </div>
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

      {/* ===================== FOOTER ===================== */}
      <footer className="mt-16 bg-gradient-to-b from-secondary via-secondary/90 to-secondary text-primary-foreground/90" aria-label="Site footer">
        {/* Top strip: brand + tagline */}
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight">
              Reconcile <span className="text-accent">C.A.R.E.</span>
            </h3>
            <p className="text-sm text-primary-foreground/80 mt-1">
              Comprehensive Nursing Care Management for Legal and Medical Coordination
            </p>
          </div>

          {/* Quick actions (ensure colors match buttons above) */}
          <div className="flex flex-wrap gap-3">
            <a
              href="/attorney-portal"
              className="inline-block bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-sm px-4 py-2 rounded-lg shadow-md transition"
            >
              Attorney Portal
            </a>
            <a
              href="/client-portal"
              className="inline-block bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold text-sm px-4 py-2 rounded-lg shadow-md transition"
            >
              Client Portal
            </a>
            <a
              href="/provider-portal"
              className="inline-block bg-secondary-light hover:bg-secondary-light/90 text-secondary-foreground font-semibold text-sm px-4 py-2 rounded-lg shadow-md transition"
            >
              Provider Portal
            </a>
            <a
              href="/intake"
              className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm px-4 py-2 rounded-lg shadow-md transition"
            >
              Client Intake
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/20" />

        {/* Link columns */}
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <h4 className="text-primary-foreground font-semibold mb-3">Reconcile Care Management Services</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/about" className="hover:underline">About RCMS</a></li>
              <li><a href="/contact" className="hover:underline">Contact</a></li>
              <li><a href="/pricing" className="hover:underline">Pricing &amp; Tiers</a></li>
              <li><a href="/faq" className="hover:underline">FAQ</a></li>
            </ul>
          </div>

          {/* Compliance */}
          <div>
            <h4 className="text-primary-foreground font-semibold mb-3">Compliance</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/hipaa-notice" className="hover:underline">HIPAA Notice of Privacy Practices</a></li>
              <li><a href="/privacy" className="hover:underline">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:underline">Terms of Service</a></li>
              <li><a href="/baa" className="hover:underline">Business Associate Agreement</a></li>
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-primary-foreground font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/security" className="hover:underline">Security &amp; Data Retention</a></li>
              <li><a href="/accessibility" className="hover:underline">Accessibility (WCAG 2.1 AA)</a></li>
              <li><a href="/roadmap" className="hover:underline">Roadmap</a></li>
              <li><a href="/status" className="hover:underline">System Status</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-primary-foreground font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:support@reconcilecms.com" className="hover:underline">support@reconcilecms.com</a></li>
              <li><a href="tel:+1-555-555-1212" className="hover:underline">+1 (555) 555-1212</a></li>
              <li className="text-primary-foreground/75">Mon–Fri, 9am–5pm CT</li>
            </ul>
            <div className="mt-3 flex items-center gap-3">
              <a href="#" aria-label="LinkedIn" className="text-primary-foreground/80 hover:text-primary-foreground">LinkedIn</a>
            </div>
          </div>
        </div>

        {/* Mini disclaimer */}
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="rounded-xl bg-card/10 border border-border/15 p-4">
            <p className="text-xs text-primary-foreground/80">
              <strong>Notice:</strong> Reconcile C.A.R.E. is designed with privacy by default. Do not include PHI in URLs, email, or SMS.
              Minimum necessary data is collected. Access to sensitive cases is restricted by role and consent.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/15">
          <div className="max-w-7xl mx-auto px-6 py-4 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-primary-foreground/70">
            <p>© {new Date().getFullYear()} Reconcile Care Management Services. All rights reserved.</p>
            <p className="text-primary-foreground/70">Built for attorneys, clients, and nurse care managers — secure, auditable, and HIPAA-aware.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
