/**
 * Create an automatic case note that can be called from anywhere in the app.
 * Auto notes are system-generated and don't have a created_by user.
 */
export async function createAutoNote({
  caseId,
  noteType,
  title,
  content,
  triggerEvent,
  visibleToClient = false,
  visibleToRN = false,
  visibleToAttorney = false
}: {
  caseId: string;
  noteType: string;
  title: string;
  content: string;
  triggerEvent: string;
  visibleToClient?: boolean;
  visibleToRN?: boolean;
  visibleToAttorney?: boolean;
}) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Determine visibility string based on boolean flags
  // Note: Attorney always has access to notes for their cases, so visibleToAttorney is mainly for filtering
  let visibility = 'private';
  if (visibleToClient && visibleToRN && visibleToAttorney) {
    visibility = 'shared_all';
  } else if (visibleToRN && visibleToAttorney) {
    visibility = 'shared_rn'; // RN and Attorney (attorney always has access)
  } else if (visibleToClient && visibleToRN) {
    visibility = 'shared_rn'; // Client and RN (will show to attorney too)
  } else if (visibleToRN) {
    visibility = 'shared_rn';
  } else if (visibleToClient) {
    visibility = 'shared_client';
  }
  // If none are set, visibility remains 'private' (attorney still sees it)
  
  const noteData = {
    case_id: caseId,
    title: title,
    content: content,
    note_type: triggerEvent,
    created_by: null,
    created_by_role: null,
    visibility: visibility,
    is_auto_generated: true,
    created_at: new Date().toISOString(),
  };

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rc_case_notes`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(noteData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create auto note:', errorText);
      throw new Error(`Failed to create auto note: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating auto note:', error);
    throw error;
  }
}

export function generateIntakeNote(clientName: string, intakeId: string, attorneyCode: string): string {
  const now = new Date().toLocaleString();
  return `INTAKE SUBMISSION
Date/Time: ${now}
Client: ${clientName}
Intake ID: ${intakeId}
Attorney Code: ${attorneyCode}

Client completed intake form and submitted for attorney review.
Intake is pending attorney confirmation within 48 hours.`;
}

export function generateConsentNote(signatures: {
  serviceAgreement?: string;
  legalDisclosure?: string;
  obtainRecords?: string;
  healthcareCoord?: string;
  hipaa?: string;
}): string {
  const now = new Date().toLocaleString();
  return `CONSENT DOCUMENTATION
Date/Time: ${now}

The following consents were signed:

1. Service Agreement
   Signature: ${signatures.serviceAgreement || 'N/A'}
   
2. Legal Disclosure
   Signature: ${signatures.legalDisclosure || 'N/A'}
   
3. Authorization to Obtain Records
   Signature: ${signatures.obtainRecords || 'N/A'}
   
4. Healthcare Coordination
   Signature: ${signatures.healthcareCoord || 'N/A'}
   
5. HIPAA Privacy Notice
   Signature: ${signatures.hipaa || 'N/A'}

All required consents have been obtained and documented.`;
}

export function generateAttestationNote(attorneyId: string, caseNumber: string, action: 'confirmed' | 'declined'): string {
  const now = new Date().toLocaleString();
  if (action === 'confirmed') {
    return `ATTORNEY ATTESTATION - CONFIRMED
Date/Time: ${now}
Attorney ID: ${attorneyId}
Case Number: ${caseNumber}

Attorney has confirmed client relationship and authorized access to Protected Health Information (PHI) for care management purposes.

Case is now active and ready for RN assignment.`;
  } else {
    return `ATTORNEY ATTESTATION - DECLINED
Date/Time: ${now}
Attorney ID: ${attorneyId}

Attorney has indicated this is not their client.
Intake has been marked as declined and access is disabled.`;
  }
}
