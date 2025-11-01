import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // No authentication required for intake drafts

    const { action, draft_id, step, data } = await req.json();

    const TTL_DAYS = 7;
    const expiresAt = new Date(Date.now() + TTL_DAYS * 86400000).toISOString();

    switch (action) {
      case "start": {
        // Create new draft
        const newDraftId = crypto.randomUUID();
        const resumeUrl = `${Deno.env.get("SUPABASE_URL")}/intake?draft=${newDraftId}`;

        // Store in localStorage via response (client will handle)
        return new Response(
          JSON.stringify({
            draft_id: newDraftId,
            expires_at: expiresAt,
            resume_url: resumeUrl,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "status": {
        // Return draft status
        const storedExpiry = req.headers.get("X-Expiry-ISO");
        return new Response(
          JSON.stringify({
            draft_id: draft_id,
            expires_at: storedExpiry || expiresAt,
            resume_url: `${Deno.env.get("SUPABASE_URL")}/intake?draft=${draft_id}`,
            updated_at: new Date().toISOString(),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "save": {
        // Save draft data (in production, save to database)
        console.log("Saving draft:", draft_id, "Step:", step, "Data:", data);
        
        return new Response(
          JSON.stringify({
            draft_id: draft_id,
            updated_at: new Date().toISOString(),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "exit": {
        // Generate resume link
        const resumeUrl = `${Deno.env.get("SUPABASE_URL")}/intake?draft=${draft_id}`;
        
        return new Response(
          JSON.stringify({
            resume_url: resumeUrl,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("intake-draft error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
