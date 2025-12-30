/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, entries, entryData, query } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let systemPrompt = "";
    let userPrompt = "";
    let tools: any[] = [];
    let toolChoice: any = undefined;

    switch (action) {
      case "generate_summary":
        systemPrompt = "You are an RN clinical liaison assistant. Generate concise, actionable daily/weekly summaries of diary entries highlighting key activities, upcoming priorities, and any concerns.";
        userPrompt = `Analyze these diary entries and provide a summary:\n\n${JSON.stringify(entries, null, 2)}`;
        break;

      case "auto_categorize":
        systemPrompt = "You are an RN clinical liaison assistant. Analyze diary entry content and suggest appropriate labels, priority levels, and risk flags.";
        userPrompt = `Analyze this diary entry and suggest categorization:\nTitle: ${entryData.title}\nDescription: ${entryData.description || 'N/A'}\nType: ${entryData.entry_type}`;
        
        tools = [{
          type: "function",
          function: {
            name: "categorize_entry",
            description: "Suggest appropriate categorization for a diary entry",
            parameters: {
              type: "object",
              properties: {
                suggested_label: { 
                  type: "string", 
                  enum: ["urgent", "routine", "follow-up", "administrative", "emergency", "documentation"],
                  description: "The most appropriate label for this entry"
                },
                suggested_priority: { 
                  type: "string", 
                  enum: ["low", "medium", "high", "urgent"],
                  description: "Recommended priority level"
                },
                risk_flags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Any risk factors identified (e.g., 'medication_concern', 'fall_risk', 'mental_health')"
                },
                reasoning: {
                  type: "string",
                  description: "Brief explanation of the categorization"
                }
              },
              required: ["suggested_label", "suggested_priority", "risk_flags", "reasoning"],
              additionalProperties: false
            }
          }
        }];
        toolChoice = { type: "function", function: { name: "categorize_entry" } };
        break;

      case "suggest_tasks":
        systemPrompt = "You are an RN clinical liaison assistant. Based on diary history and patterns, suggest next actions or follow-ups that might be needed.";
        userPrompt = `Based on this diary history, suggest 3-5 actionable next steps:\n\n${JSON.stringify(entries, null, 2)}`;
        
        tools = [{
          type: "function",
          function: {
            name: "suggest_tasks",
            description: "Suggest actionable next tasks based on diary patterns",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                      entry_type: { type: "string" },
                      reasoning: { type: "string" },
                      suggested_date: { type: "string", description: "YYYY-MM-DD format" }
                    },
                    required: ["title", "priority", "entry_type", "reasoning"],
                    additionalProperties: false
                  }
                }
              },
              required: ["suggestions"],
              additionalProperties: false
            }
          }
        }];
        toolChoice = { type: "function", function: { name: "suggest_tasks" } };
        break;

      case "generate_completion_note":
        systemPrompt = "You are an RN clinical liaison assistant. Generate professional completion notes for diary entries based on the entry type and client context.";
        userPrompt = `Generate a completion note template for this entry:\nTitle: ${entryData.title}\nType: ${entryData.entry_type}\nDescription: ${entryData.description || 'N/A'}`;
        break;

      case "natural_language_search":
        systemPrompt = "You are an RN clinical liaison assistant. Convert natural language queries into structured search filters for diary entries.";
        userPrompt = `Convert this search query into filters: "${query}"`;
        
        tools = [{
          type: "function",
          function: {
            name: "parse_search_query",
            description: "Parse natural language into search filters",
            parameters: {
              type: "object",
              properties: {
                entry_types: {
                  type: "array",
                  items: { type: "string" },
                  description: "Entry types to filter (e.g., 'phone_call', 'assessment')"
                },
                priorities: {
                  type: "array",
                  items: { type: "string" },
                  description: "Priority levels to filter"
                },
                date_range: {
                  type: "object",
                  properties: {
                    from: { type: "string", description: "Start date YYYY-MM-DD" },
                    to: { type: "string", description: "End date YYYY-MM-DD" }
                  }
                },
                keywords: {
                  type: "array",
                  items: { type: "string" },
                  description: "Keywords to search in title/description"
                },
                completion_status: {
                  type: "array",
                  items: { type: "string" },
                  description: "Status filters (pending, completed, overdue)"
                }
              },
              additionalProperties: false
            }
          }
        }];
        toolChoice = { type: "function", function: { name: "parse_search_query" } };
        break;

      case "sentiment_analysis":
        systemPrompt = "You are an RN clinical liaison assistant. Analyze the emotional tone and client sentiment from diary entry descriptions.";
        userPrompt = `Analyze the sentiment in these recent diary entries:\n\n${JSON.stringify(entries, null, 2)}`;
        
        tools = [{
          type: "function",
          function: {
            name: "analyze_sentiment",
            description: "Analyze emotional tone and sentiment trends",
            parameters: {
              type: "object",
              properties: {
                overall_sentiment: {
                  type: "string",
                  enum: ["positive", "neutral", "negative", "concerning"],
                  description: "Overall sentiment across entries"
                },
                trend: {
                  type: "string",
                  enum: ["improving", "stable", "declining"],
                  description: "Sentiment trend over time"
                },
                concerns: {
                  type: "array",
                  items: { type: "string" },
                  description: "Any concerning patterns identified"
                },
                insights: { type: "string", description: "Key insights and observations" }
              },
              required: ["overall_sentiment", "trend", "concerns", "insights"],
              additionalProperties: false
            }
          }
        }];
        toolChoice = { type: "function", function: { name: "analyze_sentiment" } };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const requestBody: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    };

    if (tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = toolChoice;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("AI Gateway request failed");
    }

    const aiResponse = await response.json();
    
    let result: any;
    if (tools.length > 0 && aiResponse.choices[0]?.message?.tool_calls) {
      const toolCall = aiResponse.choices[0].message.tool_calls[0];
      result = JSON.parse(toolCall.function.arguments);
    } else {
      result = { content: aiResponse.choices[0]?.message?.content || "" };
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in diary-ai-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
