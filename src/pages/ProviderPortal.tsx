import { RCMS, btn } from "../constants/brand";

export default function ProviderPortal() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-extrabold" style={{color: RCMS.brandNavy}}>Provider Portal</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Secure area for assigned providers. Upload visit summaries, add notes, and review routed cases.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Assigned Cases</h2>
          <p className="text-sm text-muted-foreground">Cases routed to your practice will appear here.</p>
          <button className={`${btn.base} ${btn.md} text-white mt-3`} style={{ backgroundColor: RCMS.eggplant }}>
            View cases
          </button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Secure Upload</h2>
          <p className="text-sm text-muted-foreground">Encrypted document handoff (placeholder).</p>
          <button className={`${btn.base} ${btn.md} text-white mt-3`} style={{ backgroundColor: RCMS.brandTeal }}>
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}
