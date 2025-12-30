import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client for Vercel API route
const supabaseUrl = process.env.SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    "[Buddy Checklist API] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars."
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

    const incidentId = body.incident_id as string | undefined;
    const completedByUserId = (body.completed_by_user_id as string) || null;

    if (!incidentId) {
      return res.status(400).json({ error: "incident_id is required" });
    }

    if (!supabaseUrl || !serviceRoleKey) {
      console.log(
        "[Buddy Checklist API] Supabase not configured. Skipping DB insert."
      );
      return res.status(201).json({
        ok: true,
        message:
          "Buddy checklist stub accepted (Supabase not configured yet).",
      });
    }

    // Extract boolean flags (default to null so they are explicit in DB)
    const firearm_present = body.firearm_present ?? null;
    const other_weapon_present = body.other_weapon_present ?? null;
    const children_present = body.children_present ?? null;
    const vulnerable_person_present = body.vulnerable_person_present ?? null;
    const drugs_etoh_involved = body.drugs_etoh_involved ?? null;
    const immediate_threat = body.immediate_threat ?? null;
    const location_confirmed = body.location_confirmed ?? null;
    const visible_injuries = body.visible_injuries ?? null;
    const client_cooperative = body.client_cooperative ?? null;
    const rn_requests_ems_now = body.rn_requests_ems_now ?? null;

    // Simple urgency logic: firearm OR immediate threat → high; drugs/ETOH or injuries → moderate; else low
    let system_ems_urgency: string | null = "low";
    if (firearm_present === true || immediate_threat === true) {
      system_ems_urgency = "high";
    } else if (
      drugs_etoh_involved === true ||
      visible_injuries === true ||
      children_present === true
    ) {
      system_ems_urgency = "moderate";
    }

    // Insert checklist
    const { data: checklist, error: checklistError } = await supabase
      .from("crisis_checklists")
      .insert({
        incident_id: incidentId,
        completed_by_user_id: completedByUserId,
        completed_by_role: "buddy",
        firearm_present,
        other_weapon_present,
        children_present,
        vulnerable_person_present,
        drugs_etoh_involved,
        immediate_threat,
        location_confirmed,
        visible_injuries,
        client_cooperative,
        rn_requests_ems_now,
        system_ems_urgency,
      })
      .select("*")
      .single();

    if (checklistError || !checklist) {
      console.error(
        "[Buddy Checklist API] Error inserting checklist:",
        checklistError
      );
      return res
        .status(500)
        .json({ error: "Failed to save buddy checklist" });
    }

    // Log action
    const { error: logError } = await supabase.from("crisis_actions_log").insert(
      {
        incident_id: incidentId,
        actor_user_id: completedByUserId,
        actor_role: "buddy",
        action_type: "buddy_checklist_submitted",
        details_json: {
          system_ems_urgency,
        },
      }
    );

    if (logError) {
      console.error("[Buddy Checklist API] Error inserting action log:", logError);
    }

    return res.status(201).json({
      ok: true,
      message: "Buddy checklist saved.",
      checklist,
      system_ems_urgency,
    });
  } catch (err) {
    console.error("[Buddy Checklist API] Unexpected error:", err);
    return res.status(500).json({
      error: "Unexpected error saving buddy checklist",
    });
  }
}
