import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpCircle, Clock, ArrowLeft, Eye, AlertTriangle, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { AttorneyAttestationCard } from '@/components/AttorneyAttestationCard';
import { formatHMS, COMPLIANCE_COPY } from '@/constants/compliance';
import { useAuth } from '@/auth/supabaseAuth';

interface IntakeRow {
  case_id: string;
  client: string;
  stage: string;
  last_activity_iso: string;
  expires_iso: string;
  nudges: number;
  my_client: boolean;
}

interface PendingIntake {
  id: string;
  case_id: string;
  intake_submitted_at: string;
  attorney_confirm_deadline_at: string;
  attorney_attested_at: string | null;
  intake_json: any;
  created_at: string;
  rc_cases?: {
    client_id?: string;
    attorney_id?: string;
  };
}

export const AttorneyIntakeTracker = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<IntakeRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [filter, setFilter] = useState<'all' | 'lt72' | 'lt24'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [autoNudge, setAutoNudge] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedIntake, setSelectedIntake] = useState<PendingIntake | null>(null);
  const [loadingIntake, setLoadingIntake] = useState(false);
  const [resolution, setResolution] = useState<null | "CONFIRMED" | "DECLINED">(null);

  const calculateTTL = (expiresIso: string) => {
    const ms = Math.max(0, new Date(expiresIso).getTime() - Date.now());
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const label = `${d}d ${h}h`;
    
    let className = 'text-green-600';
    if (ms <= 24 * 3600000) className = 'text-destructive font-bold';
    else if (ms <= 72 * 3600000) className = 'text-yellow-600 font-semibold';
    
    return { ms, label, className };
  };

  const getRiskLevel = (expiresIso: string) => {
    const { ms } = calculateTTL(expiresIso);
    if (ms <= 24 * 3600000) return { level: 'High', variant: 'destructive' as const };
    if (ms <= 72 * 3600000) return { level: 'Medium', variant: 'default' as const };
    return { level: 'Low', variant: 'secondary' as const };
  };

  const loadData = async () => {
    try {
      // Query rc_client_intakes for pending attorney confirmations
      // Pending = attorney_attested_at IS NULL AND deadline exists AND deadline > now
      let query = supabase
        .from('rc_client_intakes')
        .select(`
          id,
          case_id,
          intake_submitted_at,
          attorney_confirm_deadline_at,
          attorney_attested_at,
          intake_json,
          created_at,
          rc_cases!inner (
            client_id,
            attorney_id
          )
        `)
        .is('attorney_attested_at', null)
        .not('attorney_confirm_deadline_at', 'is', null)
        .gt('attorney_confirm_deadline_at', new Date().toISOString());

      // If "mine" scope, filter by attorney_id in cases
      if (scope === 'mine' && user) {
        // Get attorney rc_user id if available
        const { data: rcUser } = await supabase
          .from('rc_users')
          .select('id')
          .eq('auth_user_id', user.id)
          .eq('role', 'attorney')
          .single();

        if (rcUser?.id) {
          query = query.eq('rc_cases.attorney_id', rcUser.id);
        }
      }

      const { data: intakes, error } = await query;

      if (error) throw error;

      // Transform to IntakeRow format for display
      const transformedRows: IntakeRow[] = (intakes || []).map((intake: any) => {
        const caseData = Array.isArray(intake.rc_cases) ? intake.rc_cases[0] : intake.rc_cases;
        return {
          case_id: intake.case_id,
          client: 'Client', // Will need to fetch client name separately if needed
          stage: 'Pending Attorney Confirmation',
          last_activity_iso: intake.intake_submitted_at || new Date().toISOString(),
          expires_iso: intake.attorney_confirm_deadline_at,
          nudges: 0,
          my_client: true,
        };
      });

      setRows(transformedRows);

      // If viewing a specific case, reload its intake data
      // Reset resolution when reloading data
      if (selectedCaseId) {
        setResolution(null);
        loadIntakeForCase(selectedCaseId);
      }
    } catch (error) {
      console.error('Failed to load intakes:', error);
      toast.error('Failed to load intake data');
    }
  };

  const loadIntakeForCase = async (caseId: string) => {
    setLoadingIntake(true);
    try {
      // Fetch the latest intake record for this case (regardless of status)
      const { data, error } = await supabase
        .from('rc_client_intakes')
        .select(`
          id,
          case_id,
          intake_submitted_at,
          attorney_confirm_deadline_at,
          attorney_attested_at,
          intake_json,
          created_at,
          rc_cases!inner (
            client_id,
            attorney_id
          )
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSelectedIntake(data as PendingIntake | null);
    } catch (error) {
      console.error('Failed to load intake:', error);
      toast.error('Failed to load intake details');
      setSelectedIntake(null);
    } finally {
      setLoadingIntake(false);
    }
  };

  const handleViewIntake = (caseId: string) => {
    setSelectedCaseId(caseId);
    setResolution(null); // Reset resolution when viewing a new intake
    loadIntakeForCase(caseId);
  };

  const handleNudge = async (caseId: string) => {
    try {
      const { error } = await supabase.functions.invoke('attorney-intake-tracker', {
        body: { action: 'nudge', case_id: caseId }
      });
      if (error) throw error;
      toast.success('Nudge sent successfully');
      loadData();
    } catch (error) {
      console.error('Nudge error:', error);
      toast.error('Failed to send nudge');
    }
  };

  const handleEscalate = async (caseId: string) => {
    if (!confirm('Escalate this intake to RN CM now?')) return;

    try {
      const { error } = await supabase.functions.invoke('attorney-intake-tracker', {
        body: { action: 'escalate', case_id: caseId }
      });
      if (error) throw error;
      toast.success('Escalated to RN CM');
      loadData();
    } catch (error) {
      console.error('Escalate error:', error);
      toast.error('Failed to escalate');
    }
  };

  const handleBulkNudge = async () => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one client');
      return;
    }

    try {
      await Promise.all(Array.from(selectedIds).map(id => handleNudge(id)));
      setSelectedIds(new Set());
      toast.success(`Sent ${selectedIds.size} nudges`);
    } catch (error) {
      toast.error('Some nudges failed');
    }
  };

  const handleAutoNudgeToggle = (checked: boolean) => {
    setAutoNudge(checked);
    if (checked) {
      localStorage.setItem('rcms_atty_auto_nudge', '1');
    } else {
      localStorage.removeItem('rcms_atty_auto_nudge');
    }
  };

  const filteredRows = rows.filter(row => {
    // Search filter
    const q = searchQuery.toLowerCase().trim();
    if (q && !(row.client.toLowerCase().includes(q) || row.case_id.toLowerCase().includes(q))) {
      return false;
    }

    // Time filter
    const { ms } = calculateTTL(row.expires_iso);
    if (filter === 'lt72' && ms > 72 * 3600000) return false;
    if (filter === 'lt24' && ms > 24 * 3600000) return false;

    return true;
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 60000); // Refresh every minute

    // Check auto-nudge setting
    if (localStorage.getItem('rcms_atty_auto_nudge') === '1') {
      setAutoNudge(true);
    }

    return () => clearInterval(interval);
  }, [scope]);

  // If viewing a specific intake, show attestation card
  if (selectedCaseId && selectedIntake) {
    const caseData = Array.isArray(selectedIntake.rc_cases) 
      ? selectedIntake.rc_cases[0] 
      : selectedIntake.rc_cases;

    // Check if confirmed
    const isConfirmed = !!selectedIntake.attorney_attested_at;

    // Check if expired (deadline exists and has passed, but not confirmed)
    const isExpired = !isConfirmed &&
      !!selectedIntake.attorney_confirm_deadline_at &&
      new Date(selectedIntake.attorney_confirm_deadline_at).getTime() < Date.now();

    // Check if attestation is needed (not confirmed and not expired)
    const needsAttestation = !isConfirmed && !isExpired && !!selectedIntake.attorney_confirm_deadline_at;

    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => {
            setSelectedCaseId(null);
            setSelectedIntake(null);
            setResolution(null); // Reset resolution when leaving
          }}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Intake List
        </Button>

        {/* Only render attestation card if not confirmed - if confirmed, show confirmed state below */}
        {needsAttestation && (
          <AttorneyAttestationCard
            intakeId={selectedIntake.id}
            caseId={selectedIntake.case_id}
            intakeSubmittedAt={selectedIntake.intake_submitted_at}
            attorneyConfirmDeadlineAt={selectedIntake.attorney_confirm_deadline_at}
            attorneyAttestedAt={selectedIntake.attorney_attested_at}
            resolved={resolution}
            onResolved={(res, timestamp, updatedJson) => {
              // Immediately set resolution to stop countdown
              setResolution(res);
              if (res === "CONFIRMED") {
                // Immediately update state with attorney_attested_at to stop countdown
                setSelectedIntake(prev => prev ? {
                  ...prev,
                  attorney_attested_at: timestamp,
                  intake_json: updatedJson
                } : null);
              } else if (res === "DECLINED") {
                // DO NOT set attorney_attested_at; decline is not attestation
                setSelectedIntake(prev => prev ? {
                  ...prev,
                  intake_json: updatedJson
                } : null);
              }
              // Re-fetch latest intake after a short delay to ensure consistency
              setTimeout(() => {
                loadIntakeForCase(selectedCaseId);
              }, 500);
            }}
            onAttested={(attestedAt, updatedJson) => {
              // Keep this for backward compatibility, but resolution state is primary
              setSelectedIntake(prev => prev ? {
                ...prev,
                attorney_attested_at: attestedAt,
                intake_json: updatedJson
              } : null);
            }}
            onAttestationComplete={() => {
              toast.success(resolution === "CONFIRMED" 
                ? 'Attestation complete. You can now view case details.'
                : 'Action complete.');
              // Refresh the intake data to ensure consistency
              loadIntakeForCase(selectedCaseId);
              loadData();
            }}
          />
        )}

        {/* Show confirmed state when attorney_attested_at exists (not in attestation card view) */}
        {isConfirmed && !needsAttestation && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Shield className="w-5 h-5" />
                Confirmed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="default" className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-900">
                  {selectedIntake.attorney_attested_at 
                    ? `Attorney confirmation recorded on ${new Date(selectedIntake.attorney_attested_at).toLocaleString()}.`
                    : 'Attorney confirmation recorded.'}
                </AlertDescription>
              </Alert>
              
              {/* Show receipt if available */}
              {selectedIntake.intake_json?.compliance?.attorney_confirmation_receipt && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Attorney Confirmation Receipt</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Confirmed at:</strong> {new Date(selectedIntake.intake_json.compliance.attorney_confirmation_receipt.confirmed_at).toLocaleString()}</p>
                    <p><strong>Confirmed by:</strong> {selectedIntake.intake_json.compliance.attorney_confirmation_receipt.confirmed_by}</p>
                    <p><strong>Action:</strong> {selectedIntake.intake_json.compliance.attorney_confirmation_receipt.action}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Show declined state when resolved as declined */}
        {resolution === "DECLINED" && (
          <Card className="border-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
                Declined
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="default" className="bg-amber-50 border-amber-200">
                <AlertDescription className="text-amber-900">
                  {selectedIntake.intake_json?.compliance?.attorney_confirmation_receipt?.confirmed_at
                    ? `Marked as not my client on ${new Date(selectedIntake.intake_json.compliance.attorney_confirmation_receipt.confirmed_at).toLocaleString()}. Intake access is disabled.`
                    : 'Marked as not my client. Intake access is disabled.'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {isExpired && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                {COMPLIANCE_COPY.attorneyExpired.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription className="space-y-2">
                  {COMPLIANCE_COPY.attorneyExpired.bodyLines.map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {isConfirmed && !isExpired && (
          <Card>
            <CardContent className="p-6">
              <Button
                onClick={() => window.location.href = `/cases/${selectedCaseId}`}
                className="mt-4"
              >
                View Case Details
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-accent rounded-lg">
        <Clock className="w-5 h-5 text-primary" />
        <strong className="text-foreground">Pending Intakes:</strong>
        <span className="font-bold text-primary">{filteredRows.length}</span>
        <span className="text-sm text-muted-foreground">
          Clients who haven't finished intake yet.
        </span>
        <button
          className="ml-auto w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold hover:bg-primary/80"
          onMouseEnter={() => setShowHelp(true)}
          onMouseLeave={() => setShowHelp(false)}
          onFocus={() => setShowHelp(true)}
          onBlur={() => setShowHelp(false)}
        >
          <HelpCircle className="w-3 h-3" />
        </button>
        {showHelp && (
          <div className="absolute right-0 top-full mt-2 bg-popover border rounded-lg shadow-lg p-3 max-w-sm z-10">
            <p className="text-sm mb-2">
              <strong>Confidentiality Notice:</strong>
              <br />
              All communications, case notes, and uploaded files within Reconcile C.A.R.E. are
              encrypted and stored under HIPAA and attorney–client privilege standards.
            </p>
            <Link
              to="/compliance-and-privacy"
              className="text-xs text-primary hover:underline font-bold"
            >
              View full Compliance Policy
            </Link>
          </div>
        )}
      </div>

      {/* Panel */}
      <Card className="p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-4 border-b bg-muted/30">
          <h2 className="text-xl font-bold text-foreground">Pending Client Intakes</h2>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search by client/case…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48"
            />
            <Select value={scope} onValueChange={(v: any) => setScope(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mine">My clients</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="lt72">Under 72h</SelectItem>
                <SelectItem value="lt24">Under 24h</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleBulkNudge} size="sm">
              Nudge Selected
            </Button>
            <div className="flex items-center gap-2">
              <Checkbox
                id="auto-nudge"
                checked={autoNudge}
                onCheckedChange={handleAutoNudgeToggle}
              />
              <Label htmlFor="auto-nudge" className="text-sm font-bold cursor-pointer">
                Auto-nudge (every 48h)
              </Label>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="p-2 text-left">
                  <Checkbox
                    checked={selectedIds.size === filteredRows.length && filteredRows.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedIds(new Set(filteredRows.map(r => r.case_id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                </th>
                <th className="p-2 text-left font-semibold">Client</th>
                <th className="p-2 text-left font-semibold">Case ID</th>
                <th className="p-2 text-left font-semibold">Stage</th>
                <th className="p-2 text-left font-semibold">Last Activity</th>
                <th className="p-2 text-left font-semibold">Time Remaining</th>
                <th className="p-2 text-left font-semibold">Risk</th>
                <th className="p-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const ttl = calculateTTL(row.expires_iso);
                const risk = getRiskLevel(row.expires_iso);
                const isSelected = selectedIds.has(row.case_id);

                return (
                  <tr key={row.case_id} className="border-b hover:bg-muted/30">
                    <td className="p-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          const newSet = new Set(selectedIds);
                          if (checked) {
                            newSet.add(row.case_id);
                          } else {
                            newSet.delete(row.case_id);
                          }
                          setSelectedIds(newSet);
                        }}
                      />
                    </td>
                    <td className="p-2">{row.client}</td>
                    <td className="p-2">
                      <Button
                        variant="link"
                        onClick={() => handleViewIntake(row.case_id)}
                        className="p-0 h-auto text-primary hover:underline"
                      >
                        {row.case_id}
                      </Button>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline">{row.stage}</Badge>
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {new Date(row.last_activity_iso).toLocaleString()}
                    </td>
                    <td className={`p-2 font-bold ${ttl.className}`}>{ttl.label}</td>
                    <td className="p-2">
                      <Badge variant={risk.variant}>{risk.level}</Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewIntake(row.case_id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View/Attest
                        </Button>
                        <Button size="sm" onClick={() => handleNudge(row.case_id)}>
                          Nudge
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEscalate(row.case_id)}
                        >
                          Escalate
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No pending intakes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Intakes auto-delete after 7 days. "Auto-nudge" sends a reminder every 48h until
            finished or time expires; prompt escalation to RN CM after two nudges or{' '}
            <strong>&lt;24h</strong> remaining.
          </p>
        </div>
      </Card>
    </div>
  );
};
