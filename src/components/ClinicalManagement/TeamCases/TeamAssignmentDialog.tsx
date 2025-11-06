import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TeamCase } from "@/hooks/useTeamCases";

interface TeamAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  case: TeamCase;
  onSuccess: () => void;
}

interface Staff {
  user_id: string;
  display_name: string;
  role: string;
}

export function TeamAssignmentDialog({ open, onOpenChange, case: caseData, onSuccess }: TeamAssignmentDialogProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select(`
            user_id,
            role,
            profiles!inner(display_name)
          `)
          .in('role', ['RN_CCM', 'STAFF']);

        if (error) throw error;

        const staffList = data.map((item: any) => ({
          user_id: item.user_id,
          display_name: item.profiles.display_name,
          role: item.role,
        }));

        setStaff(staffList);
        
        // Pre-select current assignment if exists
        if (caseData.assigned_to) {
          setSelectedStaffId(caseData.assigned_to);
        }
      } catch (error: any) {
        toast({
          title: "Error loading staff",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    if (open) {
      fetchStaff();
    }
  }, [open, caseData.assigned_to]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      toast({
        title: "Error",
        description: "Please select a staff member",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if assignment already exists
      const { data: existingAssignment } = await supabase
        .from('case_assignments')
        .select('*')
        .eq('case_id', caseData.id)
        .eq('user_id', selectedStaffId)
        .single();

      if (!existingAssignment) {
        // Create new assignment
        const { error: assignError } = await supabase
          .from('case_assignments')
          .insert({
            case_id: caseData.id,
            user_id: selectedStaffId,
            role: 'RN_CCM',
          });

        if (assignError) throw assignError;

        // Log reassignment if there was a previous assignment
        if (caseData.assigned_to && caseData.assigned_to !== selectedStaffId) {
          const { error: reassignError } = await supabase
            .from('case_reassignments')
            .insert({
              case_id: caseData.id,
              from_rn_id: caseData.assigned_to,
              to_rn_id: selectedStaffId,
              reassigned_by: (await supabase.auth.getUser()).data.user?.id,
              reason: 'Manual reassignment',
              notes: notes,
            });

          if (reassignError) throw reassignError;
        }
      }

      toast({
        title: "Success",
        description: "Case assigned successfully",
      });

      onSuccess();
      onOpenChange(false);
      setNotes('');
    } catch (error: any) {
      toast({
        title: "Error assigning case",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Case</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Case</div>
            <div className="font-semibold text-foreground">
              {caseData.client_label || caseData.client_number || 'Unknown Client'}
            </div>
          </div>

          {caseData.assigned_to && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Currently Assigned To</div>
              <div className="text-foreground">{caseData.assigned_name}</div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="staff">Assign To *</Label>
            <Select
              value={selectedStaffId}
              onValueChange={setSelectedStaffId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.display_name} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Reason for assignment or any special instructions..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Assigning...' : 'Assign Case'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}