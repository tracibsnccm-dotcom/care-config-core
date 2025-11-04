import { AppLayout } from "@/components/AppLayout";
import { RNTimeHistory } from "@/components/RNClinicalLiaison/RNTimeHistory";
import { RNTimeStatsWidget } from "@/components/RNTimeStatsWidget";

export default function RNTimeTracking() {

  return (
    <AppLayout>
      <div className="py-6 px-6 bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm font-semibold mb-3">
              <span>Time Tracking</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f2a6a]">
              Daily Time Entry
            </h1>
            <p className="text-[#0f2a6a]/80 mt-2">
              Track time spent on cases and activities
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Time History */}
            <div className="lg:col-span-2">
              <RNTimeHistory />
            </div>

            {/* Right Column - Quick Stats */}
            <div>
              <RNTimeStatsWidget />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
