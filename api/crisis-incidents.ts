import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body;
  console.log("Crisis incident start requested:", body);

  // Later this will insert into Supabase crisis_incidents table.
  return res.status(201).json({
    ok: true,
    message: "Crisis Mode incident stub created.",
    incidentId: "stub-incident-id",
  });
}
