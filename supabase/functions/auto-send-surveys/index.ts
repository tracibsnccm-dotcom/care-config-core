import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SurveyTrigger {
  caseId: string;
  clientId: string;
  triggerType: "care_plan_approval" | "case_assignment" | "care_milestone" | "monthly_engagement";
  triggerDate: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split("T")[0];

    // Find cases that should trigger surveys based on different criteria
    const surveyTriggers: SurveyTrigger[] = [];

    // 1. Cases 7 days after care plan approval
    const { data: carePlanCases } = await supabase
      .from("cases")
      .select("id, client_id, care_plan_approved_at")
      .not("care_plan_approved_at", "is", null);

    if (carePlanCases) {
      for (const caseItem of carePlanCases) {
        const approvalDate = new Date(caseItem.care_plan_approved_at);
        const daysSinceApproval = Math.floor(
          (Date.now() - approvalDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceApproval === 7) {
          // Check if survey already sent
          const { data: existingSurvey } = await supabase
            .from("client_surveys")
            .select("id")
            .eq("case_id", caseItem.id)
            .eq("trigger_type", "care_plan_approval")
            .single();

          if (!existingSurvey) {
            surveyTriggers.push({
              caseId: caseItem.id,
              clientId: caseItem.client_id,
              triggerType: "care_plan_approval",
              triggerDate: today,
            });
          }
        }
      }
    }

    // 2. Cases 30 days after assignment
    const { data: assignmentCases } = await supabase
      .from("cases")
      .select("id, client_id, assigned_at")
      .not("assigned_at", "is", null);

    if (assignmentCases) {
      for (const caseItem of assignmentCases) {
        const assignedDate = new Date(caseItem.assigned_at);
        const daysSinceAssignment = Math.floor(
          (Date.now() - assignedDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceAssignment === 30) {
          const { data: existingSurvey } = await supabase
            .from("client_surveys")
            .select("id")
            .eq("case_id", caseItem.id)
            .eq("trigger_type", "case_assignment")
            .single();

          if (!existingSurvey) {
            surveyTriggers.push({
              caseId: caseItem.id,
              clientId: caseItem.client_id,
              triggerType: "case_assignment",
              triggerDate: today,
            });
          }
        }
      }
    }

    // 3. Monthly engagement surveys (check if it's been 30 days since last survey)
    const { data: allActiveCases } = await supabase
      .from("cases")
      .select("id, client_id")
      .eq("status", "active");

    if (allActiveCases) {
      for (const caseItem of allActiveCases) {
        const { data: lastSurvey } = await supabase
          .from("client_surveys")
          .select("sent_at")
          .eq("case_id", caseItem.id)
          .order("sent_at", { ascending: false })
          .limit(1)
          .single();

        if (lastSurvey) {
          const lastSurveyDate = new Date(lastSurvey.sent_at);
          const daysSinceLastSurvey = Math.floor(
            (Date.now() - lastSurveyDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceLastSurvey >= 30) {
            surveyTriggers.push({
              caseId: caseItem.id,
              clientId: caseItem.client_id,
              triggerType: "monthly_engagement",
              triggerDate: today,
            });
          }
        } else {
          // No survey ever sent, send first monthly survey
          surveyTriggers.push({
            caseId: caseItem.id,
            clientId: caseItem.client_id,
            triggerType: "monthly_engagement",
            triggerDate: today,
          });
        }
      }
    }

    // Create survey records and send notifications
    const surveysCreated = [];
    for (const trigger of surveyTriggers) {
      const { data: survey, error } = await supabase
        .from("client_surveys")
        .insert({
          case_id: trigger.caseId,
          client_id: trigger.clientId,
          trigger_type: trigger.triggerType,
          sent_at: new Date().toISOString(),
          status: "pending",
          response_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single();

      if (!error && survey) {
        surveysCreated.push(survey);

        // Send notification to client (you can implement email/SMS here)
        await supabase.from("notifications").insert({
          user_id: trigger.clientId,
          type: "survey",
          title: "Your Feedback Matters",
          message: "We would appreciate your feedback on your care experience.",
          link: `/client-portal/survey/${survey.id}`,
          created_at: new Date().toISOString(),
        });
      }
    }

    console.log(`Auto-sent ${surveysCreated.length} surveys`);

    return new Response(
      JSON.stringify({
        success: true,
        surveysCreated: surveysCreated.length,
        triggers: surveyTriggers.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in auto-send-surveys:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
