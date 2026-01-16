import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { supabaseGet, supabaseUpdate } from '@/lib/supabaseRest';
import { toast } from 'sonner';

interface CaseItem {
  id: string;
  case_number: string | null;
  client_name: string;
  date_of_injury: string | null;
  case_type: string | null;
  assignment_id: string; // ID from rc_case_assignments
}

interface PendingCasesSectionProps {
  rnUserId: string | null;
}

export default function PendingCasesSection({ rnUserId }: PendingCasesSectionProps) {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (rnUserId) {
      fetchCases();
    } else {
      setLoading(false);
    }
  }, [rnUserId]);

  async function fetchCases() {
    if (!rnUserId) {
      setLoading(false);
      return;
    }

    console.log('PendingCasesSection: Fetching pending assignments for RN:', rnUserId);
    setLoading(true);
    setError(null);
    
    try {
      // Query rc_case_assignments where user_id = rnUserId and status = 'pending_acceptance'
      const { data: assignmentsData, error: assignmentsError } = await supabaseGet(
        'rc_case_assignments',
        `user_id=eq.${rnUserId}&status=eq.pending_acceptance&select=id,case_id`
      );

      if (assignmentsError) {
        console.error('PendingCasesSection: Error loading assignments:', assignmentsError);
        setError(assignmentsError.message);
        setLoading(false);
        return;
      }

      const assignments = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData ? [assignmentsData] : []);

      if (assignments.length === 0) {
        setCases([]);
        setLoading(false);
        return;
      }

      // Get case IDs from assignments
      const caseIds = assignments.map((a: any) => a.case_id).filter(Boolean);
      
      // Query rc_cases for these case IDs
      // PostgREST syntax: id=in.(id1,id2,id3)
      const caseIdsStr = caseIds.join(',');
      const { data: casesData, error: casesError } = await supabaseGet(
        'rc_cases',
        `id=in.(${caseIdsStr})&select=id,case_number,case_type,date_of_injury,client_id`
      );

      if (casesError) {
        console.error('PendingCasesSection: Error loading cases:', casesError);
        setError(casesError.message);
        setLoading(false);
        return;
      }

      const cases = Array.isArray(casesData) ? casesData : (casesData ? [casesData] : []);

      // Get client IDs from cases
      const clientIds = cases.map((c: any) => c.client_id).filter(Boolean);
      
      // Get client names
      let clientsMap: Record<string, string> = {};
      if (clientIds.length > 0) {
        const clientIdsStr = clientIds.join(',');
        const { data: clientsData, error: clientsError } = await supabaseGet(
          'rc_clients',
          `id=in.(${clientIdsStr})&select=id,first_name,last_name`
        );

        if (!clientsError && clientsData) {
          const clients = Array.isArray(clientsData) ? clientsData : [clientsData];
          clients.forEach((client: any) => {
            const fullName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unknown';
            clientsMap[client.id] = fullName;
          });
        }
      }

      // Create a map of case_id to assignment_id
      const assignmentMap = new Map(assignments.map((a: any) => [a.case_id, a.id]));

      // Format cases with assignment info
      const formatted = cases.map((c: any) => ({
        id: c.id,
        case_number: c.case_number || 'No Case #',
        client_name: clientsMap[c.client_id] || 'Unknown Client',
        date_of_injury: c.date_of_injury,
        case_type: c.case_type,
        assignment_id: assignmentMap.get(c.id) || '',
      }));

      setCases(formatted);
      setLoading(false);
    } catch (err: any) {
      console.error('PendingCasesSection: Error:', err);
      setError(err.message || 'Failed to load pending cases');
      setLoading(false);
    }
  }

  async function handleAccept(caseId: string, assignmentId: string) {
    if (!rnUserId) return;

    setProcessingId(caseId);
    try {
      const now = new Date().toISOString();

      // Update assignment to active
      const { error: assignError } = await supabaseUpdate(
        'rc_case_assignments',
        `id=eq.${assignmentId}`,
        {
          status: 'active',
          accepted_at: now,
        }
      );

      if (assignError) {
        throw new Error(`Failed to accept assignment: ${assignError.message}`);
      }

      // Update case status to active
      const { error: caseError } = await supabaseUpdate(
        'rc_cases',
        `id=eq.${caseId}`,
        {
          case_status: 'active',
        }
      );

      if (caseError) {
        console.error('Error updating case status:', caseError);
        // Don't throw - assignment was updated successfully
      }

      toast.success('Case accepted successfully');
      
      // Refresh the list
      await fetchCases();
    } catch (err: any) {
      console.error('Error accepting case:', err);
      toast.error(err.message || 'Failed to accept case');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDecline(caseId: string, assignmentId: string) {
    if (!rnUserId) return;

    setProcessingId(caseId);
    try {
      const now = new Date().toISOString();

      // Update assignment to declined
      const { error: assignError } = await supabaseUpdate(
        'rc_case_assignments',
        `id=eq.${assignmentId}`,
        {
          status: 'declined',
          declined_at: now,
        }
      );

      if (assignError) {
        throw new Error(`Failed to decline assignment: ${assignError.message}`);
      }

      // Update case status back to attorney_confirmed (returns to supervisor queue)
      const { error: caseError } = await supabaseUpdate(
        'rc_cases',
        `id=eq.${caseId}`,
        {
          case_status: 'attorney_confirmed',
        }
      );

      if (caseError) {
        console.error('Error updating case status:', caseError);
        // Don't throw - assignment was updated successfully
      }

      toast.success('Case returned to supervisor');
      
      // Refresh the list
      await fetchCases();
    } catch (err: any) {
      console.error('Error declining case:', err);
      toast.error(err.message || 'Failed to decline case');
    } finally {
      setProcessingId(null);
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

  if (!rnUserId) {
    return null;
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
        <p style={{ color: '#92400e' }}>No pending cases assigned to you</p>
      ) : (
        <div>
          {cases.map(c => {
            const isProcessing = processingId === c.id;
            return (
              <div key={c.id} style={{ 
                backgroundColor: 'white', 
                marginBottom: '8px', 
                borderRadius: '4px',
                borderLeft: '4px solid #f59e0b',
                overflow: 'hidden'
              }}>
                {/* Collapsed Header - Always Visible */}
                <div 
                  onClick={() => !isProcessing && toggleExpand(c.id)}
                  style={{ 
                    padding: '12px', 
                    cursor: isProcessing ? 'default' : 'pointer',
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
                      backgroundColor: '#f59e0b' 
                    }}></div>
                    <div>
                      <strong>{c.case_number}</strong>
                      <span style={{ color: '#666', marginLeft: '8px' }}>- {c.client_name}</span>
                    </div>
                  </div>
                  {!isProcessing && (expandedId === c.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
                  {isProcessing && <span style={{ color: '#666', fontSize: '12px' }}>Processing...</span>}
                </div>
                
                {/* Expanded Details */}
                {expandedId === c.id && !isProcessing && (
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
                    
                    {/* Accept/Decline Buttons */}
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
                          handleAccept(c.id, c.assignment_id);
                        }}
                        disabled={isProcessing}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          opacity: isProcessing ? 0.6 : 1
                        }}
                      >
                        <CheckCircle2 size={16} />
                        Accept
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDecline(c.id, c.assignment_id);
                        }}
                        disabled={isProcessing}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          opacity: isProcessing ? 0.6 : 1
                        }}
                      >
                        <XCircle size={16} />
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
