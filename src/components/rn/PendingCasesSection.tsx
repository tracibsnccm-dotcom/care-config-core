import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CaseItem {
  id: string;
  case_number: string;
  client_name: string;
}

export default function PendingCasesSection() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  async function fetchCases() {
    console.log('PendingCasesSection: Starting fetch with hardcoded RN ID');
    
    try {
      // Hardcoded RN ID - bypass all auth
      const rnUserId = 'dd8b2a3b-a924-414f-854f-75737d173090';
      
      const { data, error: queryError } = await supabase
        .from('rc_cases')
        .select('id, case_number, rc_clients(first_name, last_name)')
        .eq('rn_cm_id', rnUserId);

      console.log('PendingCasesSection: Query result:', data, queryError);

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const formatted = data.map(c => ({
          id: c.id,
          case_number: c.case_number || 'No Case #',
          client_name: c.rc_clients 
            ? `${c.rc_clients.first_name || ''} ${c.rc_clients.last_name || ''}`.trim() 
            : 'Unknown'
        }));
        setCases(formatted);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('PendingCasesSection: Error:', err);
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ 
      backgroundColor: '#fef3c7', 
      border: '1px solid #f59e0b', 
      borderRadius: '8px', 
      padding: '16px', 
      marginBottom: '16px' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: '#92400e', margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Pending Cases</h3>
        <span style={{ 
          backgroundColor: '#f59e0b', 
          color: 'white', 
          padding: '4px 12px', 
          borderRadius: '12px', 
          fontSize: '14px' 
        }}>
          {cases.length} Pending
        </span>
      </div>
      
      {loading ? (
        <p style={{ color: '#92400e' }}>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>Error: {error}</p>
      ) : cases.length === 0 ? (
        <p style={{ color: '#92400e' }}>No pending cases</p>
      ) : (
        <div>
          {cases.map(c => (
            <div key={c.id} style={{ 
              backgroundColor: 'white', 
              padding: '12px', 
              marginBottom: '8px', 
              borderRadius: '4px',
              borderLeft: '4px solid #f59e0b'
            }}>
              <strong>{c.case_number}</strong> - {c.client_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
