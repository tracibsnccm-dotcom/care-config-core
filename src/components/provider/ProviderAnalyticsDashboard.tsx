import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { Calendar, Star, Users, TrendingUp, Clock } from "lucide-react";

interface ProviderStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  averageRating: number;
  totalRatings: number;
  uniqueClients: number;
  upcomingAppointments: number;
}

export function ProviderAnalyticsDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProviderStats>({
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    averageRating: 0,
    totalRatings: 0,
    uniqueClients: 0,
    upcomingAppointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  async function fetchAnalytics() {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch appointments data
      const { data: appointments, error: apptError } = await supabase
        .from("client_appointments")
        .select("id, status, client_id, appointment_date")
        .eq("provider_id", user.id);

      if (apptError) throw apptError;

      // Fetch ratings data
      const { data: ratings, error: ratingsError } = await supabase
        .from("provider_ratings")
        .select("rating")
        .eq("provider_id", user.id);

      if (ratingsError) throw ratingsError;

      // Calculate stats
      const now = new Date();
      const uniqueClients = new Set(appointments?.map((a) => a.client_id) || []).size;
      const completed = appointments?.filter((a) => a.status === "completed").length || 0;
      const cancelled = appointments?.filter((a) => a.status === "cancelled").length || 0;
      const upcoming =
        appointments?.filter((a) => {
          const apptDate = new Date(a.appointment_date);
          return a.status === "confirmed" && apptDate >= now;
        }).length || 0;

      const avgRating =
        ratings && ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 0;

      setStats({
        totalAppointments: appointments?.length || 0,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        averageRating: avgRating,
        totalRatings: ratings?.length || 0,
        uniqueClients,
        upcomingAppointments: upcoming,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>;
  }

  const completionRate =
    stats.totalAppointments > 0
      ? ((stats.completedAppointments / stats.totalAppointments) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Provider Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Appointments</p>
              <p className="text-2xl font-bold">{stats.totalAppointments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success/10">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold">{completionRate}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <p className="text-2xl font-bold">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.totalRatings} {stats.totalRatings === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-accent/10">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unique Clients</p>
              <p className="text-2xl font-bold">{stats.uniqueClients}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Completed</p>
            <Clock className="w-4 h-4 text-success" />
          </div>
          <p className="text-3xl font-bold text-success">{stats.completedAppointments}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Upcoming</p>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold text-primary">{stats.upcomingAppointments}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Cancelled</p>
            <Clock className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-3xl font-bold text-destructive">{stats.cancelledAppointments}</p>
        </Card>
      </div>
    </div>
  );
}
