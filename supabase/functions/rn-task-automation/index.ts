import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, domain, severity, income_range, case_id, draft_id } = await req.json();

    console.log('RN task automation request:', { type, domain, severity, income_range, case_id, draft_id });

    // Map SDOH domain names to readable labels
    const domainLabels: Record<string, string> = {
      's_housing': 'Housing Instability',
      's_food': 'Food Insecurity',
      's_transport': 'Transportation',
      's_finance': 'Financial Hardship',
      's_insurance': 'Insurance Gaps',
      's_employment': 'Employment Issues',
      's_support': 'Lack of Social Support',
      's_safety': 'Safety Concerns',
      's_access': 'Healthcare Access'
    };

    // Handle SDOH severity task creation
    if (type === 'sdoh_followup' && domain && severity >= 3) {
      const domainLabel = domainLabels[domain] || domain;
      const severityLabel = severity === 4 ? 'Severe' : 'Significant';
      
      const taskData: any = {
        title: `🚨 ${severityLabel} SDOH: ${domainLabel}`,
        description: `Client reported ${severityLabel.toLowerCase()} issue with ${domainLabel.toLowerCase()} (severity: ${severity}/4). Requires immediate RN follow-up and resource coordination.`,
        status: 'pending',
        created_by: user.id,
      };

      // If we have a case_id, link to it; otherwise store in metadata
      if (case_id) {
        taskData.case_id = case_id;
      } else {
        taskData.metadata = { 
          draft_id, 
          domain, 
          severity,
          flagged_during_intake: true
        };
      }

      const { data: task, error: taskError } = await supabaseClient
        .from('case_tasks')
        .insert(taskData)
        .select()
        .single();

      if (taskError) {
        console.error('Error creating SDOH task:', taskError);
        throw taskError;
      }

      console.log('SDOH task created:', task);

      // Notify RN CM roles
      const { error: notifyError } = await supabaseClient.rpc('notify_roles', {
        role_names: ['RN_CCM', 'RN_CCM_DIRECTOR', 'SUPER_ADMIN'],
        notification_title: `${severityLabel} SDOH Alert: ${domainLabel}`,
        notification_message: `Client intake flagged ${severityLabel.toLowerCase()} ${domainLabel.toLowerCase()}. Immediate follow-up required.`,
        notification_type: severity === 4 ? 'alert' : 'warning',
        notification_link: case_id ? `/case-detail/${case_id}` : '/rn/dashboard',
        notification_metadata: { task_id: task.id, domain, severity, draft_id }
      });

      if (notifyError) {
        console.error('Error sending notifications:', notifyError);
      }

      return new Response(
        JSON.stringify({ success: true, task_id: task.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle income poverty flag
    if (type === 'income_poverty_flag' && income_range) {
      const taskData: any = {
        title: '⚠️ Income Below Poverty Line',
        description: `Client reported household income: ${income_range}. May qualify for additional assistance programs and resources. RN to assess eligibility and provide referrals.`,
        status: 'pending',
        created_by: user.id,
      };

      if (case_id) {
        taskData.case_id = case_id;
      } else {
        taskData.metadata = { 
          draft_id, 
          income_range,
          poverty_flag: true,
          flagged_during_intake: true
        };
      }

      const { data: task, error: taskError } = await supabaseClient
        .from('case_tasks')
        .insert(taskData)
        .select()
        .single();

      if (taskError) {
        console.error('Error creating poverty flag task:', taskError);
        throw taskError;
      }

      console.log('Poverty flag task created:', task);

      // Silent notification to RN CM only (not shown to client)
      const { error: notifyError } = await supabaseClient.rpc('notify_roles', {
        role_names: ['RN_CCM', 'RN_CCM_DIRECTOR', 'SUPER_ADMIN'],
        notification_title: 'Income Poverty Flag',
        notification_message: `Client intake indicates income below poverty line: ${income_range}. Assess for assistance program eligibility.`,
        notification_type: 'info',
        notification_link: case_id ? `/case-detail/${case_id}` : '/rn/dashboard',
        notification_metadata: { task_id: task.id, income_range, draft_id }
      });

      if (notifyError) {
        console.error('Error sending poverty flag notification:', notifyError);
      }

      return new Response(
        JSON.stringify({ success: true, task_id: task.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in rn-task-automation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
