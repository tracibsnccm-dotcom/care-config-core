import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { caseNumber, pin } = await req.json()

    if (!caseNumber || !pin) {
      return new Response(
        JSON.stringify({ error: 'Case number and PIN required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Find case by case number
    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('rc_cases')
      .select('id, client_pin, case_number, case_status, pin_failed_attempts, pin_locked_until')
      .eq('case_number', caseNumber.toUpperCase().trim())
      .single()

    if (caseError || !caseData) {
      return new Response(
        JSON.stringify({ error: 'Case not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if locked
    if (caseData.pin_locked_until) {
      const lockedUntil = new Date(caseData.pin_locked_until)
      if (lockedUntil > new Date()) {
        return new Response(
          JSON.stringify({ error: 'Account temporarily locked', locked_until: caseData.pin_locked_until }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Verify PIN
    if (caseData.client_pin !== pin.trim()) {
      const attempts = (caseData.pin_failed_attempts || 0) + 1
      const updates: any = { pin_failed_attempts: attempts }
      
      if (attempts >= 5) {
        const lockUntil = new Date()
        lockUntil.setHours(lockUntil.getHours() + 1)
        updates.pin_locked_until = lockUntil.toISOString()
      }
      
      await supabaseAdmin.from('rc_cases').update(updates).eq('id', caseData.id)
      
      return new Response(
        JSON.stringify({ error: 'Invalid PIN', attempts_remaining: Math.max(0, 5 - attempts) }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PIN correct - reset attempts
    await supabaseAdmin
      .from('rc_cases')
      .update({ pin_failed_attempts: 0, pin_locked_until: null })
      .eq('id', caseData.id)

    // Get client info from intake
    const { data: intakeData } = await supabaseAdmin
      .from('rc_client_intakes')
      .select('intake_json')
      .eq('case_id', caseData.id)
      .single()

    const clientEmail = intakeData?.intake_json?.client?.email
    const clientName = intakeData?.intake_json?.client?.fullName || 'Client'

    // Return success with case info
    return new Response(
      JSON.stringify({ 
        success: true,
        case_id: caseData.id,
        case_number: caseData.case_number,
        client_name: clientName,
        client_email: clientEmail
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Client sign-in error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
