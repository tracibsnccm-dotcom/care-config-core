import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get report month from request or default to last month
    const { reportMonth } = await req.json().catch(() => ({}));
    const lastMonth = reportMonth || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];

    console.log(`Generating attorney monthly reports for: ${lastMonth}`);

    // Call the database function to generate all reports
    const { data, error } = await supabase.rpc('generate_all_attorney_monthly_reports', {
      p_report_month: lastMonth
    });

    if (error) {
      console.error('Error generating reports:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Reports generated successfully:', data);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Monthly reports generated successfully',
        data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
