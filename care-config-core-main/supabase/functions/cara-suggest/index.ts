/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, type, text, lang, tone, style } = await req.json();
    
    if (!text?.trim()) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt based on mode or type
    const requestMode = mode || type;
    const requestStyle = style || tone || 'simple';
    let systemPrompt = "";
    
    switch (requestMode) {
      case "explain":
        systemPrompt = `You are CARA, a Care Reflection Assistant helping people understand their intake forms. Explain the following question or term in a ${requestStyle} and clear way. Keep your explanation brief (2-3 sentences) and helpful for someone filling out a medical/legal intake form.`;
        break;
      case "rewrite":
        systemPrompt = `You are CARA, a Care Reflection Assistant. Rewrite the user's journal entry to be clear, simple, and easy to understand. Keep the same meaning but make it more concise and well-structured. Maintain a ${requestStyle} tone.`;
        break;
      case "expressive":
        systemPrompt = `You are CARA, a Care Reflection Assistant. Transform the user's journal entry to be more expressive and emotionally supportive. Help them articulate their feelings and experiences more deeply. Use a ${requestStyle} tone that validates their experience.`;
        break;
      case "translate":
        systemPrompt = `You are CARA, a Care Reflection Assistant. Translate the following text to English. Preserve the emotional tone and meaning. If already in English, improve clarity while keeping the same message.`;
        break;
      default:
        systemPrompt = `You are CARA, a helpful Care Reflection Assistant. Help improve the user's journal entry with a ${requestStyle} tone.`;
    }

    // Add language instruction if specified
    if (lang !== "en" && mode !== "translate") {
      systemPrompt += ` Respond in the target language: ${lang}.`;
    }

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
          { role: "user", content: text }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ suggestion, answer: suggestion }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in cara-suggest:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
