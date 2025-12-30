import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rn_id, entry_type, priority, scheduled_date } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch RN's existing entries for context
    const { data: existingEntries } = await supabase
      .from("rn_diary_entries")
      .select("scheduled_date, scheduled_time, entry_type, duration_minutes, priority, completion_status")
      .eq("rn_id", rn_id)
      .gte("scheduled_date", new Date().toISOString().split("T")[0])
      .order("scheduled_date", { ascending: true })
      .limit(20);

    // Get RN's typical schedule patterns
    const { data: historicalData } = await supabase
      .from("rn_diary_entries")
      .select("scheduled_time, entry_type, completion_status")
      .eq("rn_id", rn_id)
      .eq("completion_status", "completed")
      .order("created_at", { ascending: false })
      .limit(50);

    // Build context for AI
    const context = {
      entry_type,
      priority,
      requested_date: scheduled_date,
      existing_schedule: existingEntries || [],
      historical_patterns: historicalData || [],
    };

    // Call Lovable AI for scheduling suggestions
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a clinical scheduling assistant helping RN Case Managers optimize their schedules. 
            Analyze the RN's existing schedule, historical patterns, and the new entry request to suggest optimal scheduling times.
            Consider:
            - Avoiding conflicts with existing entries
            - Clustering similar entry types for efficiency
            - Leaving buffer time between appointments
            - Respecting priority levels (urgent entries should be scheduled ASAP)
            - Typical productive hours based on historical data
            - Travel time between visits if applicable
            Return suggestions in a structured format.`
          },
          {
            role: "user",
            content: `Suggest optimal scheduling times for a ${entry_type} entry with ${priority} priority on ${scheduled_date || "the next available day"}.
            
            Current schedule: ${JSON.stringify(context.existing_schedule)}
            Historical patterns: ${JSON.stringify(context.historical_patterns)}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_schedule_times",
              description: "Return 3 optimal time slot suggestions for scheduling",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        suggested_date: { type: "string", description: "YYYY-MM-DD format" },
                        suggested_time: { type: "string", description: "HH:MM format" },
                        reason: { type: "string", description: "Why this time is optimal" },
                        confidence: { type: "string", enum: ["high", "medium", "low"] },
                        conflicts: {
                          type: "array",
                          items: { type: "string" },
                          description: "Any potential conflicts or considerations"
                        }
                      },
                      required: ["suggested_date", "suggested_time", "reason", "confidence"],
                      additionalProperties: false
                    },
                    minItems: 3,
                    maxItems: 3
                  },
                  overall_recommendation: { type: "string" },
                  workload_assessment: { type: "string", enum: ["light", "moderate", "heavy", "overbooked"] }
                },
                required: ["suggestions", "overall_recommendation", "workload_assessment"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_schedule_times" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.statusText}`);
    }

    const result = await aiResponse.json();
    const toolCall = result.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No scheduling suggestions returned");
    }

    const suggestions = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        success: true,
        suggestions: suggestions.suggestions,
        recommendation: suggestions.overall_recommendation,
        workload_assessment: suggestions.workload_assessment,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in scheduling assistant:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});