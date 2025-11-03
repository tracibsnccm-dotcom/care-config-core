import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('VITE_SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    console.log('Starting daily RN metrics calculation...')

    // Call the database function to calculate metrics for today
    const { data, error } = await supabaseClient.rpc('calculate_rn_daily_metrics', {
      p_date: new Date().toISOString().split('T')[0]
    })

    if (error) {
      console.error('Error calculating RN metrics:', error)
      throw error
    }

    console.log('RN metrics calculated successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'RN daily metrics calculated successfully',
        date: new Date().toISOString().split('T')[0]
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in calculate-rn-metrics function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
