import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

/**
 * API: POST /api/test-setup
 * Body: { role: string }
 *
 * - Uses SUPABASE_SERVICE_ROLE_KEY (server-only) to create an auth user with user_metadata.role.
 * - Returns { email, password } for the created test user.
 *
 * Security:
 * - Only allowed in development by default. To enable elsewhere set ALLOW_TEST_SETUP=true.
 * - Do NOT expose the service role key to the client.
 */

function randomPassword(length = 14) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Safety gate
  if (process.env.NODE_ENV !== "development" && process.env.ALLOW_TEST_SETUP !== "true") {
    return res.status(403).json({ error: "Test user creation is disabled in this environment" });
  }

  const { role } = req.body ?? {};
  if (!role || typeof role !== "string") {
    return res.status(400).json({ error: "Missing or invalid role in request body" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars" });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const email = `${role.toLowerCase()}+${Date.now()}@example.com`;
  const password = randomPassword(14);

  try {
    // Create the user via admin API. Using dynamic access to handle sdk shapes.
    // supabase-js v2: supabase.auth.admin.createUser(...)
    const createResult = await (supabaseAdmin.auth as any).admin.createUser({
      email,
      password,
      user_metadata: { role },
      email_confirm: true,
    });

    if (createResult?.error) {
      return res.status(500).json({ error: createResult.error?.message || "Error creating user" });
    }

    const createdUser = createResult.user ?? createResult.data ?? null;
    const userId = createdUser?.id ?? null;

    if (userId) {
      // Optional: maintain a profiles table row if your schema expects it.
      try {
        await supabaseAdmin.from("profiles").insert({ id: userId, email, role });
      } catch (profileErr) {
        // Non-fatal; log and continue
        console.warn("profiles insert failed", profileErr);
      }
    }

    return res.status(200).json({ email, password });
  } catch (err: any) {
    console.error("create test user error", err);
    return res.status(500).json({ error: err?.message || "Unknown server error" });
  }
}