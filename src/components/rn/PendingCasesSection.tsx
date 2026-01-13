import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, ChevronUp, ExternalLink, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

interface CaseItem {
  id: string;
  case_number: string;
  client_name: string;
  date_of_injury?: string;
  case_type?: string;
  fourp_scores?: {
    physical?: number;
    psychological?: number;
    psychosocial?: number;
    professional?: number;
  } | null;
  active_flags_count: number;
  last_checkin_date?: string | null;
}

export default function PendingCasesSection() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingCases();
  }, []);

  async function fetchPendingCases() {
    try {
      console.log('PendingCasesSection: Starting fetch...');
      
      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('PendingCasesSection: Session:', !!session, 'User:', session?.user?.id);
      
      if (!session?.user?.id) {
        console.log('PendingCasesSection: No session, using hardcoded RN ID for testing');
        // Hardcode the test RN's rc_users.id for now
        const rnUserId = 'dd8b2a3b-a924-414f-854f-75737d173090';
        await fetchCasesForRN(rnUserId);
        return;
      }

      // Get rc_users.id
      const { data: rcUser } = await supabase
        .from('rc_users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .single();
      
      console.log('PendingCasesSection: rcUser:', rcUser);
      
      if (rcUser?.id) {
        await fetchCasesForRN(rcUser.id);
      } else {
        console.log('PendingCasesSection: No rcUser found, using hardcoded ID');
        const rnUserId = 'dd8b2a3b-a924-414f-854f-75737d173090';
        await fetchCasesForRN(rnUserId);
      }
    } catch (err) {
      console.error('PendingCasesSection: Error:', err);
      setLoading(false);
    }
  }

  async function fetchCasesForRN(rnId: string) {
    console.log('PendingCasesSection: Fetching cases for RN:', rnId);
    
    // Get cases assigned to this RN with joins
    const { data: casesData, error } = await supabase
      .from('rc_cases')
      .select(`
        id,
        case_number,
        date_of_injury,
        case_type,
        rc_clients (first_name, last_name),
        rc_client_intakes (case_id, attorney_attested_at)
      `)
      .eq('rn_cm_id', rnId);

    console.log('PendingCasesSection: Cases result:', casesData, 'Error:', error);

    if (error) {
      console.error('PendingCasesSection: Error fetching cases:', error);
      setLoading(false);
      return;
    }

    if (!casesData || casesData.length === 0) {
      console.log('PendingCasesSection: No cases found');
      setCases([]);
      setLoading(false);
      return;
    }

    // Get care plans to filter out cases that have care plans
    const caseIds = casesData.map(c => c.id);
    const { data: carePlansData } = await supabase
      .from('rc_care_plans')
      .select('case_id')
      .in('case_id', caseIds);

    const casesWithCarePlans = new Set(carePlansData?.map(cp => cp.case_id) || []);

    // Get latest check-ins for 4P scores
    const { data: checkinsData } = await supabase
      .from('rc_client_checkins')
      .select('case_id, fourp_physical, fourp_psychological, fourp_psychosocial, fourp_professional, created_at')
      .in('case_id', caseIds)
      .order('created_at', { ascending: false });

    // Filter to pending cases: attorney attested but no care plan
    const pendingCases = casesData.filter(c => {
      const intakes = Array.isArray(c.rc_client_intakes) ? c.rc_client_intakes : (c.rc_client_intakes ? [c.rc_client_intakes] : []);
      const intake = intakes.find((i: any) => i.case_id === c.id) || intakes[0];
      const attorneyAttested = !!intake?.attorney_attested_at;
      return attorneyAttested && !casesWithCarePlans.has(c.id);
    });

    const formattedCases: CaseItem[] = pendingCases.map(c => {
      const client = Array.isArray(c.rc_clients) ? c.rc_clients[0] : c.rc_clients;
      const latestCheckin = checkinsData?.find(ch => ch.case_id === c.id);
      
      return {
        id: c.id,
        case_number: c.case_number || 'No Case Number',
        client_name: client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() : 'Unknown Client',
        date_of_injury: c.date_of_injury,
        case_type: c.case_type,
        fourp_scores: latestCheckin ? {
          physical: latestCheckin.fourp_physical,
          psychological: latestCheckin.fourp_psychological,
          psychosocial: latestCheckin.fourp_psychosocial,
          professional: latestCheckin.fourp_professional,
        } : null,
        active_flags_count: 0, // TODO: Fetch from clinical flags table
        last_checkin_date: latestCheckin?.created_at || null,
      };
    });

    console.log('PendingCasesSection: Formatted pending cases:', formattedCases);
    setCases(formattedCases);
    setLoading(false);
  }

  return (
    <section id="pending-cases" className="mb-6">
      <Card>
        <CardHeader className="bg-amber-50 border-b border-amber-200" style={{ backgroundColor: '#fef3c7' }}>
          <div className="flex justify-between items-center">
            <CardTitle className="text-amber-900">Pending Cases</CardTitle>
            <Badge className="bg-amber-500" style={{ backgroundColor: '#f59e0b' }}>
              {cases.length} Pending
            </Badge>
          </div>
          <CardDescription className="text-amber-700">
            Newly attested cases awaiting initial care plan
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8 text-sm">Loading pending cases...</div>
          ) : cases.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">No pending cases</div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {cases.map((caseItem) => (
                  <Collapsible
                    key={caseItem.id}
                    open={expandedId === caseItem.id}
                    onOpenChange={(open) => setExpandedId(open ? caseItem.id : null)}
                  >
                    <Card className="border-l-4" style={{ borderLeftColor: '#f59e0b' }}>
                      <CollapsibleTrigger className="w-full">
                        <CardContent className="p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-2 h-2 rounded-full bg-amber-500" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{caseItem.case_number}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{caseItem.client_name}</p>
                              </div>
                            </div>
                            {expandedId === caseItem.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-4 px-3">
                          <div className="space-y-3 border-t pt-3 mt-3">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-muted-foreground font-medium">Date of Injury:</span>
                                <p className="mt-0.5">
                                  {caseItem.date_of_injury 
                                    ? format(parseISO(caseItem.date_of_injury), 'MMM d, yyyy')
                                    : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-medium">Case Type:</span>
                                <p className="mt-0.5">{caseItem.case_type || 'N/A'}</p>
                              </div>
                            </div>

                            {caseItem.fourp_scores && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">4P Scores:</p>
                                <div className="grid grid-cols-4 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">P1: </span>
                                    <span className="font-semibold">{caseItem.fourp_scores.physical || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">P2: </span>
                                    <span className="font-semibold">{caseItem.fourp_scores.psychological || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">P3: </span>
                                    <span className="font-semibold">{caseItem.fourp_scores.psychosocial || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">P4: </span>
                                    <span className="font-semibold">{caseItem.fourp_scores.professional || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-muted-foreground font-medium">Active Flags:</span>
                                <p className="mt-0.5">{caseItem.active_flags_count}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-medium">Last Check-in:</span>
                                <p className="mt-0.5">
                                  {caseItem.last_checkin_date
                                    ? format(parseISO(caseItem.last_checkin_date), 'MMM d, yyyy')
                                    : 'Never'}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/cases/${caseItem.id}`);
                                }}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Open Case
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/rn/case/${caseItem.id}/ten-vs`);
                                }}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Start Care Plan
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
