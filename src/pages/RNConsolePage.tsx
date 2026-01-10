import { RNWorkQueue } from "@/components/RNClinicalLiaison/RNWorkQueue";

export default function RNConsolePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <RNWorkQueue />
      </div>
    </div>
  );
}
