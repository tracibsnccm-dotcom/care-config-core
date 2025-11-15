// src/client/ClientHome.tsx
import WeeklySummary from "./WeeklySummary";
import WeeklyTasks from "./WeeklyTasks";

export default function ClientHome() {
  return (
    <div className="space-y-6">
      {/* Intro card */}
      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-1">
          Client Home: Your Recovery &amp; Case Support
        </h2>
        <p className="text-xs text-gray-600">
          This page gives you a quick view of the work you&apos;re doing for your
          recovery and your case. Small, consistent actions — showing up for
          care, logging your symptoms, and following through on the plan —
          matter for your health and for how your story is documented.
        </p>
        <p className="mt-2 text-[11px] text-gray-500">
          Use this as your &quot;home base&quot;: check your weekly tasks, see how your
          Recovery Bank is filling, and then move into the intake and diary
          sections when you&apos;re ready to add more detail.
        </p>
      </section>

      {/* Main layout: summary + tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)] gap-4">
        <div className="space-y-4">
          <WeeklySummary />
          <WeeklyTasks />
        </div>
      </div>
    </div>
  );
}
