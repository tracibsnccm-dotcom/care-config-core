import { NavLink } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Activity, Shield, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary">
      <div className="container mx-auto px-4 py-16">
        <style>
          {`
            /* SCOPED OVERRIDES */
            #rcms-getstarted h3 .rcms-gs-prefix { color:#0f2a6a !important; }

            #rcms-getstarted a.rcms-btn {
              display:inline-flex !important;
              align-items:center !important;
              justify-content:center !important;
              color:#ffffff !important;
              border-radius:0.8rem !important;
              box-shadow:0 6px 18px rgba(0,0,0,0.20) !important;
              text-decoration:none !important;
              transition:transform .15s ease, filter .2s ease !important;
              line-height:1.15 !important;
              white-space:nowrap !important;
            }
            #rcms-getstarted a.rcms-btn:hover { transform: translateY(-1px) !important; filter: brightness(1.06) !important; }

            /* CTA: Client Intake — prominent but fits on one line */
            #rcms-getstarted a.cta-intake {
              background:#00695c !important;
              font-weight:800 !important;
              font-size:1.25rem !important;
              padding:1rem 2.2rem !important;
            }
            @media (min-width: 768px){
              #rcms-getstarted a.cta-intake {
                font-size:1.35rem !important;
                padding:1.05rem 2.4rem !important;
              }
            }
            #rcms-getstarted a.cta-intake:hover { background:#00897b !important; }

            /* Slim Long style for the other three (proportional sizing) */
            #rcms-getstarted a.btn-slim {
              font-weight:700 !important;
              font-size:0.98rem !important;
              padding:0.55rem 1.25rem !important;
            }
            @media (min-width: 768px){
              #rcms-getstarted a.btn-slim {
                font-size:1rem !important;
                padding:0.6rem 1.35rem !important;
              }
            }

            /* Individual colors */
            #rcms-getstarted a.btn-client-portal { background:#0f2a6a !important; }
            #rcms-getstarted a.btn-client-portal:hover { background:#1a3f8b !important; }

            #rcms-getstarted a.btn-attorney-portal { background:#ff8c42 !important; }
            #rcms-getstarted a.btn-attorney-portal:hover { background:#ff9f5c !important; }

            #rcms-getstarted a.btn-provider-portal { background:#4b2e83 !important; }
            #rcms-getstarted a.btn-provider-portal:hover { background:#5a36a5 !important; }

            /* Footer base rcms buttons */
            #rcms-footer a.rcms-btn {
              display:inline-block !important;
              color:#ffffff !important;
              border-radius:0.75rem !important;
              box-shadow:0 6px 18px rgba(0,0,0,0.25) !important;
              text-decoration:none !important;
              transition:transform .15s ease, filter .2s ease !important;
            }
            #rcms-footer a.rcms-btn:hover { transform: translateY(-1px) !important; filter: brightness(1.06) !important; }

            /* Intake in footer */
            #rcms-footer a.cta-intake {
              background:#00695c !important;
              padding:0.75rem 1.25rem !important;
              font-size:1rem !important;
              font-weight:600 !important;
            }
            #rcms-footer a.cta-intake:hover { background:#00897b !important; }

            /* Client Portal = Navy */
            #rcms-footer a.btn-client-portal {
              background:#0f2a6a !important;
              padding:0.75rem 1.25rem !important;
              font-size:1rem !important;
              font-weight:600 !important;
            }
            #rcms-footer a.btn-client-portal:hover { background:#1a3f8b !important; }

            /* Attorney Portal = Orange */
            #rcms-footer a.btn-attorney-portal {
              background:#ff8c42 !important;
              padding:0.75rem 1.25rem !important;
              font-size:1rem !important;
              font-weight:600 !important;
            }
            #rcms-footer a.btn-attorney-portal:hover { background:#ff9f5c !important; }

            /* Provider Portal = Eggplant */
            #rcms-footer a.btn-provider-portal {
              background:#4b2e83 !important;
              padding:0.75rem 1.25rem !important;
              font-size:1rem !important;
              font-weight:600 !important;
            }
            #rcms-footer a.btn-provider-portal:hover { background:#5a36a5 !important; }

            /* Get Started card border */
            #rcms-getstarted .rcms-card {
              border:2px solid rgba(255,255,255,0.2) !important;
              border-radius:1rem !important;
              background:rgba(255,255,255,0.05) !important;
              backdrop-filter: blur(4px) !important;
            }
          `}
        </style>

        {/* ===================== HERO + GET STARTED ===================== */}
        <section id="rcms-getstarted" className="text-center py-16 px-6 bg-gradient-to-b from-[#0f2a6a] via-[#128f8b] to-[#0f2a6a]">
          {/* Hero */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
            Reconcile <span className="text-[#ff8c42]">C.A.R.E.</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-white leading-snug mb-6">
            Comprehensive Nursing Care Management<br />
            <span className="text-lg font-normal">for</span><br />
            Legal and Medical Coordination
          </h2>

          {/* Divider */}
          <div className="border-t border-white/30 w-2/3 mx-auto my-8"></div>

          {/* Get Started (with border & forced colors) */}
          <div className="rcms-card p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              <span className="rcms-gs-prefix">Get&nbsp;Started&nbsp;with</span>{' '}
              <span className="text-white">Reconcile</span>{' '}
              <span className="text-[#ff8c42]">C.A.R.E.</span>
            </h3>

            {/* Instruction */}
            <p className="text-black font-bold text-lg mb-3">What would you like to do?</p>
            <p className="text-white text-base md:text-lg mb-8">
              Start here to connect with your team. Our secure platform brings together
              clients, attorneys, and nurse care managers to keep everyone informed.
            </p>

            {/* Button row — proportional */}
            <div className="flex flex-col md:flex-row md:flex-nowrap justify-center gap-4">
              <a href="/intake" className="rcms-btn cta-intake">Client Intake</a>
              <a href="/client-portal" className="rcms-btn btn-slim btn-client-portal">Client Portal</a>
              <a href="/attorney-portal" className="rcms-btn btn-slim btn-attorney-portal">Attorney Portal</a>
              <a href="/provider-portal" className="rcms-btn btn-slim btn-provider-portal">Provider Portal</a>
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

      {/* ===================== FOOTER (forced button colors) ===================== */}
      <footer id="rcms-footer" className="mt-16 bg-gradient-to-b from-[#0f2a6a] via-[#0e385f] to-[#0f2a6a] text-white/90" aria-label="Site footer">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight">
              Reconcile <span className="text-[#ff8c42]">C.A.R.E.</span>
            </h3>
            <p className="text-sm text-white/80 mt-1">
              Comprehensive Nursing Care Management for Legal and Medical Coordination
            </p>
          </div>

          <div className="flex flex-nowrap gap-3">
            <a href="/intake" className="rcms-btn cta-intake" style={{ fontSize:'1rem', padding:'0.75rem 1.25rem' }}>Client Intake</a>
            <a href="/attorney-portal" className="rcms-btn btn-attorney-portal">Attorney Portal</a>
            <a href="/client-portal" className="rcms-btn btn-client-portal">Client Portal</a>
            <a href="/provider-portal" className="rcms-btn btn-provider-portal">Provider Portal</a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20" />

        {/* Link columns */}
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-3">Reconcile Care Management Services</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/about" className="hover:underline">About RCMS</a></li>
              <li><a href="/contact" className="hover:underline">Contact</a></li>
              <li><a href="/pricing" className="hover:underline">Pricing &amp; Tiers</a></li>
              <li><a href="/faq" className="hover:underline">FAQ</a></li>
            </ul>
          </div>

          {/* Compliance */}
          <div>
            <h4 className="text-white font-semibold mb-3">Compliance</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/hipaa-notice" className="hover:underline">HIPAA Notice of Privacy Practices</a></li>
              <li><a href="/privacy" className="hover:underline">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:underline">Terms of Service</a></li>
              <li><a href="/baa" className="hover:underline">Business Associate Agreement</a></li>
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/security" className="hover:underline">Security &amp; Data Retention</a></li>
              <li><a href="/accessibility" className="hover:underline">Accessibility (WCAG 2.1 AA)</a></li>
              <li><a href="/roadmap" className="hover:underline">Roadmap</a></li>
              <li><a href="/status" className="hover:underline">System Status</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:support@reconcilecms.com" className="hover:underline">support@reconcilecms.com</a></li>
              <li><a href="tel:+1-555-555-1212" className="hover:underline">+1 (555) 555-1212</a></li>
              <li className="text-white/75">Mon–Fri, 9am–5pm CT</li>
            </ul>
            <div className="mt-3 flex items-center gap-3">
              <a href="#" aria-label="LinkedIn" className="text-white/80 hover:text-white">LinkedIn</a>
            </div>
          </div>
        </div>

        {/* Mini disclaimer */}
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="rounded-xl bg-white/5 border border-white/15 p-4">
            <p className="text-xs text-white/80">
              <strong>Notice:</strong> Reconcile C.A.R.E. is designed with privacy by default. Do not include PHI in URLs, email, or SMS.
              Minimum necessary data is collected. Access to sensitive cases is restricted by role and consent.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/15">
          <div className="max-w-7xl mx-auto px-6 py-4 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-white/70">
            <p>© {new Date().getFullYear()} Reconcile Care Management Services. All rights reserved.</p>
            <p className="text-white/70">Built for attorneys, clients, and nurse care managers — secure, auditable, and HIPAA-aware.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
