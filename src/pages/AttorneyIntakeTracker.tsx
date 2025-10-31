import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IntakeRow {
  case_id: string;
  client: string;
  stage: string;
  last_activity_iso: string;
  expires_iso: string;
  nudges: number;
  my_client: boolean;
}

export default function AttorneyIntakeTracker() {
  const [rows, setRows] = useState<IntakeRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<IntakeRow[]>([]);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('mine');
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [autoNudge, setAutoNudge] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(() => setFilteredRows([...filteredRows]), 60000);
    return () => clearInterval(interval);
  }, [scope]);

  useEffect(() => {
    const stored = localStorage.getItem('rcms_atty_auto_nudge') === '1';
    setAutoNudge(stored);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [rows, search, filter]);

  async function loadData() {
    const { data, error } = await supabase.functions.invoke('attorney-intake-tracker', {
      body: { action: 'list', scope }
    });
    
    if (error) {
      toast({ title: 'Failed to load intakes', variant: 'destructive' });
      return;
    }
    
    setRows(data || []);
  }

  function applyFilters() {
    const q = search.toLowerCase().trim();
    const filtered = rows.filter(r => {
      if (q && !(r.client.toLowerCase().includes(q) || r.case_id.toLowerCase().includes(q))) return false;
      const ttlMs = getTTLMs(r.expires_iso);
      if (filter === 'lt72' && ttlMs > 72 * 3600000) return false;
      if (filter === 'lt24' && ttlMs > 24 * 3600000) return false;
      return true;
    });
    setFilteredRows(filtered);
  }

  function getTTLMs(expiresIso: string): number {
    return Math.max(0, new Date(expiresIso).getTime() - new Date().getTime());
  }

  function getTTLDisplay(expiresIso: string) {
    const ms = getTTLMs(expiresIso);
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const label = `${d}d ${h}h`;
    let className = 'text-success';
    if (ms <= 24 * 3600000) className = 'text-destructive font-bold';
    else if (ms <= 72 * 3600000) className = 'text-warning font-semibold';
    return { label, className };
  }

  function getRiskTag(expiresIso: string) {
    const ms = getTTLMs(expiresIso);
    if (ms <= 24 * 3600000) return <span className="px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-bold">High</span>;
    if (ms <= 72 * 3600000) return <span className="px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-semibold">Medium</span>;
    return <span className="px-2 py-1 rounded-full bg-success/10 text-success text-xs">Low</span>;
  }

  async function nudgeClient(caseId: string) {
    const { error } = await supabase.functions.invoke('attorney-intake-tracker', {
      body: { action: 'nudge', case_id: caseId }
    });
    
    if (error) {
      toast({ title: 'Failed to send nudge', variant: 'destructive' });
      return;
    }
    
    toast({ title: 'Nudge sent successfully' });
    loadData();
  }

  async function escalateClient(caseId: string) {
    const { error } = await supabase.functions.invoke('attorney-intake-tracker', {
      body: { action: 'escalate', case_id: caseId }
    });
    
    if (error) {
      toast({ title: 'Failed to escalate', variant: 'destructive' });
      return;
    }
    
    toast({ title: 'Escalated to RN CM' });
    loadData();
  }

  function bulkNudge() {
    if (selectedIds.size === 0) {
      toast({ title: 'Select at least one client' });
      return;
    }
    
    Promise.all(Array.from(selectedIds).map(id => nudgeClient(id)))
      .then(() => toast({ title: 'Bulk nudges sent' }));
  }

  function toggleAutoNudge(checked: boolean) {
    setAutoNudge(checked);
    if (checked) localStorage.setItem('rcms_atty_auto_nudge', '1');
    else localStorage.removeItem('rcms_atty_auto_nudge');
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Incomplete Intakes</h1>
          <p className="text-muted-foreground">Monitor and nudge clients to complete their intake</p>
        </div>
        <div className="text-2xl font-bold">{filteredRows.length} pending</div>
      </div>

      <div className="flex gap-4 flex-wrap items-center">
        <Input
          placeholder="Search client or case ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mine">My Clients</SelectItem>
            <SelectItem value="all">All Firm</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="lt72">{'<72h remaining'}</SelectItem>
            <SelectItem value="lt24">{'<24h remaining'}</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={bulkNudge} variant="outline" disabled={selectedIds.size === 0}>
          Bulk Nudge ({selectedIds.size})
        </Button>

        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={autoNudge} onCheckedChange={toggleAutoNudge} />
          <span className="text-sm">Auto-nudge every 48h</span>
        </label>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr className="text-left">
              <th className="p-3">
                <Checkbox
                  checked={selectedIds.size === filteredRows.length && filteredRows.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedIds(new Set(filteredRows.map(r => r.case_id)));
                    else setSelectedIds(new Set());
                  }}
                />
              </th>
              <th className="p-3">Client</th>
              <th className="p-3">Case ID</th>
              <th className="p-3">Stage</th>
              <th className="p-3">Last Activity</th>
              <th className="p-3">Time Remaining</th>
              <th className="p-3">Risk</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const ttl = getTTLDisplay(row.expires_iso);
              return (
                <tr key={row.case_id} className="border-t hover:bg-muted/50">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedIds.has(row.case_id)}
                      onCheckedChange={(checked) => {
                        const newSet = new Set(selectedIds);
                        if (checked) newSet.add(row.case_id);
                        else newSet.delete(row.case_id);
                        setSelectedIds(newSet);
                      }}
                    />
                  </td>
                  <td className="p-3">{row.client}</td>
                  <td className="p-3">
                    <a href={`/cases/${row.case_id}`} target="_blank" className="text-primary hover:underline">
                      {row.case_id}
                    </a>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                      {row.stage}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {new Date(row.last_activity_iso).toLocaleString()}
                  </td>
                  <td className={`p-3 ${ttl.className}`}>{ttl.label}</td>
                  <td className="p-3">{getRiskTag(row.expires_iso)}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => nudgeClient(row.case_id)}>
                        Nudge
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm('Escalate to RN CM now?')) escalateClient(row.case_id);
                        }}
                      >
                        Escalate
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
