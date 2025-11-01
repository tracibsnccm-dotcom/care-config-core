import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface IntakeRow {
  case_id: string;
  client: string;
  stage: string;
  last_activity_iso: string;
  expires_iso: string;
  nudges: number;
  my_client: boolean;
}

export const AttorneyIntakeTracker = () => {
  const [rows, setRows] = useState<IntakeRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [filter, setFilter] = useState<'all' | 'lt72' | 'lt24'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [autoNudge, setAutoNudge] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/attorney-intake-tracker?scope=${scope}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRows(data);
      }
    } catch (error) {
      console.error('Failed to load intakes:', error);
      toast.error('Failed to load intake data');
    }
  };

  const handleNudge = async (caseId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/attorney-intake-tracker`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'nudge', case_id: caseId }),
        }
      );

      if (response.ok) {
        toast.success('Nudge sent successfully');
        loadData();
      } else {
        toast.error('Failed to send nudge');
      }
    } catch (error) {
      console.error('Nudge error:', error);
      toast.error('Failed to send nudge');
    }
  };

  const handleEscalate = async (caseId: string) => {
    if (!confirm('Escalate this intake to RN CM now?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/attorney-intake-tracker`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'escalate', case_id: caseId }),
        }
      );

      if (response.ok) {
        toast.success('Escalated to RN CM');
        loadData();
      } else {
        toast.error('Failed to escalate');
      }
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
                      <Link to={`/cases/${row.case_id}`} className="text-primary hover:underline">
                        {row.case_id}
                      </Link>
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
