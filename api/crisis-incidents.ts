import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client for Vercel API route
const supabaseUrl = process.env.SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    "[Crisis API] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars."
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const caseId = body.case_id as string | undefined;
    const triggerSource =
      (body.trigger_source as string | undefined) ?? "rn_manual";

    if (!caseId) {
      return res.status(400).json({ error: "case_id is required" });
    }

    if (!supabaseUrl || !serviceRoleKey) {
      // Fall back gracefully if Supabase isn't wired yet
      console.log(
        "[Crisis API] Supabase not configured. Returning stub incident."
      );
      return res.status(201).json({
        ok: true,
        message:
          "Crisis Mode incident stub created (Supabase not configured yet).",
        incidentId: "stub-incident-id",
      });
    }

    // Insert into crisis_incidents table
    const { data, error } = await supabase
      .from("crisis_incidents")
      .insert({
        case_id: caseId,
        created_by_rn_id: null, // later you can plug in the RN user ID
        current_state: "crisis_detected",
        notes_summary: null,
        crisis_category: null,
        crisis_subtype: null,
        severity_level: null,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("[Crisis API] Supabase insert error:", error);
      return res.status(500).json({
        error: "Failed to create crisis incident in Supabase",
      });
    }

    console.log("[Crisis API] Crisis incident created:", data);

    return res.status(201).json({
      ok: true,
      message: "Crisis Mode incident created.",
      incidentId: data.id,
      incident: data,
      triggerSource,
    });
  } catch (err) {
    console.error("[Crisis API] Unexpected error:", err);
    return res.status(500).json({
      error: "Unexpected error creating crisis incident",
    });
  }
}
