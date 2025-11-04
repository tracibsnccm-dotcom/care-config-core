import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the previous month (since this runs on the 1st)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const reportMonth = lastMonth.toISOString().split('T')[0];

    console.log(`Generating monthly reports for: ${reportMonth}`);

    // Call the database function to generate all reports
    const { data, error } = await supabaseClient.rpc(
      'generate_all_attorney_monthly_reports',
      { p_report_month: reportMonth }
    );

    if (error) {
      console.error('Error generating reports:', error);
      throw error;
    }

    console.log('Reports generated successfully:', data);

    // Optionally notify attorneys that their reports are ready
    if (data.attorneys_processed > 0) {
      const { error: notifyError } = await supabaseClient.rpc('notify_roles', {
        role_names: ['ATTORNEY'],
        notification_title: 'Monthly Time Savings Report Available',
        notification_message: `Your ${lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' })} time savings report is now available`,
        notification_type: 'info',
        notification_link: '/attorney-settings?tab=reports'
      });

      if (notifyError) {
        console.error('Error sending notifications:', notifyError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated reports for ${data.attorneys_processed} attorneys`,
        data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});