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

    console.log('Checking RN CMs who need time entry reminders...');

    // Get all RN CM users
    const { data: rnUsers, error: rnError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'RN_CCM');

    if (rnError) {
      console.error('Error fetching RN users:', rnError);
      throw rnError;
    }

    if (!rnUsers || rnUsers.length === 0) {
      console.log('No RN CM users found');
      return new Response(
        JSON.stringify({ message: 'No RN CM users found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    let remindersCreated = 0;

    // Check each RN CM
    for (const rn of rnUsers) {
      // Check if they have any time entries today
      const { data: entries, error: entriesError } = await supabase
        .from('rn_time_entries')
        .select('id')
        .eq('rn_user_id', rn.user_id)
        .gte('created_at', todayISO)
        .limit(1);

      if (entriesError) {
        console.error(`Error checking entries for RN ${rn.user_id}:`, entriesError);
        continue;
      }

      // If no entries today, send reminder
      if (!entries || entries.length === 0) {
        // Check if they have active case assignments
        const { data: assignments, error: assignError } = await supabase
          .from('case_assignments')
          .select('case_id')
          .eq('user_id', rn.user_id)
          .eq('role', 'RN_CCM')
          .limit(1);

        if (assignError) {
          console.error(`Error checking assignments for RN ${rn.user_id}:`, assignError);
          continue;
        }

        // Only send reminder if they have active cases
        if (assignments && assignments.length > 0) {
          const { error: notifyError } = await supabase
            .from('notifications')
            .insert({
              user_id: rn.user_id,
              title: 'Time Entry Reminder',
              message: 'Don\'t forget to log your time for today! Track your activities to ensure accurate reporting.',
              type: 'info',
              link: '/rn-portal-landing',
              metadata: {
                reminder_type: 'time_entry',
                date: todayISO
              }
            });

          if (notifyError) {
            console.error(`Error creating notification for RN ${rn.user_id}:`, notifyError);
          } else {
            remindersCreated++;
            console.log(`Reminder sent to RN ${rn.user_id}`);
          }
        }
      }
    }

    console.log(`Time entry reminders sent: ${remindersCreated}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${remindersCreated} time entry reminders`,
        reminders_created: remindersCreated
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
