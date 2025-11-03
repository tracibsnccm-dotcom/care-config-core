import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const body = await req.json();
    const { scope, action, case_id } = body;

    // Handle listing
    if (!action || action === 'list') {
      // Get incomplete intakes with 7-day expiry window
      let baseQuery = supabaseClient
        .from('cases')
        .select(`
          id,
          client_id,
          status,
          updated_at,
          created_at
        `)
        .in('status', ['Intake Started', 'Intake In Progress']);

      // If only my cases, first gather assigned case ids from case_assignments
      if (scope === 'mine') {
        const { data: assigned, error: assignedErr } = await supabaseClient
          .from('case_assignments')
          .select('case_id')
          .eq('user_id', user.id);
        if (assignedErr) throw assignedErr;
        const ids = (assigned || []).map((a: any) => a.case_id);
        if (ids.length === 0) {
          return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        baseQuery = baseQuery.in('id', ids);
      }

      const { data: cases, error } = await baseQuery;
      if (error) throw error;

      // Fetch client profiles for display names in a separate query
      const profilesMap = new Map<string, string>();
      if (cases && cases.length > 0) {
        const clientIds = Array.from(new Set(cases.map((c: any) => c.client_id).filter(Boolean)));
        if (clientIds.length > 0) {
          const { data: profs, error: profErr } = await supabaseClient
            .from('profiles')
            .select('user_id, display_name')
            .in('user_id', clientIds);
          if (profErr) {
            console.error('profiles fetch error', profErr);
          } else {
            profs?.forEach((p: any) => profilesMap.set(p.user_id, p.display_name));
          }
        }
      }


      const rows = (cases || []).map((c: any) => {
        const intakeStart = new Date(c.updated_at || c.created_at || new Date().toISOString());
        const expiresAt = new Date(intakeStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        return {
          case_id: c.id,
          client: profilesMap.get(c.client_id) || 'Unknown',
          stage: c.status,
          last_activity_iso: c.updated_at,
          expires_iso: expiresAt.toISOString(),
          nudges: 0,
          my_client: scope === 'mine'
        };
      });

      return new Response(JSON.stringify(rows), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'nudge') {
      // Send notification to client
      const { data: caseData, error } = await supabaseClient
        .from('cases')
        .select('client_id')
        .eq('id', case_id)
        .single();

      if (error) throw error;

      await supabaseClient.from('notifications').insert({
        user_id: caseData.client_id,
        title: 'Complete Your Intake',
        message: 'Your attorney is waiting for you to complete your intake form. You have 7 days from when you started.',
        type: 'info',
        link: '/intake'
      });

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'escalate') {
      // Notify RN CM about incomplete intake
      const { data: caseData, error: caseErr } = await supabaseClient
        .from('cases')
        .select('client_id')
        .eq('id', case_id)
        .single();
      if (caseErr) throw caseErr;

      let clientName = 'client';
      if (caseData?.client_id) {
        const { data: profile, error: profErr } = await supabaseClient
          .from('profiles')
          .select('display_name')
          .eq('user_id', (caseData as any).client_id)
          .single();
        if (!profErr && profile) clientName = (profile as any).display_name || clientName;
      }

      // Get RN CM users
      const { data: rnUsers } = await supabaseClient
        .from('user_roles')
        .select('user_id')
        .eq('role', 'RN_CCM');

      if (rnUsers) {
        for (const rn of rnUsers) {
          await supabaseClient.from('notifications').insert({
            user_id: rn.user_id,
            title: 'Intake Escalation',
            message: `Attorney escalated incomplete intake for ${clientName}`,
            type: 'warning',
            link: `/case-detail/${case_id}`
          });
        }
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('attorney-intake-tracker error', error);
    let message = 'Unknown error';
    try {
      message = (error as any)?.message ?? JSON.stringify(error);
    } catch (_) {
      message = 'Unknown error';
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
