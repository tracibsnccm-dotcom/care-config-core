import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { cases } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an AI legal case manager. Analyze personal injury cases and prioritize them based on urgency factors:
- Statute of limitations deadlines approaching
- Client engagement level (recent check-ins, responses)
- Medical treatment gaps or inconsistencies  
- Missing critical documentation
- Case health indicators (4Ps scores, SDOH issues)
- Attorney response delays

Return structured priority scores and actionable recommendations.`;

    const caseSummary = cases.map((c: any) => ({
      id: c.id,
      status: c.status,
      created_at: c.created_at,
      last_checkin: c.last_pain_diary_at,
      documentation: c.documentation,
      odg_benchmarks: c.odg_benchmarks,
      flags: c.flags
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze these cases and return priority scores: ${JSON.stringify(caseSummary)}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "prioritize_cases",
            description: "Return priority analysis for cases",
            parameters: {
              type: "object",
              properties: {
                priorities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      case_id: { type: "string" },
                      priority_score: { type: "number", description: "1-10, 10 = most urgent" },
                      priority_level: { type: "string", enum: ["critical", "high", "medium", "low"] },
                      reasons: { type: "array", items: { type: "string" } },
                      action_items: { type: "array", items: { type: "string" } },
                      deadline_risk: { type: "boolean" }
                    },
                    required: ["case_id", "priority_score", "priority_level", "reasons", "action_items"]
                  }
                }
              },
              required: ["priorities"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "prioritize_cases" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    const priorities = JSON.parse(toolCall.function.arguments).priorities;

    return new Response(JSON.stringify({ priorities }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
