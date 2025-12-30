import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { caseData } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert personal injury case evaluator. Analyze case details and predict settlement value ranges based on:
- Injury severity and type
- Medical treatment history and costs
- Lost wages and economic damages
- Pain and suffering factors
- Liability strength
- Comparable verdicts/settlements
- Jurisdiction considerations

Provide conservative, realistic, and optimistic estimates with confidence levels.`;

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
          { role: "user", content: `Analyze this case and predict settlement value: ${JSON.stringify(caseData)}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "predict_settlement",
            description: "Return settlement value prediction",
            parameters: {
              type: "object",
              properties: {
                conservative_estimate: { type: "number" },
                realistic_estimate: { type: "number" },
                optimistic_estimate: { type: "number" },
                confidence_level: { type: "string", enum: ["low", "medium", "high"] },
                key_factors: { type: "array", items: { type: "string" } },
                risks: { type: "array", items: { type: "string" } },
                strengths: { type: "array", items: { type: "string" } },
                medical_costs_estimate: { type: "number" },
                pain_suffering_multiplier: { type: "number" },
                comparable_cases: { type: "string" }
              },
              required: ["conservative_estimate", "realistic_estimate", "optimistic_estimate", "confidence_level", "key_factors"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "predict_settlement" } }
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
    const prediction = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ prediction }), {
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
