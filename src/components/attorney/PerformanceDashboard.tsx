import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { TrendingUp, DollarSign, Star, Clock, CheckCircle2, XCircle, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PerformanceMetrics {
  totalReferrals: number;
  accepted: number;
  declined: number;
  avgResponseTime: number;
  conversionRate: number;
  totalRevenue: number;
  avgCaseValue: number;
  clientSatisfaction: number;
  activeCases: number;
  closedCases: number;
}

export default function PerformanceDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalReferrals: 0,
    accepted: 0,
    declined: 0,
    avgResponseTime: 0,
    conversionRate: 0,
    totalRevenue: 0,
    avgCaseValue: 0,
    clientSatisfaction: 0,
    activeCases: 0,
    closedCases: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPerformanceMetrics();
    }
  }, [user]);

  const fetchPerformanceMetrics = async () => {
    try {
      // Fetch attorney metadata
      const { data: attorneyData } = await supabase
        .from("attorney_metadata")
        .select("user_id")
        .eq("user_id", user?.id)
        .single();

      if (!attorneyData) return;

      // Fetch performance data from assignment_offers
      const { data: offers } = await supabase
        .from("assignment_offers")
        .select("*")
        .eq("attorney_id", user?.id);

      // Fetch active cases
      const { data: cases } = await supabase
        .from("case_assignments")
        .select("case_id, cases!inner(status)")
        .eq("user_id", user?.id)
        .eq("role", "ATTORNEY");

      const activeCases = cases?.filter((c: any) => 
        !['Closed', 'Settled', 'Dismissed'].includes(c.cases.status)
      ).length || 0;

      const closedCases = cases?.filter((c: any) => 
        ['Closed', 'Settled', 'Dismissed'].includes(c.cases.status)
      ).length || 0;

      // Calculate avg response time
      const respondedOffers = offers?.filter(o => o.responded_at) || [];
      const avgResponseTime = respondedOffers.length > 0
        ? respondedOffers.reduce((sum, o) => {
            const diff = new Date(o.responded_at!).getTime() - new Date(o.offered_at).getTime();
            return sum + (diff / (1000 * 60 * 60)); // Convert to hours
          }, 0) / respondedOffers.length
        : 0;

      // Fetch billing transactions
      const { data: transactions } = await supabase
        .from("billing_transactions")
        .select("amount")
        .eq("attorney_id", user?.id)
        .eq("payment_status", "paid");

      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const avgCaseValue = closedCases > 0 ? totalRevenue / closedCases : 0;
      const conversionRate = (offers?.length || 0) > 0
        ? Math.round(((offers?.filter(o => o.status === 'accepted').length || 0) / (offers?.length || 1)) * 100)
        : 0;

      setMetrics({
        totalReferrals: offers?.length || 0,
        accepted: offers?.filter(o => o.status === 'accepted').length || 0,
        declined: offers?.filter(o => o.status === 'declined').length || 0,
        avgResponseTime,
        conversionRate,
        totalRevenue,
        avgCaseValue,
        clientSatisfaction: 4.5, // Mock for now
        activeCases,
        closedCases
      });
    } catch (error: any) {
      toast.error("Failed to load performance metrics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading performance metrics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
              <p className="text-2xl font-bold">{metrics.totalReferrals}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Acceptance Rate</p>
              <p className="text-2xl font-bold text-green-500">
                {metrics.totalReferrals > 0 
                  ? Math.round((metrics.accepted / metrics.totalReferrals) * 100) 
                  : 0}%
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Client Satisfaction</p>
              <p className="text-2xl font-bold text-yellow-500">{metrics.clientSatisfaction}/5</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="response">Response Times</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Accepted Referrals</span>
                  <span className="font-semibold">{metrics.accepted}</span>
                </div>
                <Progress value={(metrics.accepted / metrics.totalReferrals) * 100 || 0} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Declined Referrals</span>
                  <span className="font-semibold">{metrics.declined}</span>
                </div>
                <Progress value={(metrics.declined / metrics.totalReferrals) * 100 || 0} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Conversion Rate</span>
                  <span className="font-semibold">{metrics.conversionRate}%</span>
                </div>
                <Progress value={metrics.conversionRate} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Avg Response Time</span>
                  <span className="font-semibold">{metrics.avgResponseTime.toFixed(1)}h</span>
                </div>
                <Progress value={Math.min((24 - metrics.avgResponseTime) / 24 * 100, 100)} className="h-2" />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Cases</p>
                  <p className="text-3xl font-bold">{metrics.activeCases}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Closed Cases</p>
                  <p className="text-3xl font-bold">{metrics.closedCases}</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Total Revenue</h4>
              <p className="text-3xl font-bold mb-1">${metrics.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-500">↑ Year to date</p>
            </Card>

            <Card className="p-6">
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Avg Case Value</h4>
              <p className="text-3xl font-bold mb-1">${metrics.avgCaseValue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Per closed case</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="response" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Response Time Performance</h3>
                <p className="text-sm text-muted-foreground">Average time to respond to referrals</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{metrics.avgResponseTime.toFixed(1)}h</p>
                <p className="text-sm text-muted-foreground">Average</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {metrics.avgResponseTime < 24 ? '✓' : '✗'}
                </p>
                <p className="text-sm text-muted-foreground">Within 24h SLA</p>
              </div>
              <div className="text-center">
                <Badge variant={metrics.avgResponseTime < 12 ? "default" : "secondary"}>
                  {metrics.avgResponseTime < 12 ? "Excellent" : "Good"}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">Rating</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
