// src/integrations/supabase/client.ts

/**
 * Stub Supabase client for Reconcile C.A.R.E.
 *
 * This exists so builds succeed even though we have not wired
 * real Supabase authentication yet.
 *
 * When you're ready to use Supabase for real:
 *  - install @supabase/supabase-js
 *  - replace this file with a real createClient(...) call
 *  - update supabaseAuth.tsx accordingly.
 */

export const supabase = {
  auth: {
    async getUser() {
      throw new Error("Supabase auth is not configured in this environment.");
    },
    async signInWithPassword() {
      throw new Error("Supabase auth is not configured in this environment.");
    },
    async signOut() {
      throw new Error("Supabase auth is not configured in this environment.");
    },
  },
};
