// src/AppShell.tsx
import { useAuth } from "./auth/supabaseAuth";
import ClientHome from "./client/ClientHome";

export default function AppShell() {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Completing sign-in…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // SignIn is handled by main.tsx routing
    return null;
  }

  // Infer role from metadata or email domain
  const role =
    (user.user_metadata as any)?.role ??
    (user.email?.endsWith("@attorney.com")
      ? "attorney"
      : user.email?.endsWith("@nurse.com")
      ? "rn_cm"
      : "client");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="font-semibold text-lg">Reconcile C.A.R.E. Portal</h1>

            {/* HIPAA-safe header content */}
            {role === "client" ? (
              <p className="text-xs text-gray-500">
                Secure client session active. Your care team can only see
                information needed to support your recovery.
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Signed in as{" "}
                <span className="font-medium">{user.email}</span> · Role:{" "}
                <span className="uppercase text-[11px]">{role}</span>
              </p>
            )}
          </div>

          <button
            onClick={() => void signOut()}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Client Portal */}
        {role === "client" && <ClientHome />}

        {/* RN Case Manager Portal (placeholder) */}
        {role === "rn_cm" && (
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="font-semibold mb-2">RN Care Manager Console</h2>
            <p className="text-sm text-gray-600">
              This is the RN dashboard. Case timelines, flags, and follow-up
              workflows will appear here.
            </p>
          </div>
        )}

        {/* Attorney Portal (placeholder) */}
        {role === "attorney" && (
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="font-semibold mb-2">Attorney Dashboard</h2>
            <p className="text-sm text-gray-600">
              This is the attorney dashboard. Case summaries, reports, and
              client engagement scores will appear here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}



