import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from '../_shared/rate-limiter.ts';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 20 requests per hour per IP (for anonymous users)
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
};

// Input validation schema
const intakeDraftSchema = z.object({
  action: z.enum(['start', 'status', 'save', 'exit']),
  draft_id: z.string().uuid().optional(),
  step: z.string().optional(),
  data: z.any().optional()
});

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

    // Input validation with zod
    const body = await req.json();
    
    const validation = intakeDraftSchema.safeParse(body);
    if (!validation.success) {
      console.error(`[intake-draft] Validation error:`, validation.error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request parameters", 
          details: validation.error.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { action, draft_id, step, data } = validation.data;

    // Additional validation for draft_id when required
    if (action !== 'start' && !draft_id) {
      return new Response(
        JSON.stringify({ error: "draft_id is required for this action" }),
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
