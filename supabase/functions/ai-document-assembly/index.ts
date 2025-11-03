import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { documentType, caseData, templateContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert legal document drafter specializing in personal injury cases. Generate professional, accurate legal documents using provided case data. Follow standard legal formatting and include all necessary elements.

Document Types:
- Demand Letter: Comprehensive settlement demand with damages breakdown
- Medical Chronology: Organized timeline of treatments
- Case Summary: Concise overview for settlement negotiations
- Discovery Requests: Standard interrogatories and requests for production
- Retainer Agreement: Client engagement letter

Use formal legal language, proper citations, and professional formatting.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Generate a ${documentType} using this case data: ${JSON.stringify(caseData)}. Context: ${JSON.stringify(templateContext || {})}` 
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_document",
            description: "Return formatted legal document",
            parameters: {
              type: "object",
              properties: {
                document_title: { type: "string" },
                document_content: { type: "string", description: "Full formatted document text" },
                sections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      section_title: { type: "string" },
                      section_content: { type: "string" }
                    }
                  }
                },
                placeholders_filled: { type: "object" },
                missing_data: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              },
              required: ["document_title", "document_content", "sections"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_document" } }
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
    const document = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ document }), {
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
