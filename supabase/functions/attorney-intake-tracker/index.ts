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

    // Accept both POST (JSON body) and GET (query params)
    let scope: 'mine' | 'all' = 'mine';
    let action: 'list' | 'nudge' | 'escalate' = 'list';
    let case_id: string | undefined;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      scope = (url.searchParams.get('scope') as any) || scope;
      action = (url.searchParams.get('action') as any) || action;
      case_id = url.searchParams.get('case_id') || case_id;
    } else {
      try {
        const body = await req.json();
        scope = (body?.scope as any) ?? scope;
        action = (body?.action as any) ?? action;
        case_id = body?.case_id ?? case_id;
      } catch (_) {
        // No/invalid JSON body; default to list
      }
    }

    // Handle listing
    if (!action || action === 'list') {
      // Get incomplete intakes with 7-day expiry window
      let baseQuery = supabaseClient
        .from('cases')
        .select(`
          id,
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

      // Build map of case -> client user_id via case_assignments (role CLIENT), then fetch profiles
      const clientByCase = new Map<string, string>();
      const profilesMap = new Map<string, string>();
      if (cases && cases.length > 0) {
        const caseIds = (cases as any[]).map((c: any) => c.id);
        const { data: assigns, error: caErr } = await supabaseClient
          .from('case_assignments')
          .select('case_id, user_id, role')
          .in('case_id', caseIds)
          .eq('role', 'CLIENT');
        if (caErr) {
          console.error('case_assignments fetch error', caErr);
        } else {
          assigns?.forEach((a: any) => clientByCase.set(a.case_id, a.user_id));
          const clientIds = Array.from(new Set(assigns?.map((a: any) => a.user_id) || []));
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
      }


      const rows = (cases || []).map((c: any) => {
        const intakeStart = new Date(c.updated_at || c.created_at || new Date().toISOString());
        const expiresAt = new Date(intakeStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        const clientId = clientByCase.get(c.id);
        
        return {
          case_id: c.id,
          client: (clientId ? profilesMap.get(clientId) : undefined) || 'Unknown',
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
      // Send notification to client (lookup client via case_assignments)
      const { data: ca, error: caErr } = await supabaseClient
        .from('case_assignments')
        .select('user_id')
        .eq('case_id', case_id)
        .eq('role', 'CLIENT')
        .maybeSingle();

      if (caErr || !ca?.user_id) throw (caErr || new Error('Client assignment not found'));

      await supabaseClient.from('notifications').insert({
        user_id: (ca as any).user_id,
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
      const { data: ca, error: caErr } = await supabaseClient
        .from('case_assignments')
        .select('user_id')
        .eq('case_id', case_id)
        .eq('role', 'CLIENT')
        .maybeSingle();
      if (caErr) throw caErr;

      let clientName = 'client';
      if ((ca as any)?.user_id) {
        const { data: profile, error: profErr } = await supabaseClient
          .from('profiles')
          .select('display_name')
          .eq('user_id', (ca as any).user_id)
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
