import { supabase } from "@/integrations/supabase/client";

export interface AttorneyPerformance {
  id: string;
  attorney_code: string;
  total_referrals: number;
  accepted: number;
  declined: number;
  avg_response_time_hours: number | null;
  conversion_rate: number | null;
  last_updated: string;
}

export class AttorneyPerformanceService {
  /**
   * Get performance metrics for an attorney
   */
  static async getPerformance(
    attorneyCode: string
  ): Promise<{ success: boolean; performance?: AttorneyPerformance; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('attorney_performance')
        .select('*')
        .eq('attorney_code', attorneyCode.toUpperCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching attorney performance:', error);
        return { success: false, error: error.message };
      }

      return { success: true, performance: data || undefined };
    } catch (error) {
      console.error('Exception fetching attorney performance:', error);
      return { success: false, error: 'Failed to fetch attorney performance' };
    }
  }

  /**
   * Update performance metrics for an attorney using database function
   */
  static async updatePerformance(
    attorneyCode: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('update_attorney_performance', {
        p_attorney_code: attorneyCode.toUpperCase(),
      });

      if (error) {
        console.error('Error updating attorney performance:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception updating attorney performance:', error);
      return { success: false, error: 'Failed to update attorney performance' };
    }
  }

  /**
   * Get all attorney performance metrics
   */
  static async getAllPerformance(): Promise<{ success: boolean; performances?: AttorneyPerformance[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('attorney_performance')
        .select('*')
        .order('attorney_code', { ascending: true });

      if (error) {
        console.error('Error fetching attorney performances:', error);
        return { success: false, error: error.message };
      }

      return { success: true, performances: data || [] };
    } catch (error) {
      console.error('Exception fetching attorney performances:', error);
      return { success: false, error: 'Failed to fetch attorney performances' };
    }
  }

  /**
   * Get top performing attorneys by acceptance rate
   */
  static async getTopPerformers(
    limit: number = 10
  ): Promise<{ success: boolean; performances?: AttorneyPerformance[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('attorney_performance')
        .select('*')
        .order('accepted', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top performers:', error);
        return { success: false, error: error.message };
      }

      return { success: true, performances: data || [] };
    } catch (error) {
      console.error('Exception fetching top performers:', error);
      return { success: false, error: 'Failed to fetch top performers' };
    }
  }

  /**
   * Calculate and return acceptance rate percentage
   */
  static calculateAcceptanceRate(performance: AttorneyPerformance): number {
    if (performance.total_referrals === 0) return 0;
    return Math.round((performance.accepted / performance.total_referrals) * 100);
  }

  /**
   * Calculate and return decline rate percentage
   */
  static calculateDeclineRate(performance: AttorneyPerformance): number {
    if (performance.total_referrals === 0) return 0;
    return Math.round((performance.declined / performance.total_referrals) * 100);
  }
}
