import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client for Vercel API route
const supabaseUrl = process.env.SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    "[Supervisor Actions API] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars."
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
    const supervisorUserId =
      (body.supervisor_user_id as string | undefined) ?? null;
    const actionType = body.action_type as
      | "call_ems"
      | "override_no_ems"
      | "resolve_crisis"
      | undefined;

    if (!incidentId) {
      return res.status(400).json({ error: "incident_id is required" });
    }

    if (!actionType) {
      return res.status(400).json({ error: "action_type is required" });
    }

    if (!supabaseUrl || !serviceRoleKey) {
      console.log(
        "[Supervisor Actions API] Supabase not configured. Accepting stub action."
      );
      return res.status(201).json({
        ok: true,
        message:
          "Supervisor action accepted as stub (Supabase not configured yet).",
        actionType,
      });
    }

    let emsCalled = false;
    let emsOverride = false;
    let resolved = false;

    // Handle specific actions
    if (actionType === "call_ems") {
      emsCalled = true;
      const emsEtaText = (body.ems_eta_text as string) || null;
      const callNotes = (body.call_notes as string) || null;
      const emsCaseReference = (body.ems_case_reference as string) || null;

      // Insert into crisis_ems_calls
      const { error: emsCallError } = await supabase
        .from("crisis_ems_calls")
        .insert({
          incident_id: incidentId,
          called_by_user_id: supervisorUserId,
          called_by_role: "supervisor",
          ems_eta_text: emsEtaText,
          call_notes: callNotes,
          ems_case_reference: emsCaseReference,
        });

      if (emsCallError) {
        console.error(
          "[Supervisor Actions API] Error inserting EMS call:",
          emsCallError
        );
        return res
          .status(500)
          .json({ error: "Failed to record EMS call for incident" });
      }

      // Update incident EMS fields
      const { error: incidentUpdateError } = await supabase
        .from("crisis_incidents")
        .update({
          ems_called: true,
          ems_caller_role: "supervisor",
          ems_caller_user_id: supervisorUserId,
          ems_called_at: new Date().toISOString(),
          current_state: "ems_call_in_progress",
        })
        .eq("id", incidentId);

      if (incidentUpdateError) {
        console.error(
          "[Supervisor Actions API] Error updating incident EMS state:",
          incidentUpdateError
        );
        return res
          .status(500)
          .json({ error: "Failed to update incident EMS state" });
      }

      // Log action
      await supabase.from("crisis_actions_log").insert({
        incident_id: incidentId,
        actor_user_id: supervisorUserId,
        actor_role: "supervisor",
        action_type: "supervisor_call_ems",
        details_json: {
          ems_eta_text: emsEtaText,
          ems_case_reference: emsCaseReference,
        },
      });
    }

    if (actionType === "override_no_ems") {
      emsOverride = true;
      const overrideReason = (body.override_reason as string) || null;

      const { error: incidentUpdateError } = await supabase
        .from("crisis_incidents")
        .update({
          ems_called: false,
          ems_decision_owner_role: "supervisor",
          ems_decision_owner_user_id: supervisorUserId,
          current_state: "awaiting_resolution",
        })
        .eq("id", incidentId);

      if (incidentUpdateError) {
        console.error(
          "[Supervisor Actions API] Error updating incident override state:",
          incidentUpdateError
        );
        return res
          .status(500)
          .json({ error: "Failed to update incident override state" });
      }

      await supabase.from("crisis_actions_log").insert({
        incident_id: incidentId,
        actor_user_id: supervisorUserId,
        actor_role: "supervisor",
        action_type: "supervisor_override_no_ems",
        details_json: {
          override_reason: overrideReason,
        },
      });
    }

    if (actionType === "resolve_crisis") {
      resolved = true;
      const finalDisposition = (body.final_disposition as string) || null;
      const resolutionSummary = (body.resolution_summary as string) || null;

      const { error: incidentUpdateError } = await supabase
        .from("crisis_incidents")
        .update({
          current_state: "resolved",
          resolved_at: new Date().toISOString(),
          resolved_by_user_id: supervisorUserId,
          notes_summary: resolutionSummary,
        })
        .eq("id", incidentId);

      if (incidentUpdateError) {
        console.error(
          "[Supervisor Actions API] Error updating incident resolution:",
          incidentUpdateError
        );
        return res
          .status(500)
          .json({ error: "Failed to resolve crisis incident" });
      }

      await supabase.from("crisis_actions_log").insert({
        incident_id: incidentId,
        actor_user_id: supervisorUserId,
        actor_role: "supervisor",
        action_type: "supervisor_resolve_crisis",
        details_json: {
          final_disposition: finalDisposition,
        },
      });
    }

    return res.status(201).json({
      ok: true,
      message: "Supervisor action recorded.",
      actionType,
      emsCalled,
      emsOverride,
      resolved,
    });
  } catch (err) {
    console.error("[Supervisor Actions API] Unexpected error:", err);
    return res.status(500).json({
      error: "Unexpected error handling supervisor action",
    });
  }
}
