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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { caseId, itemCode, riskLevel, message } = await req.json();

    console.log('Creating RN alert notification:', { caseId, itemCode, riskLevel });

    // Get case details
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*, client:client(*)')
      .eq('id', caseId)
      .single();

    if (caseError) {
      throw new Error(`Failed to fetch case: ${caseError.message}`);
    }

    // Get all RN CMs assigned to this case
    const { data: assignments, error: assignError } = await supabase
      .from('case_assignments')
      .select('user_id, users:user_id(email, full_name)')
      .eq('case_id', caseId)
      .eq('role', 'RN_CCM');

    if (assignError) {
      console.error('Error fetching RN assignments:', assignError);
    }

    // Create notification records
    if (assignments && assignments.length > 0) {
      const notifications = assignments.map((assignment: any) => ({
        user_id: assignment.user_id,
        type: riskLevel === 'RED' ? 'critical_alert' : 'high_alert',
        title: `${riskLevel} Safety Alert - Case ${caseId}`,
        message: message,
        metadata: {
          case_id: caseId,
          item_code: itemCode,
          risk_level: riskLevel,
          requires_immediate_action: riskLevel === 'RED'
        },
        read: false,
        created_at: new Date().toISOString()
      }));

      const { error: notifyError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifyError) {
        console.error('Error creating notifications:', notifyError);
      }
    }

    // For RED alerts, also send email notifications if configured
    if (riskLevel === 'RED') {
      // TODO: Integrate with email service (SendGrid, Resend, etc.)
      // For now, we'll just log it
      console.log('RED ALERT - Immediate notification needed for case:', caseId);
      console.log('Assigned RN CMs:', assignments?.map((a: any) => a.users?.email));
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        notified_count: assignments?.length || 0,
        message: 'RN alert notifications created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in notify-rn-alert function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});