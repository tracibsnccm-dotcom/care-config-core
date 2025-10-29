import ClientCheckins from "./ClientCheckins";
import { CarePlansViewer } from "@/components/CarePlansViewer";
import { ClientMessaging } from "@/components/ClientMessaging";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ClientPortal() {
  // For demo purposes, using a placeholder case ID
  // In production, this would come from the authenticated user's case
  const caseId = "demo-case-id";
  
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-sm font-semibold">
          <span>Client Portal</span>
          <span className="opacity-75">(Role: CLIENT)</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-primary">Your Care Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          View your care plans, submit updates, and communicate with your care team
        </p>
      </header>

      <Tabs defaultValue="checkins" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checkins">Check-ins & Updates</TabsTrigger>
          <TabsTrigger value="careplans">Care Plans</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="checkins" className="space-y-4">
          <ClientCheckins />
        </TabsContent>

        <TabsContent value="careplans" className="space-y-4">
          <CarePlansViewer caseId={caseId} />
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <ClientMessaging caseId={caseId} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
