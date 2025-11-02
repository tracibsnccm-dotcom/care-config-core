import { supabase } from "@/integrations/supabase/client";

export type RiskLevel = 'RED' | 'ORANGE' | 'YELLOW' | null;
export type ConsentChoice = 'share' | 'no_share' | 'unset';

// Compute risk level based on item code
export function computeRiskLevel(itemCode: string): RiskLevel {
  const RED_FLAGS = new Set([
    'self_harm',
    'suicide_thoughts',
    'suicidal_ideation'
  ]);
  
  const ORANGE_FLAGS = new Set([
    'dv_ipv',
    'intimate_partner_violence',
    'domestic_violence',
    'sexual_assault',
    'sexual_exploitation',
    'stalking',
    'harassment',
    'active_substance_misuse',
    'substance_withdrawal',
    'current_abuse'
  ]);
  
  if (RED_FLAGS.has(itemCode)) return 'RED';
  if (ORANGE_FLAGS.has(itemCode)) return 'ORANGE';
  return null; // Others may be yellow or no flag depending on context
}

// Normalize item text to item code
export function normalizeItemCode(itemText: string): string {
  return itemText
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Save or update a sensitive disclosure
export async function saveSensitiveDisclosure({
  caseId,
  category,
  itemCode,
  selected,
  freeText,
  consentAttorney = 'unset',
  consentProvider = 'unset'
}: {
  caseId: string;
  category: 'substance_use' | 'safety_trauma' | 'stressors';
  itemCode: string;
  selected: boolean;
  freeText?: string;
  consentAttorney?: ConsentChoice;
  consentProvider?: ConsentChoice;
}) {
  const riskLevel = computeRiskLevel(itemCode);
  
  const { data: existing } = await supabase
    .from('client_sensitive_disclosures')
    .select('id')
    .eq('case_id', caseId)
    .eq('category', category)
    .eq('item_code', itemCode)
    .single();
  
  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('client_sensitive_disclosures')
      .update({
        selected,
        free_text: freeText || null,
        risk_level: riskLevel,
        consent_attorney: consentAttorney,
        consent_provider: consentProvider,
        consent_ts: consentAttorney !== 'unset' || consentProvider !== 'unset' ? new Date().toISOString() : null,
        audit_event: 'updated'
      })
      .eq('id', existing.id);
    
    if (error) throw error;
  } else {
    // Insert new
    const { data: user } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('client_sensitive_disclosures')
      .insert({
        case_id: caseId,
        category,
        item_code: itemCode,
        selected,
        free_text: freeText || null,
        risk_level: riskLevel,
        origin_section: 'sensitive_section',
        created_by: user.user?.id,
        consent_attorney: consentAttorney,
        consent_provider: consentProvider,
        audit_event: 'added'
      });
    
    if (error) throw error;
  }
  
  // Update case flag
  await supabase
    .from('cases')
    .update({ has_sensitive_disclosures: true })
    .eq('id', caseId);
  
  // If RED or ORANGE, create alert
  if (riskLevel === 'RED' || riskLevel === 'ORANGE') {
    await createSafetyAlert(caseId, itemCode, riskLevel);
  }
}

// Create safety alert for RN CM
async function createSafetyAlert(caseId: string, itemCode: string, riskLevel: RiskLevel) {
  const severity = riskLevel === 'RED' ? 'critical' : 'high';
  const alertType = riskLevel === 'RED' ? 'CRITICAL_SAFETY' : 'HIGH_SAFETY';
  
  const messages: Record<string, string> = {
    self_harm: 'Client disclosed self-harm. Immediate RN CM review required.',
    suicide_thoughts: 'Client disclosed suicidal thoughts. Immediate RN CM review required.',
    dv_ipv: 'Client disclosed domestic/intimate partner violence. Safety assessment needed.',
    sexual_assault: 'Client disclosed sexual assault. Trauma-informed care needed.',
    stalking: 'Client disclosed stalking/harassment. Safety planning needed.',
    active_substance_misuse: 'Client disclosed active substance misuse. Assessment needed.'
  };
  
  const { error } = await supabase
    .from('case_alerts')
    .insert({
      case_id: caseId,
      alert_type: alertType,
      severity,
      message: messages[itemCode] || `Safety concern: ${itemCode}`,
      disclosure_scope: 'internal',
      metadata: {
        item_code: itemCode,
        risk_level: riskLevel,
        origin: 'sensitive_experiences'
      }
    });
  
  if (error) console.error('Error creating safety alert:', error);
}

// Discard all selections in section (Skip Section)
export async function discardSensitiveSection(caseId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  // Mark all as discarded
  const { error: updateError } = await supabase
    .from('client_sensitive_disclosures')
    .update({
      selected: false,
      audit_event: 'discarded',
      audit_note: 'User skipped section'
    })
    .eq('case_id', caseId)
    .eq('created_by', user.user?.id);
  
  if (updateError) throw updateError;
  
  // Log audit event
  const { error: auditError } = await supabase
    .from('audit_events')
    .insert({
      case_id: caseId,
      actor_user_id: user.user?.id,
      event_type: 'sensitive_skipped',
      event_meta: {
        timestamp: new Date().toISOString()
      }
    });
  
  if (auditError) console.error('Error logging audit:', auditError);
}

// Check if consent is required and provided
export async function checkConsentRequired(caseId: string): Promise<{
  required: boolean;
  hasAttorneyConsent: boolean;
  hasProviderConsent: boolean;
}> {
  const { data: disclosures } = await supabase
    .from('client_sensitive_disclosures')
    .select('consent_attorney, consent_provider, selected')
    .eq('case_id', caseId)
    .eq('selected', true);
  
  if (!disclosures || disclosures.length === 0) {
    return { required: false, hasAttorneyConsent: true, hasProviderConsent: true };
  }
  
  // Consent is required if any items are selected
  const hasAttorneyConsent = disclosures.every(d => d.consent_attorney !== 'unset');
  const hasProviderConsent = disclosures.every(d => d.consent_provider !== 'unset');
  
  return {
    required: true,
    hasAttorneyConsent,
    hasProviderConsent
  };
}

// Update consent for all disclosures in a case
export async function updateAllConsent(
  caseId: string,
  consentAttorney: ConsentChoice,
  consentProvider: ConsentChoice
) {
  const { error } = await supabase
    .from('client_sensitive_disclosures')
    .update({
      consent_attorney: consentAttorney,
      consent_provider: consentProvider,
      consent_ts: new Date().toISOString()
    })
    .eq('case_id', caseId)
    .eq('selected', true);
  
  if (error) throw error;
  
  // Log audit event
  const { data: user } = await supabase.auth.getUser();
  await supabase
    .from('audit_events')
    .insert({
      case_id: caseId,
      actor_user_id: user.user?.id,
      event_type: 'consent_updated',
      event_meta: {
        consent_attorney: consentAttorney,
        consent_provider: consentProvider
      }
    });
}

// Load existing disclosures for a case
export async function loadSensitiveDisclosures(caseId: string) {
  const { data, error } = await supabase
    .from('client_sensitive_disclosures')
    .select('*')
    .eq('case_id', caseId)
    .eq('selected', true);
  
  if (error) throw error;
  
  return data || [];
}

// Save mental health screening item (from BH screen)
export async function saveMentalHealthScreening({
  caseId,
  itemCode,
  response,
}: {
  caseId: string;
  itemCode: 'self_harm' | 'suicide_thoughts' | 'depression' | 'anxiety';
  response: 'yes' | 'no' | 'unsure';
}) {
  // Only save if response indicates concern
  const selected = response === 'yes' || response === 'unsure';
  
  if (!selected) return; // Don't persist 'no' responses
  
  const riskLevel = computeRiskLevel(itemCode);
  
  const { data: user } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('client_sensitive_disclosures')
    .upsert({
      case_id: caseId,
      category: 'safety_trauma',
      item_code: itemCode,
      selected: true,
      risk_level: riskLevel,
      origin_section: 'bh_screen',
      created_by: user.user?.id,
      free_text: `Behavioral health screening response: ${response}`,
      audit_event: 'added'
    }, {
      onConflict: 'case_id,category,item_code'
    });
  
  if (error) throw error;
  
  // Update case flag
  await supabase
    .from('cases')
    .update({ has_sensitive_disclosures: true })
    .eq('id', caseId);
  
  // If RED, create alert
  if (riskLevel === 'RED') {
    await createSafetyAlert(caseId, itemCode, riskLevel);
  }
}
