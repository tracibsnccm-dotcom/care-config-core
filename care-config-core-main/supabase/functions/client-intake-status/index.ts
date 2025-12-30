import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user has CLIENT role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "CLIENT")
      .single();

    if (!roles) {
      return new Response(JSON.stringify({ error: "Not a client" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get case info for this client
    const { data: caseData } = await supabase
      .from("cases")
      .select("id, status, intake_data, created_at")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Check for most recent nudge notification
    const { data: nudgeNotif } = await supabase
      .from("notifications")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("title", "Complete Your Intake")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Calculate expiry (7 days from case creation)
    const expiresIso = caseData
      ? new Date(new Date(caseData.created_at).getTime() + 7 * 24 * 3600000).toISOString()
      : null;

    // Check if intake is complete
    const intakeComplete = caseData?.status !== "intake_pending" && caseData?.status !== "intake_in_progress";

    return new Response(
      JSON.stringify({
        intake_complete: intakeComplete,
        last_nudged_iso: nudgeNotif?.created_at || null,
        expires_iso: expiresIso,
        resume_url: caseData ? `/intake?case_id=${caseData.id}` : "/intake",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
