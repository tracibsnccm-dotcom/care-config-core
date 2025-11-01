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

    // Handle GET request for listing
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const scope = url.searchParams.get('scope') || 'mine';
      // Get incomplete intakes with 7-day expiry window
      let query = supabaseClient
        .from('cases')
        .select(`
          id,
          client_id,
          status,
          updated_at,
          intake_started_at,
          profiles!cases_client_id_fkey(display_name)
        `)
        .in('status', ['Intake Started', 'Intake In Progress'])
        .not('intake_started_at', 'is', null);

      if (scope === 'mine') {
        query = query.eq('attorney_id', user.id);
      }

      const { data: cases, error } = await query;
      if (error) throw error;

      const rows = cases?.map((c: any) => {
        const intakeStart = new Date(c.intake_started_at);
        const expiresAt = new Date(intakeStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        return {
          case_id: c.id,
          client: c.profiles?.display_name || 'Unknown',
          stage: c.status,
          last_activity_iso: c.updated_at,
          expires_iso: expiresAt.toISOString(),
          nudges: 0,
          my_client: true
        };
      }) || [];

      return new Response(JSON.stringify(rows), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle POST requests for actions
    const { action, case_id } = await req.json();

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
      const { data: caseData } = await supabaseClient
        .from('cases')
        .select('client_id, profiles!cases_client_id_fkey(display_name)')
        .eq('id', case_id)
        .single();

      const clientName = (caseData as any)?.profiles?.display_name || 'client';

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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
