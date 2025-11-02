import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { checkin } = await req.json();
    
    console.log('Monitoring wellness checkin:', checkin);

    // Define critical thresholds
    const CRITICAL_PAIN = 8;
    const CRITICAL_DEPRESSION = 8;
    const CRITICAL_ANXIETY = 8;
    const CRITICAL_4P_THRESHOLD = 30;

    const alerts = [];

    // Check pain scale
    if (checkin.pain_scale >= CRITICAL_PAIN) {
      alerts.push({
        type: 'critical_pain',
        severity: 'critical',
        message: `Critical pain level reported: ${checkin.pain_scale}/10`,
      });
    }

    // Check depression
    if (checkin.depression_scale >= CRITICAL_DEPRESSION) {
      alerts.push({
        type: 'critical_depression',
        severity: 'critical',
        message: `Critical depression level: ${checkin.depression_scale}/10`,
      });
    }

    // Check anxiety
    if (checkin.anxiety_scale >= CRITICAL_ANXIETY) {
      alerts.push({
        type: 'critical_anxiety',
        severity: 'critical',
        message: `Critical anxiety level: ${checkin.anxiety_scale}/10`,
      });
    }

    // Check 4P scores
    const avg4P = (checkin.p_physical + checkin.p_psychological + checkin.p_psychosocial + checkin.p_purpose) / 4;
    if (avg4P <= CRITICAL_4P_THRESHOLD) {
      alerts.push({
        type: 'critical_wellness',
        severity: 'critical',
        message: `Critical wellness score: ${Math.round(avg4P)}/100`,
      });
    }

    // Send notifications for critical alerts
    if (alerts.length > 0) {
      // Get case info
      const { data: caseData } = await supabaseClient
        .from('cases')
        .select('id, client_id')
        .eq('id', checkin.case_id)
        .single();

      if (caseData) {
        // Get assigned RN/attorney
        const { data: assignments } = await supabaseClient
          .from('case_assignments')
          .select('user_id, role')
          .eq('case_id', caseData.id);

        // Notify assigned team members
        for (const assignment of assignments || []) {
          for (const alert of alerts) {
            await supabaseClient.from('notifications').insert({
              user_id: assignment.user_id,
              title: '🚨 Critical Wellness Alert',
              message: alert.message,
              type: 'error',
              link: `/case-detail/${caseData.id}`,
              metadata: {
                checkin_id: checkin.id,
                case_id: caseData.id,
                alert_type: alert.type,
              },
            });
          }
        }

        // Notify all RN directors and compliance
        const { data: directors } = await supabaseClient
          .from('user_roles')
          .select('user_id')
          .in('role', ['RN_CCM_DIRECTOR', 'COMPLIANCE_DIRECTOR']);

        for (const director of directors || []) {
          for (const alert of alerts) {
            await supabaseClient.from('notifications').insert({
              user_id: director.user_id,
              title: '🚨 Critical Wellness Alert',
              message: alert.message,
              type: 'error',
              link: `/case-detail/${caseData.id}`,
              metadata: {
                checkin_id: checkin.id,
                case_id: caseData.id,
                alert_type: alert.type,
              },
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alerts,
        alertCount: alerts.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in wellness-monitor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
