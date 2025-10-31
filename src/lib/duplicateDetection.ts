import { supabase } from "@/integrations/supabase/client";

export interface PotentialDuplicate {
  id: string;
  client_number: string | null;
  client_type: string | null;
  status: string | null;
  created_at: string;
  matchReason: string;
}

export class DuplicateDetectionService {
  /**
   * Find potential duplicate clients based on email and name
   * Only checks COMPLETED and CONVERTED cases to avoid false positives with abandoned intakes
   */
  static async findPotentialDuplicates(
    email: string,
    firstName: string,
    lastName: string
  ): Promise<{ success: boolean; duplicates?: PotentialDuplicate[]; error?: string }> {
    try {
      // Query for potential matches
      const { data: cases, error } = await supabase
        .from('cases')
        .select('id, client_number, client_type, status, created_at, consent')
        .or(`consent->>email.eq.${email.toLowerCase()}`)
        .in('status', ['COMPLETED', 'Converted to Attorney']);

      if (error) {
        console.error('Error finding duplicates:', error);
        return { success: false, error: error.message };
      }

      if (!cases || cases.length === 0) {
        return { success: true, duplicates: [] };
      }

      // Check for name matches (case-insensitive)
      const duplicates: PotentialDuplicate[] = cases
        .map(c => {
          const consent = c.consent as any;
          const caseEmail = consent?.email?.toLowerCase();
          const caseFirstName = consent?.firstName?.toLowerCase();
          const caseLastName = consent?.lastName?.toLowerCase();

          let matchReason = '';
          if (caseEmail === email.toLowerCase()) {
            matchReason = 'Email match';
          }
          if (
            caseFirstName === firstName.toLowerCase() &&
            caseLastName === lastName.toLowerCase()
          ) {
            matchReason = matchReason ? `${matchReason}, Name match` : 'Name match';
          }

          if (matchReason) {
            return {
              id: c.id,
              client_number: c.client_number,
              client_type: c.client_type,
              status: c.status,
              created_at: c.created_at,
              matchReason,
            };
          }
          return null;
        })
        .filter(Boolean) as PotentialDuplicate[];

      return { success: true, duplicates };
    } catch (error) {
      console.error('Exception in duplicate detection:', error);
      return { success: false, error: 'Failed to check for duplicates' };
    }
  }

  /**
   * Check if a client should be flagged as a potential duplicate before submission
   */
  static async shouldWarnDuplicate(
    email: string,
    firstName: string,
    lastName: string
  ): Promise<boolean> {
    const result = await this.findPotentialDuplicates(email, firstName, lastName);
    return result.success && (result.duplicates?.length || 0) > 0;
  }
}
