import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 20 requests per hour per IP (for anonymous users)
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting for anonymous users
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(clientId, RATE_LIMIT_CONFIG);
    
    if (rateLimit.isLimited) {
      console.warn(`[intake-draft] Rate limit exceeded for ${clientId}`);
      return createRateLimitResponse(rateLimit.resetAt);
    }

    console.log(`[intake-draft] Request from ${clientId}`);

    // Input validation
    const body = await req.json();
    const { action, draft_id, step, data } = body;

    // Validate action parameter
    const validActions = ['start', 'status', 'save', 'exit'];
    if (!action || !validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action parameter" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Validate draft_id format for actions that require it
    if (action !== 'start' && (!draft_id || typeof draft_id !== 'string')) {
      return new Response(
        JSON.stringify({ error: "Invalid draft_id parameter" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

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
