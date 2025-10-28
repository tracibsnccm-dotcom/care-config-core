import { useAuth } from "@/auth/AuthContext";
import { Link } from "react-router-dom";

export default function ProviderPortal() {
  const { user } = useAuth();

  return (
    <main className="max-w-5xl mx-auto p-6">
      <header className="mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
          <span>Provider Portal</span>
          <span className="opacity-75">(Role: PROVIDER)</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-primary">Assigned Cases</h1>
        <p className="text-muted-foreground mt-1">
          Read-only view of case summaries with consent-based access. Upload notes via secure channel (fax/email
          placeholder) will be added later.
        </p>
      </header>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <p className="text-sm text-foreground">
          Welcome, <strong>{user?.email || "provider"}</strong>. Your assigned cases will appear here.
        </p>
        <ul className="mt-4 list-disc pl-5 text-sm text-muted-foreground space-y-2">
          <li>Consent-aware summary (incident type/date, current status).</li>
          <li>Redacted identity unless consent permits.</li>
          <li>Secure upload placeholder (RightFax / encrypted email) — <em>coming soon</em>.</li>
        </ul>

        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold text-foreground mb-3">Quick Actions</h3>
          <div className="flex gap-3">
            <Link
              to="/router"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              View Router
            </Link>
            <Link
              to="/providers"
              className="px-4 py-2 rounded-lg border border-input hover:bg-accent font-semibold"
            >
              Provider Directory
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
