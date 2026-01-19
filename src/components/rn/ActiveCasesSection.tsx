import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CaseItem {
  id: string;
  case_number: string;
  client_name: string;
  date_of_injury: string | null;
  case_type: string | null;
}

export default function ActiveCasesSection() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  async function fetchCases() {
    console.log('ActiveCasesSection: Starting fetch with raw fetch...');
    
    try {
      const rnUserId = 'dd8b2a3b-a924-414f-854f-75737d173090';
      const supabaseUrl = 'https://zmjxyspizdqhrtdcgkwk.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptanh5c3BpemRxaHJ0ZGNna3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjgxODMsImV4cCI6MjA3OTcwNDE4M30.i5rqJXZPSHYFeaA8E26Vh69UPzgCmhrU9zL2kdE8jrM';
      
      // Get cases for this RN with client_id, date_of_injury, case_type
      const casesUrl = `${supabaseUrl}/rest/v1/rc_cases?is_superseded=eq.false&select=id,case_number,client_id,date_of_injury,case_type&rn_cm_id=eq.${rnUserId}`;
      
      const casesResponse = await fetch(casesUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const casesData = await casesResponse.json();
      
      if (!casesData || casesData.length === 0) {
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
        
        const clientsResponse = await fetch(clientsUrl, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        const clientsData = await clientsResponse.json();
        
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
      
      if (activeCases.length > 0) {
        const formatted = activeCases.map((c: any) => ({
          id: c.id,
          case_number: c.case_number || 'No Case #',
          client_name: clientsMap[c.client_id] || 'Unknown Client',
          date_of_injury: c.date_of_injury,
          case_type: c.case_type
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

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  }

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
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
              marginBottom: '8px', 
              borderRadius: '4px',
              borderLeft: '4px solid #10b981',
              overflow: 'hidden'
            }}>
              {/* Collapsed Header - Always Visible */}
              <div 
                onClick={() => toggleExpand(c.id)}
                style={{ 
                  padding: '12px', 
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    backgroundColor: '#10b981' 
                  }}></div>
                  <div>
                    <strong>{c.case_number}</strong>
                    <span style={{ color: '#666', marginLeft: '8px' }}>- {c.client_name}</span>
                  </div>
                </div>
                {expandedId === c.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              
              {/* Expanded Details */}
              {expandedId === c.id && (
                <div style={{ 
                  padding: '0 12px 12px 12px', 
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '12px',
                    marginTop: '12px',
                    fontSize: '14px'
                  }}>
                    <div>
                      <span style={{ color: '#666' }}>Date of Injury:</span>
                      <p style={{ margin: '4px 0 0 0', fontWeight: '500' }}>{formatDate(c.date_of_injury)}</p>
                    </div>
                    <div>
                      <span style={{ color: '#666' }}>Case Type:</span>
                      <p style={{ margin: '4px 0 0 0', fontWeight: '500' }}>{c.case_type || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/cases/${c.id}`;
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Open Case
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/rn/case/${c.id}/workflow`;
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      View/Edit Care Plan
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
