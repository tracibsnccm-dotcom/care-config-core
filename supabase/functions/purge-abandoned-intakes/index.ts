import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authorization (cron secret)
    const authHeader = req.headers.get('authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find ONLY abandoned intakes that are incomplete (IN_PROGRESS)
    const { data: abandonedCases, error: selectError } = await supabase
      .from('cases')
      .select('id, client_number')
      .eq('status', 'IN_PROGRESS')
      .eq('client_type', 'I')
      .lt('created_at', sevenDaysAgo.toISOString());

    if (selectError) {
      console.error('Error finding abandoned intakes:', selectError);
      return new Response(
        JSON.stringify({ error: 'Failed to find abandoned intakes', details: selectError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!abandonedCases || abandonedCases.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No abandoned intakes to purge', purgedCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete only the incomplete records
    const { error: deleteError } = await supabase
      .from('cases')
      .delete()
      .in('id', abandonedCases.map(c => c.id));

    if (deleteError) {
      console.error('Error purging abandoned intakes:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to purge abandoned intakes', details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const purgedIds = abandonedCases.map(c => c.client_number || c.id).join(', ');
    console.log(`Purged ${abandonedCases.length} abandoned intake(s): ${purgedIds}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Purged ${abandonedCases.length} abandoned intakes`,
        purgedCount: abandonedCases.length,
        purgedIds: abandonedCases.map(c => c.client_number || c.id)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
