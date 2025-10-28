import ClientCheckins from "./ClientCheckins";

export default function ClientPortal() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <header className="mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-sm font-semibold">
          <span>Client Portal</span>
          <span className="opacity-75">(Role: CLIENT)</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-primary">Check-ins & Updates</h1>
        <p className="text-muted-foreground mt-1">
          Submit pain updates, symptoms, and notes. Certain details may be shared with your attorney and providers only
          if you allow it.
        </p>
      </header>

      <ClientCheckins />
    </main>
  );
}
