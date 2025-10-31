import { supabase } from "@/integrations/supabase/client";

export interface AttorneySLA {
  id: string;
  attorney_code: string;
  response_time_hours: number;
  auto_accept: boolean;
  fee_amount: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class AttorneySLAService {
  /**
   * Get SLA configuration for an attorney
   */
  static async getSLA(attorneyCode: string): Promise<{ success: boolean; sla?: AttorneySLA; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('attorney_sla')
        .select('*')
        .eq('attorney_code', attorneyCode.toUpperCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching attorney SLA:', error);
        return { success: false, error: error.message };
      }

      return { success: true, sla: data || undefined };
    } catch (error) {
      console.error('Exception fetching attorney SLA:', error);
      return { success: false, error: 'Failed to fetch attorney SLA' };
    }
  }

  /**
   * Create or update attorney SLA configuration
   */
  static async upsertSLA(sla: Partial<AttorneySLA> & { attorney_code: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('attorney_sla')
        .upsert({
          attorney_code: sla.attorney_code.toUpperCase(),
          response_time_hours: sla.response_time_hours || 24,
          auto_accept: sla.auto_accept || false,
          fee_amount: sla.fee_amount,
          is_active: sla.is_active !== undefined ? sla.is_active : true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'attorney_code' });

      if (error) {
        console.error('Error upserting attorney SLA:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception upserting attorney SLA:', error);
      return { success: false, error: 'Failed to save attorney SLA' };
    }
  }

  /**
   * Check if an assignment offer has expired based on SLA
   */
  static async isOfferExpired(attorneyCode: string, offeredAt: Date): Promise<boolean> {
    const result = await this.getSLA(attorneyCode);
    
    if (!result.success || !result.sla) {
      // Default to 24 hours if no SLA found
      const hoursSinceOffer = (Date.now() - offeredAt.getTime()) / (1000 * 60 * 60);
      return hoursSinceOffer > 24;
    }

    const hoursSinceOffer = (Date.now() - offeredAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceOffer > result.sla.response_time_hours;
  }

  /**
   * Get all active attorney SLAs
   */
  static async getAllActiveSLAs(): Promise<{ success: boolean; slas?: AttorneySLA[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('attorney_sla')
        .select('*')
        .eq('is_active', true)
        .order('attorney_code', { ascending: true });

      if (error) {
        console.error('Error fetching attorney SLAs:', error);
        return { success: false, error: error.message };
      }

      return { success: true, slas: data || [] };
    } catch (error) {
      console.error('Exception fetching attorney SLAs:', error);
      return { success: false, error: 'Failed to fetch attorney SLAs' };
    }
  }
}
