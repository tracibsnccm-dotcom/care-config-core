// src/lib/intakeSessionService.ts
// Service for creating and managing INT intake sessions

// Generate INT-YYMMDD-##X format intake ID
function generateIntakeId(sequenceToday: number): string {
  const today = new Date();
  const yy = today.getFullYear().toString().slice(-2);
  const mm = (today.getMonth() + 1).toString().padStart(2, '0');
  const dd = today.getDate().toString().padStart(2, '0');
  const seq = sequenceToday.toString().padStart(2, '0');
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randomLetter = letters[Math.floor(Math.random() * letters.length)];
  return `INT-${yy}${mm}${dd}-${seq}${randomLetter}`;
}

// Generate secure resume token (not PHI)
function generateResumeToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export interface CreateIntakeSessionParams {
  attorneyId?: string;
  attorneyCode?: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface IntakeSession {
  id: string;
  intakeId: string;
  resumeToken: string;
  attorneyId?: string;
  attorneyCode?: string;
  firstName: string;
  lastName: string;
  email: string;
  currentStep: number;
  formData: any;
  createdAt: string;
  expiresAt: string;
  intakeStatus: string;
}

/**
 * Create or update (upsert) INT intake session after minimum identity is collected
 * If session already exists for this email + attorney within last 24 hours AND not submitted, updates it; otherwise creates new one
 */
export async function createIntakeSession(params: CreateIntakeSessionParams): Promise<IntakeSession> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const emailLower = params.email.trim().toLowerCase();
  
  // Build query to check for existing session by email + attorney_id
  // More strict: same email AND same attorney = same session; different attorney = new session
  let queryUrl = `${supabaseUrl}/rest/v1/rc_client_intake_sessions?email=eq.${emailLower}&select=*`;
  
  // If attorney_id is provided, include it in the query
  if (params.attorneyId) {
    queryUrl += `&attorney_id=eq.${params.attorneyId}`;
  } else if (params.attorneyCode) {
    queryUrl += `&attorney_code=eq.${params.attorneyCode}`;
  }
  
  queryUrl += `&order=created_at.desc&limit=1`;
  
  console.log('[createIntakeSession] Checking for existing session:', { email: emailLower, attorneyId: params.attorneyId, attorneyCode: params.attorneyCode });
  
  const existingResponse = await fetch(
    queryUrl,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  let existingSession: any = null;
  if (existingResponse.ok) {
    const existing = await existingResponse.json();
    if (Array.isArray(existing) && existing.length > 0) {
      existingSession = existing[0];
      console.log('[createIntakeSession] Found existing session:', { 
        id: existingSession.id, 
        intake_id: existingSession.intake_id,
        created_at: existingSession.created_at,
        intake_status: existingSession.intake_status,
        expires_at: existingSession.expires_at 
      });
      
      // STRICT CHECK: Only reuse if ALL conditions are met:
      // 1. Not expired
      // 2. Not submitted/converted
      // 3. Created within last 24 hours
      // 4. Attorney matches (if provided)
      const now = new Date();
      const createdAt = new Date(existingSession.created_at);
      const expiresAt = new Date(existingSession.expires_at);
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      const isExpired = expiresAt < now;
      const isSubmitted = existingSession.intake_status === 'converted' || 
                         existingSession.intake_status === 'submitted' ||
                         existingSession.intake_status === 'completed';
      const isOlderThan24Hours = hoursSinceCreation > 24;
      
      // Check attorney match
      const attorneyMatches = 
        (!params.attorneyId && !params.attorneyCode) || // No attorney specified = match any
        (params.attorneyId && existingSession.attorney_id === params.attorneyId) ||
        (params.attorneyCode && existingSession.attorney_code === params.attorneyCode);
      
      console.log('[createIntakeSession] Session validation:', {
        isExpired,
        isSubmitted,
        isOlderThan24Hours,
        hoursSinceCreation: hoursSinceCreation.toFixed(2),
        attorneyMatches,
        shouldReuse: !isExpired && !isSubmitted && !isOlderThan24Hours && attorneyMatches
      });
      
      if (isExpired || isSubmitted || isOlderThan24Hours || !attorneyMatches) {
        console.log('[createIntakeSession] Session is invalid for reuse, will create new session');
        existingSession = null;
      } else {
        console.log('[createIntakeSession] Reusing existing session:', existingSession.intake_id);
      }
    } else {
      console.log('[createIntakeSession] No existing session found');
    }
  }

  // If existing valid session, update it with current attorney info and return
  if (existingSession) {
    const updateData: any = {
      attorney_id: params.attorneyId || existingSession.attorney_id || null,
      attorney_code: params.attorneyCode || existingSession.attorney_code || null,
      first_name: params.firstName.trim(),
      last_name: params.lastName.trim(),
      updated_at: new Date().toISOString(),
    };

    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/rc_client_intake_sessions?id=eq.${existingSession.id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(updateData),
      }
    );

    if (updateResponse.ok) {
      const updated = await updateResponse.json();
      const session = Array.isArray(updated) ? updated[0] : updated;
      return {
        id: session.id,
        intakeId: session.intake_id,
        resumeToken: session.resume_token,
        attorneyId: session.attorney_id,
        attorneyCode: session.attorney_code,
        firstName: session.first_name,
        lastName: session.last_name,
        email: session.email,
        currentStep: session.current_step,
        formData: session.form_data || {},
        createdAt: session.created_at,
        expiresAt: session.expires_at,
        intakeStatus: session.intake_status,
      };
    }
  }

  // Create new session
  // Use user's local date (not UTC) for INT number generation
  const today = new Date();
  const localYear = today.getFullYear();
  const localMonth = today.getMonth() + 1;
  const localDay = today.getDate();
  
  const yy = localYear.toString().slice(-2);
  const mm = localMonth.toString().padStart(2, '0');
  const dd = localDay.toString().padStart(2, '0');
  const todayPrefix = `INT-${yy}${mm}${dd}-`;

  console.log('[createIntakeSession] Generating new INT number with date:', { yy, mm, dd, prefix: todayPrefix });

  // Get count of existing sessions today (including submitted/converted ones for sequence)
  const countResponse = await fetch(
    `${supabaseUrl}/rest/v1/rc_client_intake_sessions?intake_id=like.${todayPrefix}*&select=intake_id`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  let count = 0;
  if (countResponse.ok) {
    const existing = await countResponse.json();
    count = Array.isArray(existing) ? existing.length : 0;
  }

  const intakeId = generateIntakeId(count + 1);
  console.log('[createIntakeSession] Generated new INT number:', intakeId, '(sequence:', count + 1, ')');
  const resumeToken = generateResumeToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const sessionData = {
    intake_id: intakeId,
    resume_token: resumeToken,
    attorney_id: params.attorneyId || null,
    attorney_code: params.attorneyCode || null,
    first_name: params.firstName.trim(),
    last_name: params.lastName.trim(),
    email: emailLower,
    current_step: 0,
    form_data: {},
    expires_at: expiresAt,
    intake_status: 'in_progress',
  };

  const response = await fetch(
    `${supabaseUrl}/rest/v1/rc_client_intake_sessions`,
    {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(sessionData),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to create intake session:", errorText);
    throw new Error(`Failed to create intake session: ${response.status}`);
  }

  const result = await response.json();
  const session = Array.isArray(result) ? result[0] : result;

  return {
    id: session.id,
    intakeId: session.intake_id,
    resumeToken: session.resume_token,
    attorneyId: session.attorney_id,
    attorneyCode: session.attorney_code,
    firstName: session.first_name,
    lastName: session.last_name,
    email: session.email,
    currentStep: session.current_step,
    formData: session.form_data || {},
    createdAt: session.created_at,
    expiresAt: session.expires_at,
    intakeStatus: session.intake_status,
  };
}

/**
 * Get intake session by resume token
 */
export async function getIntakeSessionByToken(token: string): Promise<IntakeSession | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/rc_client_intake_sessions?resume_token=eq.${token}&select=*`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const result = await response.json();
  if (!result || (Array.isArray(result) && result.length === 0)) {
    return null;
  }

  const session = Array.isArray(result) ? result[0] : result;

  // Check if expired
  if (new Date(session.expires_at) < new Date()) {
    return null;
  }

  return {
    id: session.id,
    intakeId: session.intake_id,
    resumeToken: session.resume_token,
    attorneyId: session.attorney_id,
    attorneyCode: session.attorney_code,
    firstName: session.first_name,
    lastName: session.last_name,
    email: session.email,
    currentStep: session.current_step,
    formData: session.form_data || {},
    createdAt: session.created_at,
    expiresAt: session.expires_at,
    intakeStatus: session.intake_status,
  };
}

/**
 * Update intake session (for autosave)
 */
export async function updateIntakeSession(
  sessionId: string,
  updates: {
    currentStep?: number;
    formData?: any;
    intakeStatus?: string;
    caseId?: string;
  }
): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.currentStep !== undefined) {
    updateData.current_step = updates.currentStep;
  }
  if (updates.formData !== undefined) {
    updateData.form_data = updates.formData;
  }
  if (updates.intakeStatus !== undefined) {
    updateData.intake_status = updates.intakeStatus;
  }
  if (updates.caseId !== undefined) {
    updateData.case_id = updates.caseId;
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/rc_client_intake_sessions?id=eq.${sessionId}`,
    {
      method: 'PATCH',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(updateData),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to update intake session:", errorText);
    throw new Error(`Failed to update intake session: ${response.status}`);
  }
}
