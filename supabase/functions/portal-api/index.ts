import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit: 100 requests per 15 minutes per user
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
};

interface ShareRequest {
  caseId: string;
  providerId: string;
  ttlHours: number;
  redacted: boolean;
}

interface RevokeRequest {
  token: string;
  reason: string;
}

interface ConsentRevokeRequest {
  caseId: string;
  reason: string;
}

interface FaxRequest {
  caseId: string;
  providerId: string;
  faxNumber: string;
  documentId: string;
}

interface PurgeRequest {
  maxAgeDays: number;
}

interface ProviderNoteRequest {
  token: string;
  note: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get authenticated user from JWT
  const authHeader = req.headers.get('authorization');
  let userId: string | undefined;
  
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('[portal-api] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    userId = user?.id;
  }

  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Rate limiting
  const clientId = getClientIdentifier(req, userId);
  const rateLimit = checkRateLimit(clientId, RATE_LIMIT_CONFIG);
  
  if (rateLimit.isLimited) {
    console.warn(`[portal-api] Rate limit exceeded for ${clientId}`);
    return createRateLimitResponse(rateLimit.resetAt);
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/portal-api', '');
  
  console.log(`[portal-api] ${req.method} ${path} - User: ${userId}`);

  try {
    // POST /api/portal/share - Create portal share
    if (path === '/api/portal/share' && req.method === 'POST') {
      const body: ShareRequest = await req.json();
      console.log('[portal-api] Creating share:', { caseId: body.caseId, providerId: body.providerId });

      // Generate token
      const token = `tok_${crypto.randomUUID().replace(/-/g, '')}`;
      const expiresAt = new Date(Date.now() + body.ttlHours * 3600 * 1000).toISOString();

      // TODO: Store in portal_shares table
      // For now, return mock response
      
      // Log audit event
      console.log('[AUDIT] PROVIDER_SHARE_PORTAL', {
        caseId: body.caseId,
        providerId: body.providerId,
        tokenId: token,
        ttlHours: body.ttlHours,
        redacted: body.redacted
      });

      return new Response(
        JSON.stringify({
          ok: true,
          token,
          expiresAt,
          url: `/provider/preview?token=${token}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /api/portal/validate - Validate token
    if (path.startsWith('/api/portal/validate') && req.method === 'GET') {
      const token = url.searchParams.get('token');
      console.log('[portal-api] Validating token:', token);

      if (!token) {
        return new Response(
          JSON.stringify({ ok: false, status: 'INVALID', code: 'TOKEN_MISSING' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // TODO: Query portal_shares table
      // For now, return mock validation
      
      return new Response(
        JSON.stringify({
          ok: true,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          scope: { redacted: true }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /api/portal/view - View portal content
    if (path.startsWith('/api/portal/view') && req.method === 'GET') {
      const token = url.searchParams.get('token');
      console.log('[portal-api] Viewing portal:', token);

      if (!token) {
        return new Response(
          JSON.stringify({ ok: false, status: 'INVALID', code: 'TOKEN_MISSING' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // TODO: Validate token and fetch case data
      // Log audit event
      console.log('[AUDIT] PORTAL_VIEW', { token });

      return new Response(
        JSON.stringify({
          ok: true,
          caseId: 'RCMS-01234',
          clientLabel: 'A.B.',
          redacted: true,
          summary: 'Conservative care in progress; PT scheduled; monitoring pain and function.',
          attachments: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/portal/revoke - Revoke single token
    if (path === '/api/portal/revoke' && req.method === 'POST') {
      const body: RevokeRequest = await req.json();
      console.log('[portal-api] Revoking token:', body.token, 'Reason:', body.reason);

      // TODO: Update portal_shares table status to REVOKED
      
      // Log audit event
      console.log('[AUDIT] TOKEN_REVOKED', { token: body.token, reason: body.reason });

      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/consent/revoke - Revoke consent
    if (path === '/api/consent/revoke' && req.method === 'POST') {
      const body: ConsentRevokeRequest = await req.json();
      console.log('[portal-api] Revoking consent for case:', body.caseId, 'Reason:', body.reason);

      // TODO: Update case consent status and revoke all active tokens
      
      // Log audit event
      console.log('[AUDIT] CONSENT_REVOKED', { caseId: body.caseId, reason: body.reason });

      return new Response(
        JSON.stringify({ 
          ok: true, 
          caseStatus: 'HOLD_SENSITIVE', 
          revokedTokens: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/portal/fax - Send fax
    if (path === '/api/portal/fax' && req.method === 'POST') {
      const body: FaxRequest = await req.json();
      console.log('[portal-api] Sending fax:', body);

      // TODO: Integrate with fax service
      const jobId = `FAX-${Date.now()}`;
      
      // Log audit event
      console.log('[AUDIT] FAX_SENT', { 
        caseId: body.caseId, 
        providerId: body.providerId, 
        faxNumber: body.faxNumber,
        jobId 
      });

      return new Response(
        JSON.stringify({ ok: true, jobId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /api/portal/audit - Query audit events
    if (path.startsWith('/api/portal/audit') && req.method === 'GET') {
      const caseId = url.searchParams.get('caseId');
      const action = url.searchParams.get('action');
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');
      const limit = parseInt(url.searchParams.get('limit') || '100');

      console.log('[portal-api] Querying audit:', { caseId, action, from, to, limit });

      // TODO: Query audit_log table with filters
      
      return new Response(
        JSON.stringify({ ok: true, events: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/portal/purge-pending - Purge old incomplete intakes
    if (path === '/api/portal/purge-pending' && req.method === 'POST') {
      const body: PurgeRequest = await req.json();
      console.log('[portal-api] Purging pending cases older than:', body.maxAgeDays, 'days');

      // TODO: Delete incomplete intakes older than maxAgeDays
      
      // Log audit event
      console.log('[AUDIT] PURGE_PENDING_CASES', { maxAgeDays: body.maxAgeDays });

      return new Response(
        JSON.stringify({ ok: true, purged: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/portal/provider-note - Provider submits note
    if (path === '/api/portal/provider-note' && req.method === 'POST') {
      const body: ProviderNoteRequest = await req.json();
      console.log('[portal-api] Provider note received:', { token: body.token?.slice(0, 10) + '...' });

      // TODO: Validate token and store note in portal_provider_notes table
      
      // Log audit event
      console.log('[AUDIT] PROVIDER_NOTE_SUBMITTED', { 
        token: body.token,
        noteLength: body.note.length 
      });

      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route not found
    return new Response(
      JSON.stringify({ ok: false, error: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[portal-api] Error:', error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
