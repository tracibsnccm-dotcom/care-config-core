import { useState, useEffect } from 'react';

interface CaseItem {
  id: string;
  case_number: string;
  client_name: string;
}

export default function ActiveCasesSection() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  async function fetchCases() {
    console.log('ActiveCasesSection: Starting fetch with raw fetch...');
    
    try {
      const rnUserId = 'dd8b2a3b-a924-414f-854f-75737d173090';
      const supabaseUrl = 'https://zmjxyspizdqhrtdcgkwk.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptanh5c3BpemRxaHJ0ZGNna3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjgxODMsImV4cCI6MjA3OTcwNDE4M30.i5rqJXZPSHYFeaA8E26Vh69UPzgCmhrU9zL2kdE8jrM';
      
      // Get cases for this RN with client_id
      const casesUrl = `${supabaseUrl}/rest/v1/rc_cases?select=id,case_number,client_id&rn_cm_id=eq.${rnUserId}`;
      console.log('ActiveCasesSection: Fetching cases URL:', casesUrl);
      
      const casesResponse = await fetch(casesUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const casesData = await casesResponse.json();
      console.log('ActiveCasesSection: Cases data:', casesData);
      
      if (!casesData || casesData.length === 0) {
        console.log('ActiveCasesSection: No cases found');
        setCases([]);
        setLoading(false);
        return;
      }
      
      // Get client IDs from cases
      const clientIds = casesData.map((c: any) => c.client_id).filter(Boolean);
      
      // Get client names
      let clientsMap: Record<string, string> = {};
      if (clientIds.length > 0) {
        const clientsUrl = `${supabaseUrl}/rest/v1/rc_clients?select=id,first_name,last_name&id=in.(${clientIds.join(',')})`;
        console.log('ActiveCasesSection: Fetching clients URL:', clientsUrl);
        
        const clientsResponse = await fetch(clientsUrl, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        const clientsData = await clientsResponse.json();
        console.log('ActiveCasesSection: Clients data:', clientsData);
        
        if (clientsData && Array.isArray(clientsData)) {
          clientsData.forEach((client: any) => {
            clientsMap[client.id] = `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unknown';
          });
        }
      }
      
      // Get care plans to find which cases have them
      const carePlansUrl = `${supabaseUrl}/rest/v1/rc_care_plans?select=case_id`;
      const carePlansResponse = await fetch(carePlansUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const carePlansData = await carePlansResponse.json();
      const casesWithCarePlans = new Set(carePlansData?.map((cp: any) => cp.case_id) || []);
      
      // Filter to active cases (those WITH care plans)
      const activeCases = casesData.filter((c: any) => casesWithCarePlans.has(c.id));
      console.log('ActiveCasesSection: Active cases:', activeCases);
      
      if (activeCases.length > 0) {
        const formatted = activeCases.map((c: any) => ({
          id: c.id,
          case_number: c.case_number || 'No Case #',
          client_name: clientsMap[c.client_id] || 'Unknown Client'
        }));
        setCases(formatted);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('ActiveCasesSection: Error:', err);
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ 
      backgroundColor: '#d1fae5', 
      border: '1px solid #10b981', 
      borderRadius: '8px', 
      padding: '16px', 
      marginBottom: '16px' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: '#065f46', margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Active Cases</h3>
        <span style={{ 
          backgroundColor: '#10b981', 
          color: 'white', 
          padding: '4px 12px', 
          borderRadius: '12px', 
          fontSize: '14px' 
        }}>
          {cases.length} Active
        </span>
      </div>
      
      {loading ? (
        <p style={{ color: '#065f46' }}>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>Error: {error}</p>
      ) : cases.length === 0 ? (
        <p style={{ color: '#065f46' }}>No active cases</p>
      ) : (
        <div>
          {cases.map(c => (
            <div key={c.id} style={{ 
              backgroundColor: 'white', 
              padding: '12px', 
              marginBottom: '8px', 
              borderRadius: '4px',
              borderLeft: '4px solid #10b981'
            }}>
              <strong>{c.case_number}</strong> - {c.client_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
