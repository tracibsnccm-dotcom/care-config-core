import { supabaseInsert } from '@/lib/supabaseRest';

interface NoteParams {
  caseId: string;
  noteType: 'system' | 'intake' | 'consent' | 'attestation' | 'clinical';
  title: string;
  content: string;
  createdBy: string;
  createdByRole: string;
  visibility: 'client' | 'attorney' | 'rn' | 'all';
}

export async function createAutoNote(params: NoteParams) {
  try {
    const { error } = await supabaseInsert('rc_case_notes', {
      case_id: params.caseId,
      note_type: params.noteType,
      title: params.title,
      content: params.content,
      created_by: params.createdBy,
      created_by_role: params.createdByRole,
      visibility: params.visibility,
      is_auto_generated: true,
      created_at: new Date().toISOString(),
    });
    
    if (error) {
      console.error('Failed to create auto note:', error);
    }
  } catch (e) {
    console.error('Error creating auto note:', e);
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
